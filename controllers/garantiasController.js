const db = require("../config/db");

exports.getGarantias = async (req, res) => {
	try {
		console.log("[GARANTIAS] Inicio - Obtener garantías");

		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const offset = (page - 1) * limit;

		// Validaciones
		if (Number.isNaN(page) || Number.isNaN(limit)) {
			return res.status(400).json({
				error: "Los parámetros de paginación deben ser números válidos.",
			});
		}

		// Consulta principal para obtener las garantías activas
		const query = `
            SELECT g.id, a.nombre AS activo, pg.nombre AS proveedor_garantia, 
                   DATE_FORMAT(g.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
                   DATE_FORMAT(g.fecha_fin, '%Y-%m-%d') AS fecha_fin,
                   g.costo, g.condiciones, g.estado, g.descripcion, g.nombre_garantia
            FROM garantias g
            JOIN activos a ON g.activo_id = a.id AND a.activo = 1
            JOIN proveedoresgarantia pg ON g.proveedor_garantia_id = pg.id
            WHERE g.activo = 1
            LIMIT ? OFFSET ?
        `;
		const [results] = await db.query(query, [limit, offset]);

		// Recuento total para paginación
		const [countResult] = await db.query(
			"SELECT COUNT(*) AS total FROM garantias WHERE activo = 1",
		);
		const total = countResult[0].total;

		console.log("[GARANTIAS] Éxito - Garantías obtenidas correctamente");

		res.json({
			data: results,
			pagination: {
				page,
				limit,
				total,
			},
		});
	} catch (error) {
		console.error("[ERROR GARANTIAS]:", error.message);

		if (error.code === "ER_PARSE_ERROR") {
			return res
				.status(400)
				.json({ error: "Error en la sintaxis de la consulta." });
		}

		if (error.code === "ER_NO_REFERENCED_ROW_2") {
			return res.status(404).json({
				error: "Uno de los valores relacionados no existe en la base de datos.",
			});
		}

		res.status(500).json({
			error: "Error al obtener las garantías.",
		});
	}
};

