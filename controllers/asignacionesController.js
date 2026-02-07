const db = require("../config/db");

exports.getAsignaciones = async (req, res) => {
	try {
		// Parámetros de paginación
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const offset = (page - 1) * limit;

		const orden = req.query.orden || "asc";
		const direccionOrden = orden.toLowerCase() === "desc" ? "DESC" : "ASC";

		// Parámetros de filtrado (todos opcionales)
		const { search = "", tipo, ubicacion, usuario_asignado } = req.query;

		console.log("[BACKEND] Parámetros recibidos:", req.query);

		// Construir WHERE dinámico
		const whereClauses = [];
		const queryParams = [];

		// Búsqueda general (ID o nombre del activo)
		if (search) {
			whereClauses.push(`(ac.id LIKE ? OR ac.nombre LIKE ?)`);
			queryParams.push(`%${search}%`, `%${search}%`);
		}

		// Filtros específicos
		if (tipo) {
			whereClauses.push(`t.id = ?`); // Filtrar por tipo de activo
			queryParams.push(tipo);
		}
		if (ubicacion) {
			whereClauses.push(`ub.id = ?`); // Filtrar por ubicación
			queryParams.push(ubicacion);
		}
		if (usuario_asignado) {
			whereClauses.push(`u.id = ?`); // Filtrar por usuario asignado
			queryParams.push(usuario_asignado);
		}

		// Combinar condiciones con AND
		const whereClause =
			whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

		// Consulta principal para obtener las asignaciones
		const query = `
      SELECT 
        a.id, 
        ac.nombre AS activo, 
        t.nombre AS tipo_activo, -- Obtener el nombre del tipo desde la tabla Tipos
        ac.estado AS estado_activo, 
        u.nombre AS usuario, 
        ub.nombre AS ubicacion, 
        a.fecha_asignacion, 
        a.fecha_devolucion, 
        a.comentarios,
        ac.foto_url AS foto_url

      FROM asignaciones a
      JOIN activos ac ON a.activo_id = ac.id
      JOIN tipos t ON ac.tipo_id = t.id -- Unir con la tabla Tipos para obtener el tipo
      JOIN usuarios u ON a.usuario_id = u.id
      JOIN ubicaciones ub ON a.ubicacion_id = ub.id
      ${whereClause}
      ORDER BY a.id ${direccionOrden} -- Ordenamiento
      LIMIT ? OFFSET ?
    `;
		queryParams.push(limit, offset);

		const [results] = await db.query(query, queryParams);

		// Consulta para obtener el total de asignaciones (considerando filtros)
		const totalQuery = `
      SELECT COUNT(*) AS total
      FROM asignaciones a
      JOIN activos ac ON a.activo_id = ac.id
      JOIN tipos t ON ac.tipo_id = t.id
      JOIN usuarios u ON a.usuario_id = u.id
      JOIN ubicaciones ub ON a.ubicacion_id = ub.id
      ${whereClause}
    `;
		const [totalResult] = await db.query(totalQuery, queryParams.slice(0, -2));
		const totalAsignaciones = totalResult[0].total;

		// Respuesta con metadatos de paginación
		res.json({
			data: results,
			pagination: {
				page,
				limit,
				total: totalAsignaciones,
				totalPages: Math.ceil(totalAsignaciones / limit),
			},
		});
	} catch (error) {
		console.error("[ERROR GET ASIGNACIONES]:", error.message);
		res.status(500).json({ error: "Error al obtener las asignaciones." });
	}
};

