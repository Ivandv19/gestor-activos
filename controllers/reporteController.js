const db = require("../config/db");

exports.getTiposReporte = async (req, res) => {
	try {
		// Consulta SQL directa a la base de datos
		const query = "SELECT id, nombre, descripcion, activo FROM tiposreporte";
		const [tiposReporte] = await db.query(query);

		// Validación de datos encontrados
		if (!tiposReporte || tiposReporte.length === 0) {
			console.warn("[WARN] No hay tipos de reporte registrados");
			return res
				.status(404)
				.json({ error: "No existen tipos de reporte registrados." });
		}

		// Respuesta exitosa
		res.status(200).json({
			success: true,
			tiposReporte,
		});
	} catch (error) {
		console.error("[ERROR CRÍTICO] Fallo en getTiposReporte:", {
			error: error.message,
			query: error.sql, // Si es error de MySQL
			timestamp: new Date().toLocaleString(),
		});

		// Respuesta de error simplificada
		res.status(500).json({ error: "Error en la consulta." });
	}
};

exports.getDatosAuxiliares = async (req, res) => {
	try {
		// Consultas SQL para obtener los datos
		const [tiposActivo] = await db.query("SELECT id, nombre FROM Tipos");
		const [usuarios] = await db.query("SELECT id, nombre FROM usuarios");
		const [ubicaciones] = await db.query("SELECT id, nombre FROM Ubicaciones");
		const [proveedores] = await db.query("SELECT id, nombre FROM Proveedores");

		// Construir la respuesta
		const response = {
			tiposActivo,
			usuarios,
			ubicaciones,
			proveedores,
		};

		// Enviar la respuesta al cliente
		res.json(response);
	} catch (error) {
		console.error(
			"[ERROR] Error al obtener los datos auxiliares:",
			error.message,
		);
		res.status(500).json({
			message: "Error al obtener los datos auxiliares",
			error: error.message,
		});
	}
};

