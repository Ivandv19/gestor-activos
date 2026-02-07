const db = require("../config/db");

exports.getGarantias = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const offset = (page - 1) * limit;

		// Validaciones
		if (isNaN(page) || isNaN(limit)) {
			return res.status(400).json({
				mensaje: "Los parámetros de paginación deben ser números válidos.",
			});
		}

		// Consulta principal para obtener todas las garantías
		const query = `
            SELECT g.id, a.nombre AS activo, pg.nombre AS proveedor_garantia, 
                   DATE_FORMAT(g.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
                   DATE_FORMAT(g.fecha_fin, '%Y-%m-%d') AS fecha_fin,
                   g.costo, g.condiciones, g.estado, g.descripcion, g.nombre_garantia
            FROM Garantias g
            JOIN Activos a ON g.activo_id = a.id
            JOIN ProveedoresGarantia pg ON g.proveedor_garantia_id = pg.id
            LIMIT ? OFFSET ?
        `;
		const [results] = await db.query(query, [limit, offset]);

		// Recuento total para paginación
		const [countResult] = await db.query(
			"SELECT COUNT(*) AS total FROM Garantias",
		);
		const total = countResult[0].total;

		res.json({
			data: results,
			pagination: {
				page,
				limit,
				total,
			},
		});
	} catch (error) {
		console.error("[ERROR GET GARANTIAS]:", error.message);

		if (error.code === "ER_PARSE_ERROR") {
			return res
				.status(400)
				.json({ mensaje: "Error en la sintaxis de la consulta." });
		}

		if (error.code === "ER_NO_REFERENCED_ROW_2") {
			return res.status(404).json({
				mensaje:
					"Uno de los valores relacionados no existe en la base de datos.",
			});
		}

		res.status(500).json({
			mensaje: "Error al obtener las garantías.",
			error: error.message,
		});
	}
};