exports.createAsignacion = async (req, res) => {
	try {
		const {
			activo_id,
			usuario_id,
			ubicacion_id,
			fecha_asignacion,
			fecha_devolucion,
		} = req.body;

		// Validación inicial: Asegurarse de que todos los campos requeridos estén presentes
		if (!activo_id || !usuario_id || !ubicacion_id || !fecha_asignacion) {
			return res
				.status(400)
				.json({ error: "Todos los campos son obligatorios." });
		}

		// Validar formato de fecha_asignacion
		const fechaValida = new Date(fecha_asignacion);
		if (isNaN(fechaValida.getTime())) {
			return res
				.status(400)
				.json({ error: "El formato de la fecha de asignación es inválido." });
		}

		// Validaciones combinadas para activo, usuario y ubicación
		const [validaciones] = await db.query(
			`
            SELECT 
                (SELECT COUNT(*) FROM activos WHERE id = ?) AS activo_existe,
                (SELECT COUNT(*) FROM usuarios WHERE id = ?) AS usuario_existe,
                (SELECT COUNT(*) FROM ubicaciones WHERE id = ?) AS ubicacion_existe
        `,
			[activo_id, usuario_id, ubicacion_id],
		);

		if (validaciones[0].activo_existe === 0) {
			return res.status(404).json({ error: "El activo no existe." });
		}
		if (validaciones[0].usuario_existe === 0) {
			return res.status(404).json({ error: "El usuario no existe." });
		}
		if (validaciones[0].ubicacion_existe === 0) {
			return res.status(404).json({ error: "La ubicación no existe." });
		}

		// Obtener detalles del activo, usuario y ubicación
		const [activo] = await db.query("SELECT nombre FROM activos WHERE id = ?", [
			activo_id,
		]);
		const [usuario] = await db.query(
			"SELECT nombre FROM usuarios WHERE id = ?",
			[usuario_id],
		);
		const [ubicacion] = await db.query(
			"SELECT nombre FROM ubicaciones WHERE id = ?",
			[ubicacion_id],
		);

		// Generar un comentario dinámico
		const comentariosDinamicos = `Activo "${activo[0].nombre}" asignado al usuario "${usuario[0].nombre}" en la ubicación "${ubicacion[0].nombre}".`;

		// Insertar la nueva asignación
		const insertQuery = `
            INSERT INTO asignaciones (activo_id, usuario_id, ubicacion_id, fecha_asignacion, fecha_devolucion, comentarios)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
		const [result] = await db.query(insertQuery, [
			activo_id,
			usuario_id,
			ubicacion_id,
			fecha_asignacion,
			fecha_devolucion || null,
			comentariosDinamicos,
		]);

		// Actualizar el estado del activo a "Asignado"
		await db.query("UPDATE activos SET estado = ? WHERE id = ?", [
			"Asignado",
			activo_id,
		]);

		// Registrar la acción en el historial
		if (!req.user || !req.user.id) {
			return res.status(401).json({ error: "Acceso no autorizado." });
		}

		await db.query(
			"INSERT INTO Historial (activo_id, accion, usuario_responsable, usuario_asignado, ubicacion_nueva, detalles) VALUES (?, ?, ?, ?, ?, ?)",
			[
				activo_id,
				"Activo asignado",
				req.user.id,
				usuario_id,
				ubicacion_id,
				comentariosDinamicos,
			],
		);

		// Respuesta
		res.json({
			id: result.insertId,
			activo_id,
			usuario_id,
			ubicacion_id,
			fecha_asignacion,
			fecha_devolucion,
			comentarios: comentariosDinamicos,
			message: "Asignación creada correctamente.",
		});
	} catch (error) {
		console.error("[ERROR CREATE ASIGNACION]:", error.message);

		// Manejo de errores específicos
		if (error.code === "ER_DUP_ENTRY") {
			return res.status(400).json({ error: "Esta asignación ya existe." });
		}
		if (error.message.includes("FOREIGN KEY")) {
			return res.status(400).json({
				error:
					"Uno de los valores proporcionados no existe en la base de datos.",
			});
		}

		// Error genérico
		res.status(500).json({ error: "Error al crear la asignación." });
	}
};

exports.getAsignacionPorId = async (req, res) => {
	try {
		const { id } = req.params;

		// Obtener la asignación por su ID
		const [asignacion] = await db.query(
			`
        SELECT 
          asignaciones.*,
          activos.nombre AS activo_nombre,
          usuarios.nombre AS usuario_nombre,
          ubicaciones.nombre AS ubicacion_nombre
        FROM asignaciones
        LEFT JOIN activos ON asignaciones.activo_id = activos.id
        LEFT JOIN usuarios ON asignaciones.usuario_id = usuarios.id
        LEFT JOIN ubicaciones ON asignaciones.ubicacion_id = ubicaciones.id
        WHERE asignaciones.id = ?
      `,
			[id],
		);

		// Verificar si la asignación existe
		if (asignacion.length === 0) {
			return res.status(404).json({ mensaje: "La asignación no existe." });
		}

		// Construir la respuesta con los datos necesarios
		const asignacionData = {
			id: asignacion[0].id,
			activo_id: asignacion[0].activo_id,
			activo_nombre: asignacion[0].activo_nombre,
			usuario_id: asignacion[0].usuario_id,
			usuario_nombre: asignacion[0].usuario_nombre,
			ubicacion_id: asignacion[0].ubicacion_id,
			ubicacion_nombre: asignacion[0].ubicacion_nombre,
			fecha_asignacion: asignacion[0].fecha_asignacion,
			fecha_devolucion: asignacion[0].fecha_devolucion,
			comentarios: asignacion[0].comentarios,
		};

		// Enviar la respuesta
		res.json({
			asignacion: asignacionData,
			message: "Asignación obtenida correctamente.",
		});
	} catch (error) {
		console.error("[ERROR GET ASIGNACION POR ID]:", error.message);

		// Manejo de errores específicos
		if (error.message.includes("FOREIGN KEY")) {
			return res.status(400).json({
				mensaje:
					"Uno de los valores relacionados no existe en la base de datos.",
			});
		}

		// Error genérico
		res.status(500).json({ mensaje: "Error al obtener la asignación." });
	}
};

exports.updateAsignacion = async (req, res) => {
	try {
		const { id } = req.params;
		const { fecha_devolucion, usuario_id, ubicacion_id } = req.body;

		// Obtener la asignación existente
		const [asignacionExistente] = await db.query(
			"SELECT * FROM asignaciones WHERE id = ?",
			[id],
		);
		if (asignacionExistente.length === 0) {
			return res.status(404).json({ error: "La asignación no existe." });
		}

		// Obtener detalles actuales del activo, usuario y ubicación
		const [activoActual] = await db.query(
			"SELECT nombre FROM activos WHERE id = ?",
			[asignacionExistente[0].activo_id],
		);
		const [usuarioAnterior] = await db.query(
			"SELECT nombre FROM usuarios WHERE id = ?",
			[asignacionExistente[0].usuario_id],
		);
		const [ubicacionAnterior] = await db.query(
			"SELECT nombre FROM ubicaciones WHERE id = ?",
			[asignacionExistente[0].ubicacion_id],
		);

		// Validar que los datos existentes sean válidos
		if (
			activoActual.length === 0 ||
			usuarioAnterior.length === 0 ||
			ubicacionAnterior.length === 0
		) {
			return res.status(404).json({
				error: "Uno de los datos relacionados no existe en la base de datos.",
			});
		}

		// Obtener nombres de los nuevos valores si se proporcionan
		let nuevoUsuarioNombre = usuarioAnterior[0].nombre; // Mantener el usuario anterior por defecto
		if (usuario_id && usuario_id !== asignacionExistente[0].usuario_id) {
			const [nuevoUsuario] = await db.query(
				"SELECT nombre FROM usuarios WHERE id = ?",
				[usuario_id],
			);
			if (nuevoUsuario.length === 0) {
				return res.status(404).json({ error: "El nuevo usuario no existe." });
			}
			nuevoUsuarioNombre = nuevoUsuario[0].nombre;
		}

		let nuevaUbicacionNombre = ubicacionAnterior[0].nombre; // Mantener la ubicación anterior por defecto
		if (ubicacion_id && ubicacion_id !== asignacionExistente[0].ubicacion_id) {
			const [nuevaUbicacion] = await db.query(
				"SELECT nombre FROM ubicaciones WHERE id = ?",
				[ubicacion_id],
			);
			if (nuevaUbicacion.length === 0) {
				return res.status(404).json({ error: "La nueva ubicación no existe." });
			}
			nuevaUbicacionNombre = nuevaUbicacion[0].nombre;
		}

		// Construir comentarios dinámicos para el historial
		let comentariosDinamicos = "";

		if (
			fecha_devolucion &&
			fecha_devolucion !== asignacionExistente[0].fecha_devolucion
		) {
			const fechaValida = new Date(fecha_devolucion);
			if (isNaN(fechaValida.getTime())) {
				return res.status(400).json({
					mensaje: "El formato de la fecha de devolución es inválido.",
				});
			}
			comentariosDinamicos += `Fecha de devolución actualizada a "${fecha_devolucion}". `;
		}

		if (usuario_id && usuario_id !== asignacionExistente[0].usuario_id) {
			comentariosDinamicos += `Usuario asignado cambiado de "${usuarioAnterior[0].nombre}" a "${nuevoUsuarioNombre}". `;
		}

		if (ubicacion_id && ubicacion_id !== asignacionExistente[0].ubicacion_id) {
			comentariosDinamicos += `Ubicación cambiada de "${ubicacionAnterior[0].nombre}" a "${nuevaUbicacionNombre}". `;
		}

		if (!comentariosDinamicos) {
			comentariosDinamicos = "Sin cambios adicionales.";
		}

		// Construir el nuevo comentario para la tabla Asignaciones
		const nuevoComentario = `Activo "${activoActual[0].nombre}" asignado al usuario "${nuevoUsuarioNombre}" en la ubicación "${nuevaUbicacionNombre}".`;

		// Aplicar los cambios si hay algo que actualizar
		const fieldsToUpdate = {};
		if (fecha_devolucion) fieldsToUpdate.fecha_devolucion = fecha_devolucion;
		if (usuario_id) fieldsToUpdate.usuario_id = usuario_id;
		if (ubicacion_id) fieldsToUpdate.ubicacion_id = ubicacion_id;

		fieldsToUpdate.comentarios = nuevoComentario; // Actualizar el campo comentarios

		const query = `
            UPDATE asignaciones 
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
			"INSERT INTO Historial (activo_id, accion, usuario_responsable, usuario_asignado, ubicacion_nueva, detalles) VALUES (?, ?, ?, ?, ?, ?)",
			[
				asignacionExistente[0].activo_id,
				"Asignación actualizada",
				req.user.id,
				usuario_id || asignacionExistente[0].usuario_id,
				ubicacion_id || asignacionExistente[0].ubicacion_id,
				comentariosDinamicos,
			],
		);

		// Respuesta
		res.json({
			id,
			fecha_devolucion,
			usuario_id,
			ubicacion_id,
			comentarios: nuevoComentario,
			message: "Asignación actualizada correctamente",
		});
	} catch (error) {
		console.error("[ERROR UPDATE ASIGNACION]:", error.message);

		// Manejo de errores específicos
		if (error.code === "ER_DUP_ENTRY") {
			return res.status(400).json({ mensaje: "Esta asignación ya existe." });
		}
		if (error.message.includes("FOREIGN KEY")) {
			return res.status(400).json({
				mensaje:
					"Uno de los valores proporcionados no existe en la base de datos.",
			});
		}

		// Error genérico
		res.status(500).json({ mensaje: "Error al actualizar la asignación." });
	}
};