exports.generarReporte = async (req, res) => {
	try {
		const { tipo_id, filtros } = req.body;
		console.log(tipo_id, filtros);

		// Validar que se haya proporcionado un tipo de reporte
		if (!tipo_id) {
			return res
				.status(400)
				.json({ error: "El campo 'tipo_id' es obligatorio." });
		}
		// Consultar el tipo de reporte en la tabla TiposReporte
		const [tipoReporteRows] = await db.query(
			"SELECT id, nombre, descripcion FROM TiposReporte WHERE id = ? AND activo = TRUE",
			[tipo_id],
		);
		if (tipoReporteRows.length === 0) {
			return res
				.status(400)
				.json({ error: "Tipo de reporte no válido o inactivo." });
		}

		const tipoReporte = tipoReporteRows[0];
		const { nombre: tipo_reporte, descripcion } = tipoReporte;

		let queryBase = "";
		const conditions = [];
		const params = [];

		// Definir la lógica para cada tipo de reporte
		switch (tipo_id) {
			case 1: // Reporte: Activos por estado
				queryBase = `
        SELECT a.estado, COUNT(*) AS cantidad
        FROM Activos a
        LEFT JOIN Asignaciones asig ON a.id = asig.activo_id
        GROUP BY a.estado;
    `;
				break;

			case 2: // Reporte: Activos asignados por usuario
				queryBase = `
      SELECT u.nombre AS usuario, COUNT(a.id) AS cantidad
      FROM Asignaciones asig
      JOIN usuarios u ON asig.usuario_id = u.id
      JOIN Activos a ON asig.activo_id = a.id
      GROUP BY u.nombre;
    `;
				break;

			case 3: // Reporte: Garantías por estado
				queryBase = `
          SELECT g.estado, COUNT(*) AS cantidad
          FROM Garantias g
          JOIN Activos a ON g.activo_id = a.id
          GROUP BY g.estado;
        `;
				break;

			case 4: // Reporte: Costo total de activos
				queryBase = `
          SELECT SUM(a.valor_compra) AS costo_total
          FROM Activos a
          LEFT JOIN Asignaciones asig ON a.id = asig.activo_id
        `;
				break;

			case 5: // Reporte: Historial de asignaciones
				queryBase = `
      SELECT a.nombre AS activo, u.nombre AS usuario, asig.fecha_asignacion, asig.fecha_devolucion
      FROM Asignaciones asig
      JOIN Activos a ON asig.activo_id = a.id
      JOIN usuarios u ON asig.usuario_id = u.id
    `;
				break;

			case 6: // Reporte: Activos por tipo
				queryBase = `
      SELECT t.nombre AS tipo, COUNT(a.id) AS cantidad
      FROM Activos a
      JOIN Tipos t ON a.tipo_id = t.id
      GROUP BY t.nombre;
    `;
				break;

			case 7: // Reporte: Ubicación de activos
				queryBase = `
      SELECT u.nombre AS ubicacion, COUNT(a.id) AS cantidad
      FROM Activos a
      JOIN Ubicaciones u ON a.ubicacion_id = u.id
      GROUP BY u.nombre;
    `;
				break;

			default:
				return res.status(400).json({ error: "Tipo de reporte no válido." });
		}

		// Funciones auxiliares para obtener campos dinámicos
		function getFechaField(tipo_id) {
			if (tipo_id === 1) {
				// Reporte 1: Activos por estado
				return ["fecha_registro", "fecha_salida"];
			} else if (tipo_id === 2) {
				// Reporte 2: Reporte de activos asignados por usuario
				return ["fecha_asignacion", "fecha_devolucion"];
			} else if (tipo_id === 3) {
				// Reporte 3: Reporte de garantías
				return ["fecha_inicio", "fecha_fin"];
			} else if (tipo_id === 5) {
				// Reporte 5: Historial de asignaciones
				return ["fecha_asignacion", "fecha_devolucion"];
			} else {
				// Valor predeterminado (devolver un array en lugar de un string)
				return ["fecha_registro", "fecha_salida"];
			}
		}

		function getUbicacionField(tipo_id) {
			if (tipo_id === 2) {
				// Reporte 2: Filtrar por el campo "ubicacion_id" en la tabla Asignaciones
				return "asig.ubicacion_id = ?";
			} else if (tipo_id === 3) {
				// Reporte 3: Filtrar por el campo "ubicacion_id" en la tabla activos
				return "a.ubicacion_id = ?"; // Usamos alias 'a'
			} else if (tipo_id === 5) {
				// Reporte 5: Historial de asignaciones
				return "asig.ubicacion_id = ?";
			} else {
				// Para otros tipos de reporte, usar el campo "ubicacion_id" en la tabla Activos
				return "a.ubicacion_id = ?"; // Usamos alias 'a'
			}
		}

		function getUsuarioField(tipo_id) {
			if (tipo_id === 1) {
				// Reporte 1: Filtrar por el campo "id" en la tabla Activos
				return "asig.usuario_id = ?"; // Usamos alias 'a'
			} else if (tipo_id === 2) {
				// Reporte 2: Filtrar por el campo "usuario_id" en la tabla Asignaciones
				return "asig.usuario_id = ?"; // Usamos alias 'asig'
			} else if (tipo_id === 3) {
				// Reporte 3: Filtrar por usuario vía activos asignados
				return "a.id IN (SELECT activo_id FROM Asignaciones WHERE usuario_id = ?)";
			} else if (tipo_id === 4) {
				// Reporte 4: Filtrar por el campo "id" vía activos asignados
				return "a.id IN (SELECT activo_id FROM Asignaciones WHERE usuario_id = ?)";
			} else if (tipo_id === 5) {
				// Reporte 5: Historial de asignaciones
				return "asig.usuario_id = ?"; // Usamos alias 'asig'
			} else if (tipo_id === 6) {
				// Reporte 6: Filtrar por el campo "id" vía activos asignados
				return "a.id IN (SELECT activo_id FROM Asignaciones WHERE usuario_id = ?)";
			} else if (tipo_id === 7) {
				// Reporte 7: Filtrar por usuario vía activos asignados
				return "a.id IN (SELECT activo_id FROM Asignaciones WHERE usuario_id = ?)";
			} else {
				// Para otros tipos de reporte, usar una subconsulta
				return "a.id = ?"; // Alias 'a'
			}
		}

		function getProveedorField(tipo_id) {
			if (tipo_id === 3) {
				// Reporte 3: Filtrar por el campo "proveedor_id" en la tabla Garantías
				return "g.proveedor_garantia_id = ?"; // Usamos alias 'g'
			} else {
				// Para otros tipos de reporte, usar una subconsulta
				return "a.proveedor_id = ?"; // Suponemos que está en la tabla Activos con alias 'a'
			}
		}

		function getTipoActivoField(tipo_id) {
			if (tipo_id === 5) {
				// Reporte 5: Filtrar por el campo "tipo_id" en la tabla Activos
				return "a.tipo_id = ?"; // Usamos alias 'a'
			} else {
				// Para otros tipos de reporte, usar una subconsulta
				return "a.tipo_id = ?"; // Suponemos que está en la tabla Activos con alias 'a'
			}
		}

		// Aplicar filtros dinámicamente
		if (filtros && Object.keys(filtros).length > 0) {
			for (const [key, value] of Object.entries(filtros)) {
				// Ignorar filtros con valor null
				if (value === null || value === undefined) {
					continue;
				}
				switch (key) {
					case "tipo_activo_id": // Filtrar por tipo de activo
						if (value) {
							const tipoActivoCondition = getTipoActivoField(tipo_id); // Obtener la condición SQL según el tipo de reporte
							conditions.push(tipoActivoCondition);
							params.push(value);
						}
						break;

					case "usuario_id": // Filtrar por usuario
						if (value) {
							const usuarioCondition = getUsuarioField(tipo_id); // Obtener la condición SQL según el tipo de reporte
							conditions.push(usuarioCondition);
							params.push(value);
						}
						break;

					case "proveedor_id": // Filtrar por proveedor
						if (value) {
							const proveedorCondition = getProveedorField(tipo_id); // Obtener la condición SQL según el tipo de reporte
							conditions.push(proveedorCondition);
							params.push(value);
						}
						break;

					case "ubicacion_id": // Filtrar por ubicación
						if (value) {
							const ubicacionCondition = getUbicacionField(tipo_id); // Obtener la condición SQL según el tipo de reporte
							conditions.push(ubicacionCondition);
							params.push(value);
						}
						break;
					case "fecha_inicio": // Filtrar por fecha de inicio
						if (value) {
							const fechaField = getFechaField(tipo_id); // Obtener el array de fechas según el tipo de reporte
							conditions.push(`${fechaField[0]} >= ?`); // Acceder al primer campo (fecha de inicio)
							params.push(value); // Fecha inicial
						}
						break;

					case "fecha_fin": // Filtrar por fecha de fin
						if (value) {
							const fechaField = getFechaField(tipo_id); // Obtener el array de fechas según el tipo de reporte
							conditions.push(`${fechaField[1]} <= ?`); // Acceder al segundo campo (fecha de fin)
							params.push(value); // Fecha final
						}
						break;

					default:
						break;
				}
			}
		}

		// Construir la consulta final
		let query = queryBase;

		// Separar la consulta base y el GROUP BY (si existe)
		let [baseQuery, groupByClause] = query.split("GROUP BY");

		// Agregar condiciones dinámicamente
		if (conditions.length > 0) {
			baseQuery += ` WHERE ${conditions.join(" AND ")}`;
		}

		// Reconstruir la consulta completa
		query =
			baseQuery + (groupByClause ? ` GROUP BY ${groupByClause.trim()}` : "");

		console.log("Consulta final:", query);
		// Ejecutar la consulta
		const [results] = await db.query(query, params);

		// Procesar los resultados
		const resumen = {};
		let detalles = [];

		if (tipo_id === 1 || tipo_id === 6 || tipo_id === 7) {
			// Reportes simples (ej.: Activos por estado, Activos por tipo, Ubicación de activos)
			results.forEach((row) => {
				resumen[row.estado || row.tipo || row.ubicacion] = row.cantidad;
			});
			detalles = results; // Guardar los datos detallados
		} else if (tipo_id === 5) {
			// Reporte complejo: Historial de asignaciones
			detalles = results; // Guardar los datos detallados

			// Generar un resumen dinámico
			const resumenTemporal = {};
			results.forEach((row) => {
				if (!resumenTemporal[row.usuario]) {
					resumenTemporal[row.usuario] = 0;
				}
				resumenTemporal[row.usuario]++;
			});
			Object.assign(resumen, resumenTemporal);
		} else if (tipo_id === 4) {
			// Reporte especial: Costo total de activos
			detalles = results; // Guardar los datos detallados
			resumen["Costo total"] = results[0]?.costo_total || 0; // Generar un resumen simple
		} else if (tipo_id === 2 || tipo_id === 3) {
			// Reportes complejos: Activos asignados por usuario y Garantías por estado
			detalles = results; // Guardar los datos detallados

			// Generar un resumen dinámico
			results.forEach((row) => {
				resumen[row.usuario || row.estado] = row.cantidad;
			});
		}

		// Construir la respuesta estándar
		return res.json({
			success: true,
			message: "Reporte generado exitosamente.",
			tipo_reporte: tipo_reporte,
			descripcion: descripcion,
			filtros: {
				tipo_activo: await getNombreTipoActivo(filtros.tipo_activo_id),
				usuario: await getNombreUsuario(filtros.usuario_id),
				ubicacion: await getNombreUbicacion(filtros.ubicacion_id),
				proveedor: await getNombreProveedor(filtros.proveedor_id),
				fecha_inicio: filtros.fecha_inicio || null,
				fecha_fin: filtros.fecha_fin || null,
			},
			resultados: {
				resumen: resumen,
				detalles: detalles,
			},
		});
	} catch (error) {
		console.error("[ERROR]", error.message);
		return res.status(500).json({
			success: false,
			message: "Error al generar el reporte.",
			error: error.message,
		});
	}

	// Funciones auxiliares para obtener nombres relacionados
	async function getNombreTipoActivo(tipo_activo_id) {
		if (!tipo_activo_id) return "Todos";
		const [rows] = await db.query("SELECT nombre FROM tipos WHERE id = ?", [
			tipo_activo_id,
		]);
		return rows.length > 0 ? rows[0].nombre : "Desconocido";
	}

	async function getNombreUsuario(usuario_id) {
		if (!usuario_id) return "Todos";
		const [rows] = await db.query("SELECT nombre FROM usuarios WHERE id = ?", [
			usuario_id,
		]);
		return rows.length > 0 ? rows[0].nombre : "Desconocido";
	}

	async function getNombreUbicacion(ubicacion_id) {
		if (!ubicacion_id) return "Todos";
		const [rows] = await db.query(
			"SELECT nombre FROM Ubicaciones WHERE id = ?",
			[ubicacion_id],
		);
		return rows.length > 0 ? rows[0].nombre : "Desconocido";
	}

	async function getNombreProveedor(proveedor_id) {
		if (!proveedor_id) return "Todos";
		const [rows] = await db.query(
			"SELECT nombre FROM Proveedores WHERE id = ?",
			[proveedor_id],
		);
		return rows.length > 0 ? rows[0].nombre : "Desconocido";
	}
};
