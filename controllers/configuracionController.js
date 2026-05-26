const db = require("../config/db");
const hashService = require("../services/hashService");
const r2Service = require("../services/r2Service");

exports.getConfiguracionAplicacion = async (_req, res) => {
	try {
		const [rows] = await db.query(
			"SELECT idioma, zona_horaria, formato_fecha, formato_moneda FROM configuracion WHERE id = 1",
		);

		if (rows.length === 0) {
			return res.status(404).json({ message: "Configuración no encontrada" });
		}

		res.json(rows[0]);
	} catch (error) {
		console.error("[ERROR GET CONFIG]:", error.message);
		res.status(500).json({
			message: "Error al obtener la configuración global",
			error: error.message,
		});
	}
};

exports.updateConfiguracionAplicacion = async (req, res) => {
	try {
		const { idioma, zona_horaria, formato_fecha, formato_moneda } = req.body;

		if (!idioma || !zona_horaria || !formato_fecha || !formato_moneda) {
			return res
				.status(400)
				.json({ message: "Todos los campos son obligatorios." });
		}

		const validLanguages = ["es", "en", "fr"];
		const validTimeZones = ["UTC-5", "UTC+1", "UTC+2"];

		if (!validLanguages.includes(idioma)) {
			return res.status(400).json({ message: "Idioma no válido." });
		}

		if (!validTimeZones.includes(zona_horaria)) {
			return res.status(400).json({ message: "Zona horaria no válida." });
		}

		await db.query(
			"UPDATE configuracion SET idioma = ?, zona_horaria = ?, formato_fecha = ?, formato_moneda = ? WHERE id = 1",
			[idioma, zona_horaria, formato_fecha, formato_moneda],
		);

		res.json({
			message: "Configuración global actualizada correctamente",
			nuevaConfiguracion: { idioma, zona_horaria, formato_fecha, formato_moneda },
		});
	} catch (error) {
		console.error("[ERROR UPDATE CONFIG]:", error.message);
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

		if (!userId) {
			return res.status(400).json({ error: errorMessages.invalidUserId });
		}

		const [usuarios] = await db.query(
			"SELECT nombre, email, departamento, foto_url FROM usuarios WHERE id = ?",
			[userId],
		);

		const usuario = usuarios[0];
		if (!usuario) {
			return res.status(404).json({ error: errorMessages.userNotFound });
		}

		res.json(usuario);
	} catch (error) {
		console.error("Error en getPerfilUsuario:", error);

		if (error.code === "ER_BAD_FIELD_ERROR") {
			return res.status(500).json({
				message: "Error en la consulta: campo inválido.",
				error: error.message,
			});
		}

		res.status(500).json({
			message: errorMessages.databaseError,
			error: error.message,
		});
	}
};

exports.updatePerfilUsuario = async (req, res) => {
	try {
		const userId = req.user.id;
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

		if (!contrasena_actual) {
			return res.status(400).json({
				error: "La contraseña actual es obligatoria para realizar cambios.",
			});
		}

		const [usuarios] = await db.query(
			"SELECT contrasena FROM usuarios WHERE id = ?",
			[userId],
		);
		if (usuarios.length === 0) {
			return res.status(404).json({ error: "Usuario no encontrado." });
		}

		const isMatch = await hashService.verify(
			contrasena_actual,
			usuarios[0].contrasena,
		);
		if (!isMatch) {
			return res
				.status(401)
				.json({ message: "La contraseña actual es incorrecta." });
		}

		if (!nombre && !email && !departamento && !nueva_contrasena && !foto_url) {
			return res.status(400).json({
				error: "Debes proporcionar al menos un campo para actualizar.",
			});
		}

		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res
				.status(400)
				.json({ error: "El correo electrónico no es válido." });
		}

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
		if (nueva_contrasena) {
			const hashedNewPassword = await hashService.hash(nueva_contrasena);
			updates.push("contrasena = ?");
			values.push(hashedNewPassword);
		}
		if (foto_url) {
			updates.push("foto_url = ?");
			values.push(foto_url);
		}

		if (updates.length === 0) {
			return res.status(400).json({
				error: "No se proporcionaron cambios válidos para actualizar.",
			});
		}

		const query = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = ?`;
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

		const key = r2Service.generateKey("perfil", req.file.mimetype);
		const result = await r2Service.uploadToR2(
			req.file.buffer,
			key,
			req.file.mimetype,
		);

		res.json({ url: result.url });
	} catch (error) {
		console.error("[ERROR SUBIR IMAGEN]:", error.message);
		res.status(500).json({ error: "Error al subir la imagen" });
	}
};
