const fs = require("fs").promises;
const path = require("path");
const db = require("../config/db");
const bcrypt = require("bcrypt");
let cachedConfig = null;

exports.getConfiguracionAplicacion = async (req, res) => {
	try {
		// Si la configuración ya está en caché, devolverla directamente
		if (cachedConfig) {
			return res.json(cachedConfig);
		}

		// Construir la ruta del archivo
		const filePath = path.join(__dirname, "../config/globalConfig.json");

		// Leer el archivo con la codificación correcta
		const rawData = await fs.readFile(filePath, { encoding: "utf8" });

		// Parsear el contenido JSON
		let configuracionGlobal;
		try {
			configuracionGlobal = JSON.parse(rawData);
		} catch (parseError) {
			return res.status(500).json({
				message: "El archivo de configuración no es un JSON válido",
				error: parseError.message,
			});
		}

		// Almacenar la configuración en caché
		cachedConfig = configuracionGlobal;

		// Devolver la configuración como respuesta
		res.json(configuracionGlobal);
	} catch (error) {
		// Manejar errores específicos
		if (error.code === "ENOENT") {
			return res.status(404).json({
				message: "El archivo de configuración no fue encontrado",
				error: error.message,
			});
		}

		// Error genérico
		res.status(500).json({
			message: "Error al obtener la configuración global",
			error: error.message,
		});
	}
};

exports.updateConfiguracionAplicacion = async (req, res) => {
	try {
		const { idioma, zona_horaria, formato_fecha, formato_moneda } = req.body;

		// Validar que se proporcionen todos los campos necesarios
		if (!idioma || !zona_horaria || !formato_fecha || !formato_moneda) {
			return res
				.status(400)
				.json({ message: "Todos los campos son obligatorios." });
		}

		// Validar contenido de los campos
		const validLanguages = ["es", "en", "fr"]; // Ejemplo de idiomas válidos
		const validTimeZones = ["UTC-5", "UTC+1", "UTC+2"]; // Ejemplo de zonas horarias válidas

		if (!validLanguages.includes(idioma)) {
			return res.status(400).json({ message: "Idioma no válido." });
		}

		if (!validTimeZones.includes(zona_horaria)) {
			return res.status(400).json({ message: "Zona horaria no válida." });
		}

		// Construir la ruta del archivo
		const filePath = path.join(__dirname, "../config/globalConfig.json");

		// Leer el archivo existente
		let rawData;
		try {
			rawData = await fs.readFile(filePath, { encoding: "utf8" });
		} catch (readError) {
			return res.status(500).json({
				message: "Error al leer el archivo de configuración",
				error: readError.message,
			});
		}

		// Parsear el contenido JSON
		let configuracionExistente;
		try {
			configuracionExistente = JSON.parse(rawData);
		} catch (parseError) {
			return res.status(500).json({
				message: "El archivo de configuración no es un JSON válido",
				error: parseError.message,
			});
		}

		// Crear una copia de seguridad del archivo original
		const backupPath = path.join(
			__dirname,
			"../config/globalConfig.backup.json",
		);
		await fs.writeFile(backupPath, rawData, "utf8");

		// Actualizar solo los campos proporcionados
		const nuevaConfiguracion = {
			...configuracionExistente,
			idioma,
			zona_horaria,
			formato_fecha,
			formato_moneda,
		};

		// Escribir la nueva configuración en el archivo
		await fs.writeFile(
			filePath,
			JSON.stringify(nuevaConfiguracion, null, 2),
			"utf8",
		);

		// Respuesta exitosa
		res.json({
			message: "Configuración global actualizada correctamente",
			nuevaConfiguracion,
		});
	} catch (error) {
		// Manejar errores específicos
		if (error.code === "ENOENT") {
			return res.status(404).json({
				message: "El archivo de configuración no fue encontrado",
				error: error.message,
			});
		}

		// Error genérico
		res.status(500).json({
			message: "Error al actualizar la configuración global",
			error: error.message,
		});
	}
};

const errorMessages = {
	userNotFound: "Usuario no encontrado.",
	invalidUserId: "ID de usuario no proporcionado.",
	databaseError: "Error al obtener los datos del perfil del usuario",
};