exports.deleteAsignacion = async (req, res) => {
	try {
		const { id } = req.params;
		console.log("ID recibido para eliminar:", id);

		// Paso 1: Obtener el ID del activo asociado a la asignación
		const getActivoQuery = `
      SELECT a.id AS asignacion_id, a.activo_id, ac.nombre AS activo_nombre
      FROM asignaciones a
      JOIN activos ac ON a.activo_id = ac.id
      WHERE a.id = ?`;
		const [asignacion] = await db.query(getActivoQuery, [id]);

		if (!asignacion || asignacion.length === 0) {
			return res.status(404).json({ error: "Asignación no encontrada" });
		}

		const { activo_id, activo_nombre } = asignacion[0];

		// Paso 2: Actualizar el estado del activo a "Disponible"
		const updateActivoQuery =
			'UPDATE activos SET estado = "Disponible" WHERE id = ?';
		await db.query(updateActivoQuery, [activo_id]);

		// Paso 3: Eliminar la asignación
		const deleteAsignacionQuery = "DELETE FROM asignaciones WHERE id = ?";
		await db.query(deleteAsignacionQuery, [id]);

		// Paso 4: Registrar en el historial
		const accion = "Desasignado";
		const detalles = `Se desasignó el activo "${activo_nombre}" del usuario.`;

		const insertHistorialQuery = `
  INSERT INTO Historial (
    activo_id,
    accion,
    usuario_responsable,
    detalles
  ) VALUES (?, ?, ?, ?)
`;

		await db.query(insertHistorialQuery, [
			activo_id,
			accion,
			req.user.id, // ID del usuario autenticado (debes tenerlo en req.user)
			detalles,
		]);

		// Respuesta exitosa
		res.json({
			message: "Asignación eliminada y activo liberado correctamente",
			data: {
				id_asignacion_eliminada: id,
				nombre_activo: activo_nombre,
			},
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

exports.getActivosDisponibles = async (req, res) => {
	try {
		// Parámetros de paginación
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const offset = (page - 1) * limit;

		const orden = req.query.orden || "asc";
		const direccionOrden = orden.toLowerCase() === "desc" ? "DESC" : "ASC";

		// Parámetros de filtrado (todos opcionales)
		const { search = "", tipo, ubicacion, proveedores } = req.query;

		// Construir WHERE dinámico
		const whereClauses = ["activos.estado = 'Disponible'"]; // Filtro base: solo activos "Disponibles"
		const queryParams = [];

		// Búsqueda general (nombre)
		if (search) {
			whereClauses.push(`activos.nombre LIKE ?`);
			queryParams.push(`%${search}%`);
		}

		// Filtros específicos
		if (tipo) {
			whereClauses.push(`activos.tipo_id = ?`);
			queryParams.push(tipo);
		}
		if (ubicacion) {
			whereClauses.push(`activos.ubicacion_id = ?`);
			queryParams.push(ubicacion);
		}
		if (proveedores) {
			whereClauses.push(`activos.proveedor_id = ?`);
			queryParams.push(proveedores);
		}

		// Combinar condiciones con AND
		const whereClause = whereClauses.join(" AND ");

		// Consulta principal para obtener los activos disponibles
		console.time("Consulta principal");
		const [rows] = await db.query(
			`
      SELECT 
          activos.id,
          activos.nombre AS activo,
          tipos.nombre AS tipo_activo,
          activos.estado AS estado_activo,
          proveedores.nombre AS proveedor, -- Nombre del proveedor
          ubicaciones.nombre AS ubicacion,
          activos.foto_url AS foto_url
      FROM activos
      LEFT JOIN tipos ON activos.tipo_id = tipos.id  
      LEFT JOIN proveedores ON activos.proveedor_id = proveedores.id -- Unión con la tabla Proveedores
      LEFT JOIN ubicaciones ON activos.ubicacion_id = ubicaciones.id  
      WHERE ${whereClause} -- Aplicar filtros
      ORDER BY activos.id ${direccionOrden} -- Ordenamiento
      LIMIT ? OFFSET ?
      `,
			[...queryParams, limit, offset], // Parámetros seguros
		);
		console.timeEnd("Consulta principal");

		// Consulta para obtener el total de activos disponibles filtrados
		console.time("Consulta total");
		const [totalRows] = await db.query(
			`
      SELECT COUNT(*) AS total
      FROM activos
      LEFT JOIN tipos ON activos.tipo_id = tipos.id  
      LEFT JOIN proveedores ON activos.proveedor_id = proveedores.id -- Unión con la tabla Proveedores
      LEFT JOIN ubicaciones ON activos.ubicacion_id = ubicaciones.id  
      WHERE ${whereClause} -- Aplicar filtros
      `,
			queryParams,
		);
		console.timeEnd("Consulta total");

		const total = totalRows[0].total;

		// Respuesta con paginación, búsqueda y opciones dinámicas
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
		console.error("[ERROR GET ACTIVOS DISPONIBLES]:", error.message); // Logs detallados para depuración
		res.status(500).json({ error: "Error al obtener los activos disponibles" });
	}
};

exports.obtenerDatosAuxiliares = async (req, res) => {
	try {
		// Obtener el ID del activo desde los parámetros de la solicitud
		const { id } = req.params;
		console.log("ID recibido:", id);

		// Validar que el ID sea un número
		if (id && isNaN(Number(id))) {
			return res
				.status(400)
				.json({ error: "El ID proporcionado no es válido" });
		}

		// Consulta para obtener los usuarios
		let usuarios;
		try {
			[usuarios] = await db.query("SELECT id, nombre FROM usuarios");
		} catch (queryError) {
			console.error("Error al consultar usuarios:", queryError);
			return res.status(500).json({ error: "Error al obtener los usuarios" });
		}

		// Consulta para obtener los tipos de activos
		let tiposActivos;
		try {
			[tiposActivos] = await db.query("SELECT id, nombre FROM tipos");
		} catch (queryError) {
			console.error("Error al consultar tipos de activos:", queryError);
			return res
				.status(500)
				.json({ error: "Error al obtener los tipos de activos" });
		}

		// Consulta para obtener los proveedores
		let proveedores;
		try {
			[proveedores] = await db.query("SELECT id, nombre FROM proveedores");
		} catch (queryError) {
			console.error("Error al consultar proveedores:", queryError);
			return res
				.status(500)
				.json({ error: "Error al obtener los proveedores" });
		}

		// Consulta para obtener las ubicaciones
		let ubicaciones;
		try {
			[ubicaciones] = await db.query("SELECT id, nombre FROM ubicaciones");
		} catch (queryError) {
			console.error("Error al consultar ubicaciones:", queryError);
			return res
				.status(500)
				.json({ error: "Error al obtener las ubicaciones" });
		}

		// Variable para almacenar el nombre del activo
		let nombreActivo = null;

		// Si se proporciona un ID, buscar el nombre del activo
		if (id) {
			try {
				const [activo] = await db.query(
					"SELECT nombre FROM activos WHERE id = ?",
					[id],
				);

				// Si no se encuentra el activo, devolver un error 404
				if (activo.length === 0) {
					return res.status(404).json({ error: "Activo no encontrado" });
				}

				// Asignar el nombre del activo si existe
				nombreActivo = activo[0].nombre;
			} catch (queryError) {
				console.error("Error al consultar activo:", queryError);
				return res.status(500).json({ error: "Error al obtener el activo" });
			}
		}

		// Devuelve los datos en un objeto JSON
		res.status(200).json({
			usuarios,
			tiposActivos,
			proveedores,
			ubicaciones,
			nombreActivo,
		});
	} catch (error) {
		console.error("Error general al obtener datos auxiliares:", error);

		// Error genérico para otros casos
		res.status(500).json({ error: "Error interno del servidor" });
	}
};
