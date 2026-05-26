const db = require("../config/db");

exports.getHistorialActivo = async (req, res) => {
	const id = Number(req.params.id);

	console.log("[HISTORIAL] Inicio - getHistorialActivo");

	try {
		// Validar que el ID sea un número
		if (Number.isNaN(id)) {
			return res
				.status(400)
				.json({ error: "El ID del activo debe ser un número válido." });
		}

		// Verificar si el activo existe
		const [activo] = await db.query("SELECT id FROM activos WHERE id = ?", [
			id,
		]);
		if (activo.length === 0) {
			return res
				.status(404)
				.json({ error: `No se encontró ningún activo con el ID ${id}.` });
		}

		// Parámetros de paginación y filtrado
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const offset = (page - 1) * limit;
		const orden = req.query.orden || "asc";
		const direccionOrden = orden.toLowerCase() === "desc" ? "DESC" : "ASC";

		// Todos los parámetros de filtrado (opcionales)
		const { search = "", accion = "", usuario_responsable = "" } = req.query;

		console.log("[HISTORIAL] Parámetros recibidos:", req.query);

		// Construcción de condiciones WHERE dinámicas
		let whereClause = "";
		const queryParams = [id]; // Inicializamos con el ID del activo

		if (search) {
			whereClause += ` AND (h.accion LIKE ? OR h.detalles LIKE ?)`;
			queryParams.push(`%${search}%`, `%${search}%`);
		}

		if (accion) {
			whereClause += ` AND h.accion = ?`;
			queryParams.push(accion);
		}

		if (usuario_responsable) {
			whereClause += ` AND h.usuario_responsable = ?`;
			queryParams.push(usuario_responsable);
		}

		// Consulta principal para obtener el historial
		const [rows] = await db.query(
			`SELECT 
        h.id, 
        h.accion, 
        h.fecha, 
        u.nombre AS usuario_responsable, 
        h.detalles 
       FROM historial h 
       JOIN usuarios u ON h.usuario_responsable = u.id 
       WHERE h.activo_id = ? ${whereClause}
       ORDER BY h.fecha ${direccionOrden}  
       LIMIT ? OFFSET ?`,
			[...queryParams, limit, offset],
		);

		// Consulta para el total de registros
		const [totalRows] = await db.query(
			`SELECT COUNT(*) AS total 
       FROM historial h
       JOIN usuarios u ON h.usuario_responsable = u.id
       WHERE h.activo_id = ? ${whereClause}`,
			queryParams,
		);

		const total = totalRows[0].total;

		console.log("[HISTORIAL] Éxito - getHistorialActivo");

		res.json({
			data: rows,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[ERROR HISTORIAL]:", error.message);
		res
			.status(500)
			.json({ error: "Error al obtener el historial del activo." });
	}
};

exports.getDatosAuxiliares = async (_req, res) => {
	console.log("[HISTORIAL] Inicio - getDatosAuxiliares");

	try {
		// Consulta para obtener acciones
		const [acciones] = await db.query(
			"SELECT id, nombre, fecha_registro, estado FROM activos",
		);
		if (!acciones || acciones.length === 0) {
			return res.status(404).json({ error: "No se encontraron acciones" });
		}

		// Consulta para obtener usuarios
		const [usuarios] = await db.query(`
      SELECT DISTINCT u.id, u.nombre 
      FROM usuarios u
      JOIN historial h ON u.id = h.usuario_responsable
      ORDER BY u.nombre ASC
    `);
		if (!usuarios || usuarios.length === 0) {
			return res.status(404).json({ error: "No se encontraron usuarios" });
		}

		console.log("[HISTORIAL] Éxito - getDatosAuxiliares");

		res.status(200).json({
			acciones,
			usuarios,
		});
	} catch (error) {
		console.error("[ERROR HISTORIAL]:", error.message);
		res.status(500).json({
			error: "Error interno del servidor",
		});
	}
};

exports.registrarAccionHistorial = async (req, res) => {
	const { id } = req.params;
	const { accion, detalles, fecha, usuario_asignado, ubicacion_nueva } =
		req.validated;
	const usuario_responsable = req.user.id;

	console.log("[HISTORIAL] Inicio - registrarAccionHistorial");

	try {
		// Verificar si el activo existe
		const [activo] = await db.query("SELECT id FROM activos WHERE id = ?", [
			id,
		]);
		if (activo.length === 0) {
			return res
				.status(404)
				.json({ error: `No se encontró ningún activo con el ID ${id}.` });
		}

		// Formatear la fecha para MySQL
		const fechaRegistrada = fecha
			? new Date(fecha).toISOString().replace("T", " ").substring(0, 19)
			: new Date().toISOString().replace("T", " ").substring(0, 19);

		// Insertar la nueva acción en el historial
		const [result] = await db.query(
			"INSERT INTO historial (activo_id, accion, fecha, usuario_responsable, usuario_asignado, ubicacion_nueva, detalles) VALUES (?, ?, ?, ?, ?, ?, ?)",
			[
				id,
				accion,
				fechaRegistrada,
				usuario_responsable,
				usuario_asignado || null,
				ubicacion_nueva || null,
				detalles || null,
			],
		);

		// Devolver la nueva entrada registrada
		console.log("[HISTORIAL] Éxito - registrarAccionHistorial");

		res.status(201).json({
			message: "Acción registrada correctamente en el historial.",
			historial: {
				id: result.insertId,
				accion,
				fecha: fechaRegistrada,
				usuario_responsable,
				usuario_asignado,
				ubicacion_nueva,
				detalles,
			},
		});
	} catch (error) {
		console.error("[ERROR HISTORIAL]:", error.message);
		res
			.status(500)
			.json({ error: "Error al registrar la acción en el historial." });
	}
};
