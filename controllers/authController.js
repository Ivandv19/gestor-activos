const db = require("../config/db");
const hashService = require("../services/hashService");
const jwt = require("jsonwebtoken");

exports.registro = async (req, res) => {
	console.log("[AUTH] Inicio - Registro de usuario");

	const { nombre, email, contrasena, departamento, fecha_ingreso, rol } =
		req.body;

	try {
		// 1. Validación de campos obligatorios
		console.log("[AUTH] Validando campos obligatorios");
		if (
			!nombre ||
			!email ||
			!contrasena ||
			!departamento ||
			!fecha_ingreso ||
			!rol
		) {
			console.log("[AUTH] Error: Campos obligatorios faltantes");
			return res
				.status(400)
				.json({ error: "Todos los campos son obligatorios" });
		}

		// 2. Validación de formato de correo electrónico
		console.log("[AUTH] Validando formato de email");
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			console.log("[AUTH] Error: Formato de email inválido");
			return res
				.status(400)
				.json({ error: "El correo electrónico no es válido" });
		}

		// 3. Validación de longitud de contraseña
		console.log("[AUTH] Validando longitud de contraseña");
		if (contrasena.length < 8) {
			console.log("[AUTH] Error: Contraseña demasiado corta");
			return res
				.status(400)
				.json({ error: "La contraseña debe tener al menos 8 caracteres" });
		}

		// 4. Validación de roles predefinidos
		console.log("[AUTH] Validando rol de usuario");
		const rolesPermitidos = ["Administrador", "Usuario"];
		if (!rolesPermitidos.includes(rol)) {
			console.log("[AUTH] Error: Rol no válido");
			return res.status(400).json({ error: "Rol no válido" });
		}

		// Verificar si el usuario ya existe
		console.log("[AUTH] Verificando usuario existente en BD");
		const [existingUser] = await db.query(
			"SELECT * FROM usuarios WHERE email = ?",
			[email],
		);
		if (existingUser.length > 0) {
			console.log("[AUTH] Error: Email ya registrado");
			return res
				.status(400)
				.json({ error: "El correo electrónico ya está registrado" });
		}

		// Hashear la contraseña usando el microservicio Argon2id
		console.log("[AUTH] Hash de contraseña via Microservicio");
		const hashedPassword = await hashService.hash(contrasena);

		// Guardar el usuario en la base de datos
		console.log("[AUTH] Guardando usuario en BD");
		await db.query(
			"INSERT INTO usuarios (nombre, email, contrasena, departamento, fecha_ingreso, rol, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
			[nombre, email, hashedPassword, departamento, fecha_ingreso, rol],
		);

		console.log("[AUTH] Éxito - Usuario registrado");
		res.status(201).json({ message: "Usuario registrado exitosamente" });
	} catch (error) {
		console.error("[ERROR AUTH]:", error.message);
		res.status(500).json({ error: "Error al registrar el usuario" });
	}
};

exports.login = async (req, res) => {
	// 0. Validar que JWT_SECRET existe
	if (!process.env.JWT_SECRET) {
		console.error("[ERROR AUTH]: JWT_SECRET no configurado");
		return res.status(500).json({
			error: "Error de configuración del servidor",

		});
	}

	console.log("[AUTH] Inicio - Login de usuario");

	const { email, contrasena } = req.body;

	try {
		// 1. Validación de campos obligatorios
		if (!email || !contrasena) {
			console.log("[AUTH] Error: Faltan credenciales");
			return res.status(400).json({
				error: "Todos los campos son obligatorios",
			});
		}

		// 2. Validación de formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			console.log("[AUTH] Error: Formato de email inválido");
			return res.status(400).json({
				error: "Ingrese un correo electrónico válido",

			});
		}

		// 3. Buscar usuario
		const [users] = await db.query(
			"SELECT id, nombre, email, contrasena, rol, foto_url FROM usuarios WHERE email = ?",
			[email],
		);
		const user = users[0];

		if (!user) {
			console.log("[AUTH] Error: Usuario no encontrado");
			return res.status(401).json({
				error: "Usuario no registrado",

			});
		}

		// 4. Verificar contraseña usando el microservicio Argon2id
		const isMatch = await hashService.verify(contrasena, user.contrasena);
		if (!isMatch) {
			console.log("[AUTH] Error: Contraseña incorrecta");
			return res.status(401).json({
				error: "Contraseña incorrecta",

			});
		}

		// 5. Generar token
		const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
		const token = jwt.sign(
			{
				id: user.id,
				nombre: user.nombre,
				email: user.email,
				rol: user.rol,
			},
			process.env.JWT_SECRET,
			{ expiresIn },
		);

		// 6. Respuesta exitosa (
		console.log("[AUTH] Éxito - Usuario autenticado");
		res.json({
			message: "Sesión iniciada correctamente",
			token,
			userData: {
				id: user.id,
				nombre: user.nombre,
				rol: user.rol,
				email: user.email,
				foto_url: user.foto_url || null,
			},
		});
	} catch (error) {
		console.error("[ERROR AUTH]:", error.message);
		if (error.message.includes("Hash Service")) {
			return res.status(503).json({
				error: "El servicio de autenticación no está disponible.",

			});
		}
		res.status(500).json({
			error: "Error interno al iniciar sesión",

		});
	}
};

// Función para validar el token JWT
exports.test = (req, res) => {
	res.json({
		message: "Token válido",
		user: req.user, // Información del usuario decodificada del token
	});
};