exports.getPerfilUsuario = async (req, res) => {
	try {
		const userId = req.user?.id;

		// Validar que el ID del usuario esté presente
		if (!userId) {
			return res.status(400).json({ error: errorMessages.invalidUserId });
		}

		// Consulta para obtener los datos del perfil del usuario
		const [usuarios] = await db.query(
			"SELECT nombre, email, departamento, foto_url FROM Usuarios WHERE id = ?",
			[userId],
		);

		// Verificar si se encontró el usuario
		const usuario = usuarios[0];
		if (!usuario) {
			return res.status(404).json({ error: errorMessages.userNotFound });
		}

		// Devolver los datos del perfil del usuario
		res.json(usuario);
	} catch (error) {
		console.error("Error en getPerfilUsuario:", error);

		// Manejar errores específicos
		if (error.code === "ER_BAD_FIELD_ERROR") {
			return res.status(500).json({
				message: "Error en la consulta: campo inválido.",
				error: error.message,
			});
		}

		// Error genérico
		res.status(500).json({
			message: errorMessages.databaseError,
			error: error.message,
		});
	}
};

exports.updatePerfilUsuario = async (req, res) => {
	try {
		const userId = req.user.id; // ID del usuario autenticado
		const {
			nombre,
			email,
			departamento,
			contrasena_actual,
			nueva_contrasena,
			confirmar_nueva_contrasena,
			foto_url,
		} = req.body;
		console.log(req.body);

		// Validar que la contraseña actual siempre esté presente
		if (!contrasena_actual) {
			return res.status(400).json({
				error: "La contraseña actual es obligatoria para realizar cambios.",
			});
		}

		// Verificar la contraseña actual
		const [usuario] = await db.query(
			"SELECT contrasena FROM Usuarios WHERE id = ?",
			[userId],
		);
		if (usuario.length === 0) {
			return res.status(404).json({ error: "Usuario no encontrado." });
		}

		const contrasenaValida = await bcrypt.compare(
			contrasena_actual,
			usuario[0].contrasena,
		);
		if (!contrasenaValida) {
			return res
				.status(400)
				.json({ error: "La contraseña actual es incorrecta." });
		}

		// Validar que al menos un campo para actualizar esté presente
		if (!nombre && !email && !departamento && !nueva_contrasena && !foto_url) {
			return res.status(400).json({
				error: "Debes proporcionar al menos un campo para actualizar.",
			});
		}

		// Validar el formato del correo electrónico si se proporciona
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res
				.status(400)
				.json({ error: "El correo electrónico no es válido." });
		}

		// Validar la nueva contraseña y su confirmación
		if (nueva_contrasena || confirmar_nueva_contrasena) {
			if (!nueva_contrasena || !confirmar_nueva_contrasena) {
				return res.status(400).json({
					error:
						"Debes proporcionar tanto la nueva contraseña como su confirmación.",
				});
			}

			if (nueva_contrasena !== confirmar_nueva_contrasena) {
				return res.status(400).json({
					error: "La nueva contraseña y su confirmación no coinciden.",
				});
			}
		}

		// Encriptar la nueva contraseña si se proporciona
		let hashedPassword = null;
		if (nueva_contrasena) {
			hashedPassword = await bcrypt.hash(nueva_contrasena, 10);
		}

		// Construir el objeto de actualización dinámicamente
		const updates = [];
		const values = [];

		if (nombre) {
			updates.push("nombre = ?");
			values.push(nombre);
		}
		if (email) {
			updates.push("email = ?");
			values.push(email);
		}
		if (departamento) {
			updates.push("departamento = ?");
			values.push(departamento);
		}
		if (hashedPassword) {
			updates.push("contrasena = ?");
			values.push(hashedPassword);
		}
		if (foto_url) {
			updates.push("foto_url = ?");
			values.push(foto_url);
		}

		// Verificar si hay algo que actualizar
		if (updates.length === 0) {
			return res.status(400).json({
				error: "No se proporcionaron cambios válidos para actualizar.",
			});
		}

		// Actualizar los datos del perfil
		const query = `UPDATE Usuarios SET ${updates.join(", ")} WHERE id = ?`;
		values.push(userId);

		await db.query(query, values);

		res.json({ message: "Datos del perfil actualizados correctamente." });
	} catch (error) {
		console.error("Error en updatePerfilUsuario:", error);
		res.status(500).json({
			message: "Error al actualizar los datos del perfil del usuario",
			error: error.message,
		});
	}
};

exports.uploadImage = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No se recibió ninguna imagen." });
		}

		// Genera la URL relativa de la imagen
		const imageUrl = `/assets/images/${req.file.filename}`;

		// Responde al frontend con la URL generada
		res.json({ url: imageUrl }); // Ejemplo: '/assets/images/1717832123.jpg'
	} catch (error) {
		console.error("[ERROR SUBIR IMAGEN]:", error.message);
		res.status(500).json({ error: "Error al subir la imagen" });
	}
};