exports.createGarantia = async (req, res) => {
	try {
		console.log("[GARANTIAS] Inicio - Registrar garantía");

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
				error: "Todos los campos obligatorios deben estar presentes.",
			});
		}

		// Validaciones adicionales (fechas, estado, etc.)
		const fechaInicioValida = new Date(fecha_inicio);
		const fechaFinValida = new Date(fecha_fin);

		if (
			Number.isNaN(fechaInicioValida.getTime()) ||
			Number.isNaN(fechaFinValida.getTime())
		) {
			return res
				.status(400)
				.json({ error: "El formato de las fechas es inválido." });
		}

		if (fechaFinValida <= fechaInicioValida) {
			return res.status(400).json({
				error: "La fecha de fin debe ser posterior a la fecha de inicio.",
			});
		}

		const estadosPermitidos = ["Vigente", "Por vencer", "Vencida"];
		if (!estadosPermitidos.includes(estado)) {
			return res
				.status(400)
				.json({ error: "El estado proporcionado no es válido." });
		}

		// Verificar que el activo exista y esté activo
		const [activo] = await db.query(
			"SELECT id, nombre FROM activos WHERE id = ? AND activo = 1",
			[activo_id],
		);
		if (activo.length === 0) {
			return res
				.status(404)
				.json({ error: "El activo no existe o está dado de baja." });
		}

		const [proveedor] = await db.query(
			"SELECT id FROM proveedoresgarantia WHERE id = ?",
			[proveedor_garantia_id],
		);
		if (proveedor.length === 0) {
			return res
				.status(404)
				.json({ error: "El proveedor de garantía no existe." });
		}

		// Insertar la nueva garantía en la base de datos
		const query = `
            INSERT INTO garantias (activo_id, proveedor_garantia_id, nombre_garantia, fecha_inicio, fecha_fin, costo, condiciones, estado, descripcion)
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
			console.error("[ERROR GARANTIAS]:", "Usuario no autenticado.");
			return res.status(401).json({ error: "Acceso no autorizado." });
		}

		try {
			await db.query(
				"INSERT INTO historial (activo_id, accion, usuario_responsable, usuario_asignado, ubicacion_nueva, detalles) VALUES (?, ?, ?, ?, ?, ?)",
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
			console.error("[ERROR GARANTIAS]:", historialError.message);
			return res.status(500).json({
				error: "Error al registrar la acción en el historial.",
			});
		}

		// Devolver una respuesta detallada con los datos de la garantía creada
		console.log("[GARANTIAS] Éxito - Garantía registrada correctamente");

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
		console.error("[ERROR GARANTIAS]:", error.message);

		// Manejo de errores específicos
		if (error.code === "ER_NO_REFERENCED_ROW_2") {
			return res.status(404).json({
				error: "Uno de los valores relacionados no existe en la base de datos.",
			});
		}

		if (error.code === "ER_PARSE_ERROR") {
			return res
				.status(400)
				.json({ error: "Error en la sintaxis de la consulta." });
		}

		// Error genérico
		res.status(500).json({
			error: "Error al registrar la garantía.",
		});
	}
};

exports.updateGarantia = async (req, res) => {
	try {
		console.log("[GARANTIAS] Inicio - Actualizar garantía");

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
			"SELECT * FROM garantias WHERE id = ?",
			[id],
		);
		if (garantiaExistente.length === 0) {
			return res.status(404).json({ error: "La garantía no existe." });
		}

		// Obtener el nombre del activo asociado
		const [activo] = await db.query("SELECT nombre FROM activos WHERE id = ?", [
			garantiaExistente[0].activo_id,
		]);
		const nombreActivo = activo[0]?.nombre || "Activo desconocido";

		// Validar que el estado sea uno de los valores permitidos
		const estadosPermitidos = ["Vigente", "Por vencer", "Vencida"];
		if (estado && !estadosPermitidos.includes(estado)) {
			return res
				.status(400)
				.json({ error: "El estado proporcionado no es válido." });
		}

		// Validar formato de fecha_fin si se proporciona
		if (fecha_fin) {
			const fechaFinValida = new Date(fecha_fin);
			if (Number.isNaN(fechaFinValida.getTime())) {
				return res
					.status(400)
					.json({ error: "El formato de la fecha de fin es inválido." });
			}

			// Verificar que la fecha_fin sea posterior a la fecha actual
			const fechaActual = new Date();
			if (fechaFinValida <= fechaActual) {
				return res.status(400).json({
					error: "La fecha de fin debe ser posterior a la fecha actual.",
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
				.json({ error: "No se proporcionaron campos para actualizar." });
		}

		const query = `
              UPDATE garantias 
              SET ${Object.keys(fieldsToUpdate)
								.map((key, _index) => `${key} = ?`)
								.join(", ")}
              WHERE id = ?
          `;
		const values = [...Object.values(fieldsToUpdate), id];
		await db.query(query, values);

		// Registrar la acción en el historial
		if (!req.user || !req.user.id) {
			return res.status(401).json({ error: "Acceso no autorizado." });
		}

		await db.query(
			"INSERT INTO historial (activo_id, accion, fecha, usuario_responsable, usuario_asignado, ubicacion_nueva, detalles) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
			"SELECT * FROM garantias WHERE id = ?",
			[id],
		);
		const row = garantiaActualizada[0];

		console.log("[GARANTIAS] Éxito - Garantía actualizada correctamente");

		res.json({
			id: row.id,
			activo_id: row.activo_id,
			proveedor_garantia_id: row.proveedor_garantia_id,
			nombre_garantia: row.nombre_garantia,
			fecha_inicio: row.fecha_inicio,
			fecha_fin: row.fecha_fin,
			costo: row.costo,
			condiciones: row.condiciones,
			estado: row.estado,
			descripcion: row.descripcion,
			message: "Garantía actualizada correctamente",
		});
	} catch (error) {
		console.error("[ERROR GARANTIAS]:", error.message);

		// Manejo de errores específicos
		if (error.code === "ER_NO_REFERENCED_ROW_2") {
			return res.status(404).json({
				error: "Uno de los valores relacionados no existe en la base de datos.",
			});
		}

		if (error.code === "ER_PARSE_ERROR") {
			return res
				.status(400)
				.json({ error: "Error en la sintaxis de la consulta." });
		}

		// Error genérico
		res.status(500).json({
			error: "Error al actualizar la garantía.",
		});
	}
};

exports.deleteGarantia = async (req, res) => {
	try {
		console.log("[GARANTIAS] Inicio - Eliminar garantía");

		const { id } = req.params;
		await db.query("UPDATE garantias SET activo = 0 WHERE id = ?", [id]);

		console.log("[GARANTIAS] Éxito - Garantía eliminada correctamente");

		res.json({ message: "Garantía eliminada correctamente" });
	} catch (error) {
		console.error("[ERROR GARANTIAS]:", error.message);
		res.status(500).json({ error: "Error al eliminar la garantía." });
	}
};