exports.createGarantia = async (req, res) => {
	try {
		const {
			activo_id,
			proveedor_garantia_id,
			nombre_garantia,
			fecha_inicio,
			fecha_fin,
			costo,
			condiciones,
			estado,
			descripcion,
		} = req.body;

		// Validación inicial: Asegurarse de que todos los campos requeridos estén presentes
		if (
			!activo_id ||
			!proveedor_garantia_id ||
			!nombre_garantia ||
			!fecha_inicio ||
			!fecha_fin ||
			!estado
		) {
			return res.status(400).json({
				mensaje: "Todos los campos obligatorios deben estar presentes.",
			});
		}

		// Validaciones adicionales (fechas, estado, etc.)
		const fechaInicioValida = new Date(fecha_inicio);
		const fechaFinValida = new Date(fecha_fin);

		if (isNaN(fechaInicioValida.getTime()) || isNaN(fechaFinValida.getTime())) {
			return res
				.status(400)
				.json({ mensaje: "El formato de las fechas es inválido." });
		}

		if (fechaFinValida <= fechaInicioValida) {
			return res.status(400).json({
				mensaje: "La fecha de fin debe ser posterior a la fecha de inicio.",
			});
		}

		const estadosPermitidos = ["Vigente", "Por vencer", "Vencida"];
		if (!estadosPermitidos.includes(estado)) {
			return res
				.status(400)
				.json({ mensaje: "El estado proporcionado no es válido." });
		}

		// Verificar que el activo y el proveedor existan en la base de datos
		const [activo] = await db.query(
			"SELECT id, nombre FROM Activos WHERE id = ?",
			[activo_id],
		);
		if (activo.length === 0) {
			return res.status(404).json({ mensaje: "El activo no existe." });
		}

		const [proveedor] = await db.query(
			"SELECT id FROM ProveedoresGarantia WHERE id = ?",
			[proveedor_garantia_id],
		);
		if (proveedor.length === 0) {
			return res
				.status(404)
				.json({ mensaje: "El proveedor de garantía no existe." });
		}

		// Insertar la nueva garantía en la base de datos
		const query = `
            INSERT INTO Garantias (activo_id, proveedor_garantia_id, nombre_garantia, fecha_inicio, fecha_fin, costo, condiciones, estado, descripcion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
		const [result] = await db.query(query, [
			activo_id,
			proveedor_garantia_id,
			nombre_garantia,
			fecha_inicio,
			fecha_fin,
			costo || null,
			condiciones || null,
			estado,
			descripcion || null,
		]);

		// Obtener el nombre del activo
		const nombreActivo = activo[0].nombre;

		// Registrar la acción en el historial
		if (!req.user || !req.user.id) {
			console.error("[ERROR CREATE GARANTIA]: Usuario no autenticado.");
			return res.status(401).json({ mensaje: "Acceso no autorizado." });
		}

		try {
			await db.query(
				"INSERT INTO Historial (activo_id, accion, usuario_responsable, usuario_asignado, ubicacion_nueva, detalles) VALUES (?, ?, ?, ?, ?, ?)",
				[
					activo_id, // ID del activo asociado
					"Garantía registrada", // Acción realizada
					req.user.id, // Usuario responsable de la acción
					null, // Usuario asignado (opcional, no aplica aquí)
					null, // Nueva ubicación (opcional, no aplica aquí)
					`Se registró una nueva garantía: ${nombre_garantia} para el activo "${nombreActivo}".`,
				],
			);
		} catch (historialError) {
			console.error(
				"[ERROR CREATE GARANTIA HISTORIAL]:",
				historialError.message,
			);
			return res.status(500).json({
				mensaje: "Error al registrar la acción en el historial.",
				error: historialError.message,
			});
		}

		// Devolver una respuesta detallada con los datos de la garantía creada
		res.status(201).json({
			id: result.insertId,
			activo_id,
			proveedor_garantia_id,
			nombre_garantia,
			fecha_inicio,
			fecha_fin,
			costo,
			condiciones,
			estado,
			descripcion,
			message: "Garantía registrada correctamente",
		});
	} catch (error) {
		console.error("[ERROR CREATE GARANTIA]:", error.message);

		// Manejo de errores específicos
		if (error.code === "ER_NO_REFERENCED_ROW_2") {
			return res.status(404).json({
				mensaje:
					"Uno de los valores relacionados no existe en la base de datos.",
			});
		}

		if (error.code === "ER_PARSE_ERROR") {
			return res
				.status(400)
				.json({ mensaje: "Error en la sintaxis de la consulta." });
		}

		// Error genérico
		res.status(500).json({
			mensaje: "Error al registrar la garantía.",
			error: error.message,
		});
	}
};

exports.updateGarantia = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			nombre_garantia,
			estado,
			fecha_fin,
			descripcion,
			proveedor_garantia_id,
			costo,
			condiciones,
		} = req.body;

		// Validar que la garantía exista
		const [garantiaExistente] = await db.query(
			"SELECT * FROM Garantias WHERE id = ?",
			[id],
		);
		if (garantiaExistente.length === 0) {
			return res.status(404).json({ mensaje: "La garantía no existe." });
		}

		// Obtener el nombre del activo asociado
		const [activo] = await db.query("SELECT nombre FROM Activos WHERE id = ?", [
			garantiaExistente[0].activo_id,
		]);
		const nombreActivo = activo[0]?.nombre || "Activo desconocido";

		// Validar que el estado sea uno de los valores permitidos
		const estadosPermitidos = ["Vigente", "Por vencer", "Vencida"];
		if (estado && !estadosPermitidos.includes(estado)) {
			return res
				.status(400)
				.json({ mensaje: "El estado proporcionado no es válido." });
		}

		// Validar formato de fecha_fin si se proporciona
		if (fecha_fin) {
			const fechaFinValida = new Date(fecha_fin);
			if (isNaN(fechaFinValida.getTime())) {
				return res
					.status(400)
					.json({ mensaje: "El formato de la fecha de fin es inválido." });
			}

			// Verificar que la fecha_fin sea posterior a la fecha actual
			const fechaActual = new Date();
			if (fechaFinValida <= fechaActual) {
				return res.status(400).json({
					mensaje: "La fecha de fin debe ser posterior a la fecha actual.",
				});
			}
		}

		// Construir la consulta dinámica para actualizar solo los campos proporcionados
		const fieldsToUpdate = {};
		if (nombre_garantia) fieldsToUpdate.nombre_garantia = nombre_garantia;
		if (estado) fieldsToUpdate.estado = estado;
		if (fecha_fin) fieldsToUpdate.fecha_fin = fecha_fin;
		if (descripcion !== undefined)
			fieldsToUpdate.descripcion = descripcion || null;
		if (proveedor_garantia_id)
			fieldsToUpdate.proveedor_garantia_id = proveedor_garantia_id;
		if (costo !== undefined) fieldsToUpdate.costo = costo || null;
		if (condiciones !== undefined)
			fieldsToUpdate.condiciones = condiciones || null;

		if (Object.keys(fieldsToUpdate).length === 0) {
			return res
				.status(400)
				.json({ mensaje: "No se proporcionaron campos para actualizar." });
		}

		const query = `
              UPDATE Garantias 
              SET ${Object.keys(fieldsToUpdate)
								.map((key, index) => `${key} = ?`)
								.join(", ")}
              WHERE id = ?
          `;
		const values = [...Object.values(fieldsToUpdate), id];
		await db.query(query, values);

		// Registrar la acción en el historial
		if (!req.user || !req.user.id) {
			return res.status(401).json({ mensaje: "Acceso no autorizado." });
		}

		await db.query(
			"INSERT INTO Historial (activo_id, accion, fecha, usuario_responsable, usuario_asignado, ubicacion_nueva, detalles) VALUES (?, ?, ?, ?, ?, ?, ?)",
			[
				garantiaExistente[0].activo_id, // ID del activo asociado
				"Garantía actualizada", // Acción realizada
				new Date().toISOString().replace("T", " ").substring(0, 19), // Fecha actual
				req.user.id, // Usuario responsable de la acción
				null, // Usuario asignado (opcional, no aplica aquí)
				null, // Nueva ubicación (opcional, no aplica aquí)
				`Se actualizaron los siguientes campos: ${Object.keys(
					fieldsToUpdate,
				).join(", ")} para el activo "${nombreActivo}".`,
			],
		);

		// Devolver una respuesta detallada con los datos actualizados
		const [garantiaActualizada] = await db.query(
			"SELECT * FROM Garantias WHERE id = ?",
			[id],
		);
		res.json({
			...garantiaActualizada[0],
			message: "Garantía actualizada correctamente",
		});
	} catch (error) {
		console.error("[ERROR UPDATE GARANTIA]:", error.message);

		// Manejo de errores específicos
		if (error.code === "ER_NO_REFERENCED_ROW_2") {
			return res.status(404).json({
				mensaje:
					"Uno de los valores relacionados no existe en la base de datos.",
			});
		}

		if (error.code === "ER_PARSE_ERROR") {
			return res
				.status(400)
				.json({ mensaje: "Error en la sintaxis de la consulta." });
		}

		// Error genérico
		res.status(500).json({
			mensaje: "Error al actualizar la garantía.",
			error: error.message,
		});
	}
};

exports.deleteGarantia = async (req, res) => {
	try {
		const { id } = req.params;
		const query = "DELETE FROM Garantias WHERE id = ?";
		await db.query(query, [id]);
		res.json({ message: "Garantía eliminada correctamente" });
	} catch (error) {
		res.status(500).json({ message: "Error al eliminar la garantía", error });
	}
};
