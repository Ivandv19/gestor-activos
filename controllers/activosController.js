const db = require("../config/db");

exports.getActivos = async (req, res) => {
	try {
		console.log("\n[BACKEND] Parámetros recibidos:", req.query);

		// Configuración inicial de paginación y ordenamiento
		const page = parseInt(req.query.page) || 1; // Página actual (default 1)
		const limit = parseInt(req.query.limit) || 10; // Límite por página (default 10)
		const offset = (page - 1) * limit; // Cálculo de offset para paginación
		const orden = req.query.orden || "asc"; // Dirección de ordenamiento (asc/desc)
		const direccionOrden = orden.toLowerCase() === "desc" ? "DESC" : "ASC"; // Validación orden

		//Filtros de búsqueda
		const {
			search = "",
			tipo,
			estado,
			ubicacion,
			usuario_asignado,
			licencia_proxima,
			garantia_proxima,
			fecha_devolucion_proxima,
			fecha_inicio,
			fecha_fin,
		} = req.query;

		// Preparación de cláusulas WHERE dinámicas
		const whereClauses = []; // Array para condiciones WHERE
		const queryParams = []; // Array para valores de parámetros

		// Construcción de condiciones de búsqueda
		if (search) {
			whereClauses.push(`(activos.nombre LIKE ? OR activos.id LIKE ?)`); // Búsqueda en nombre o ID
			queryParams.push(`%${search}%`, `%${search}%`); // Parámetros para LIKE
		}

		// Agregar filtros específicos si están presentes
		if (tipo) {
			whereClauses.push(`activos.tipo_id = ?`); // Filtro por tipo
			queryParams.push(tipo);
		}
		if (estado) {
			whereClauses.push(`activos.estado = ?`); // Filtro por estado
			queryParams.push(estado);
		}
		if (ubicacion) {
			whereClauses.push(`activos.ubicacion_id = ?`); // Filtro por ubicación
			queryParams.push(ubicacion);
		}
		if (usuario_asignado) {
			whereClauses.push(`asignaciones.usuario_id = ?`); // Filtro por usuario
			queryParams.push(usuario_asignado);
		}

		if (licencia_proxima === "true") {
			whereClauses.push(
				`activos.tipo_licencia IS NOT NULL AND activos.fecha_vencimiento_licencia BETWEEN ? AND ?`, //Filtro por licencia próxima
			);
			queryParams.push(
				fecha_inicio || new Date(),
				fecha_fin || new Date(new Date().setDate(new Date().getDate() + 30)),
			);
		}
		// Agregar joins condicionales
		let joins = `
  LEFT JOIN tipos ON activos.tipo_id = tipos.id
  LEFT JOIN proveedores ON activos.proveedor_id = proveedores.id
  LEFT JOIN ubicaciones ON activos.ubicacion_id = ubicaciones.id
  LEFT JOIN asignaciones ON activos.id = asignaciones.activo_id
  LEFT JOIN usuarios ON asignaciones.usuario_id = usuarios.id
`;
		if (garantia_proxima === "true") {
			// Agregar join condicional para la tabla Garantias
			joins += ` LEFT JOIN garantias ON activos.id = garantias.activo_id`;

			// Opción 2: Filtrar por fecha de vencimiento próxima (dentro de los próximos 30 días)

			whereClauses.push(`garantias.fecha_fin BETWEEN ? AND ?`);
			queryParams.push(
				new Date(), // Fecha actual
				new Date(new Date().setDate(new Date().getDate() + 30)), // Fecha dentro de 30 días
			);
		}

		if (fecha_devolucion_proxima === "true") {
			whereClauses.push(`asignaciones.fecha_devolucion BETWEEN ? AND ?`); // Filtro por fecha de devolución próxima
			queryParams.push(
				fecha_inicio || new Date(),
				fecha_fin || new Date(new Date().setDate(new Date().getDate() + 30)),
			);
		}

		// Combinación final de condiciones WHERE
		const whereClause =
			whereClauses.length > 0
				? `WHERE ${whereClauses.join(" AND ")}` // Unir condiciones con AND
				: ""; // Cadena vacía si no hay filtros

		// Consulta principal para obtener activos con joins
		const [rows] = await db.query(
			`SELECT 
        activos.*, 
        tipos.nombre AS tipo,
        proveedores.nombre AS proveedor,
        ubicaciones.nombre AS ubicacion,
        usuarios.nombre AS usuario_asignado
      FROM activos
      ${joins}
      ${whereClause}
      ORDER BY activos.id ${direccionOrden}  
      LIMIT ? OFFSET ?`,
			[...queryParams, limit, offset],
		);

		// Consulta para contar el total de registros
		const [totalRows] = await db.query(
			`SELECT COUNT(*) AS total
      FROM activos
      ${joins}
      ${whereClause}`,
			queryParams,
		);

		const total = totalRows[0].total; // Total de registros sin paginación
		console.log("[BACKEND] Resultados encontrados:", rows.length);

		// Construcción de respuesta final
		res.json({
			data: rows, // Array de resultados
			pagination: {
				page, // Página actual
				limit, // Límite por página
				total, // Total de registros
				totalPages: Math.ceil(total / limit), // Cálculo de páginas totales
			},
		});
	} catch (error) {
		console.error("[ERROR GET ACTIVOS]:", error);
		res.status(500).json({ error: "Error al obtener los activos" });
	}
};

exports.getActivoById = async (req, res) => {
	const { id } = req.params; // Extraemos el ID del activo de los parámetros de la ruta

	// Validación básica del ID (debe ser número entero positivo)
	if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
		console.warn("[GET ACTIVO BY ID]: ID inválido:", id);
		return res.status(400).json({ error: "ID inválido" });
	}

	try {
		// Consulta SQL principal para obtener datos del activo con JOINs a tablas relacionadas
		const [rows] = await db.query(
			`SELECT 
        activos.*, 
        tipos.nombre AS tipo_nombre,  
        proveedores.nombre AS proveedor_nombre,  
        ubicaciones.nombre AS ubicacion_nombre,
        usuarios.id AS dueno_id, 
        usuarios.nombre AS dueno_nombre,
        activos.condicion_fisica AS condicion_fisica  
      FROM activos
      LEFT JOIN tipos ON activos.tipo_id = tipos.id  
      LEFT JOIN proveedores ON activos.proveedor_id = proveedores.id  
      LEFT JOIN ubicaciones ON activos.ubicacion_id = ubicaciones.id  
      LEFT JOIN usuarios ON activos.dueno_id = usuarios.id  
      WHERE activos.id = ?`,
			[id],
		);

		// Validación si no se encontró el activo
		if (rows.length === 0) {
			console.warn("[GET ACTIVO BY ID]: Activo no encontrado con ID:", id);
			return res.status(404).json({ error: "Activo no encontrado" });
		}

		// Consulta adicional para obtener información de garantías asociadas
		const [garantiasRows] = await db.query(
			`SELECT 
        garantias.*,
        proveedoresgarantia.nombre AS proveedor_garantia_nombre
      FROM garantias
      LEFT JOIN proveedoresgarantia ON garantias.proveedor_garantia_id = proveedoresgarantia.id
      WHERE garantias.activo_id = ?`,
			[id],
		);

		const tieneGarantia = garantiasRows.length > 0; // Flag para saber si tiene garantías

		// Estructuración de la respuesta final con todos los datos del activo
		const activo = rows[0];
		res.status(200).json({
			// Datos básicos del activo
			id: activo.id,
			nombre: activo.nombre,

			// Información del tipo de activo
			tipo: {
				id: activo.tipo_id,
				nombre: activo.tipo_nombre,
			},

			// Fechas importantes
			fechaAdquisicion: activo.fecha_adquisicion,
			fechaRegistro: activo.fecha_registro,
			fechaSalida: activo.fecha_salida,

			// Datos financieros
			valorCompra: activo.valor_compra,
			costoMensual: activo.costo_mensual,

			// Identificación y descripción
			etiquetaSerial: activo.etiqueta_serial,
			descripcion: activo.descripcion,

			// Estado y ubicación
			estado: activo.estado,
			ubicacion: {
				id: activo.ubicacion_id,
				nombre: activo.ubicacion_nombre,
			},

			// Información del proveedor
			proveedor: {
				id: activo.proveedor_id,
				nombre: activo.proveedor_nombre,
			},

			// Multimedia
			fotoUrl: activo.foto_url,

			// Datos técnicos
			modelo: activo.modelo,
			versionSoftware: activo.version_software,
			tipoLicencia: activo.tipo_licencia,
			fechaVencimientoLicencia: activo.fecha_vencimiento_licencia,
			recursosAsignados: activo.recursos_asignados,

			// Información del dueño/responsable
			dueno: {
				id: activo.dueno_id,
				nombre: activo.dueno_nombre,
			},

			// Estado físico del activo
			condicionFisica: activo.condicion_fisica || null,

			// Información de garantías (si existe)
			garantia: tieneGarantia
				? garantiasRows.map((garantia) => ({
						id: garantia.id,
						nombre: garantia.nombre_garantia,
						proveedor: {
							id: garantia.proveedor_garantia_id,
							nombre: garantia.proveedor_garantia_nombre,
						},
						fechaInicio: garantia.fecha_inicio,
						fechaFin: garantia.fecha_fin,
						costo: garantia.costo,
						condiciones: garantia.condiciones,
						estado: garantia.estado,
						descripcion: garantia.descripcion,
					}))
				: null,
		});
	} catch (error) {
		console.error("[ERROR GET ACTIVO BY ID]:", error.message);
		res.status(500).json({ error: "Error al obtener el activo" });
	}
};

exports.createActivo = async (req, res) => {
	// Extracción de todos los campos posibles del body
	const {
		nombre,
		tipo_id,
		fecha_adquisicion,
		valor_compra,
		estado,
		proveedor_id,
		ubicacion_id,
		foto_url,
		modelo,
		version_software,
		tipo_licencia,
		fecha_vencimiento_licencia,
		costo_mensual,
		recursos_asignados,
		dueno_id,
		etiqueta_serial,
		condicion_fisica,
		descripcion,

		// Campos específicos para garantía (todos opcionales)
		nombre_garantia,
		proveedor_garantia_id,
		fecha_inicio_garantia,
		fecha_fin_garantia,
		costo,
		condiciones,
		estado_garantia,
		descripcion_garantia,
	} = req.body;

	try {
		// Validación de campos obligatorios para el activo
		if (
			!nombre ||
			!tipo_id ||
			!fecha_adquisicion ||
			!valor_compra ||
			!estado ||
			!proveedor_id
		) {
			return res
				.status(400)
				.json({ error: "Faltan datos obligatorios del activo" });
		}

		// Validación numérica para el valor de compra
		if (isNaN(valor_compra) || parseFloat(valor_compra) <= 0) {
			return res
				.status(400)
				.json({ error: "El valor de compra debe ser un número positivo" });
		}

		// Validación de formato de fecha para adquisición
		if (isNaN(Date.parse(fecha_adquisicion))) {
			return res
				.status(400)
				.json({ error: "La fecha de adquisición no es válida" });
		}

		// Validación opcional para costo mensual
		if (
			costo_mensual &&
			(isNaN(costo_mensual) || parseFloat(costo_mensual) < 0)
		) {
			return res
				.status(400)
				.json({ error: "El costo mensual debe ser un número positivo o cero" });
		}

		// Validación de unicidad para etiqueta serial (si se proporciona)
		if (etiqueta_serial) {
			const [existingSerial] = await db.query(
				"SELECT id FROM activos WHERE etiqueta_serial = ?",
				[etiqueta_serial],
			);
			if (existingSerial.length > 0) {
				return res
					.status(400)
					.json({ error: "La etiqueta serial ya está registrada" });
			}
		}

		// Validación de valores permitidos para condición física
		if (
			condicion_fisica &&
			!["Nuevo", "Usado", "Dañado"].includes(condicion_fisica)
		) {
			return res.status(400).json({
				error: 'La condición física debe ser "Nuevo", "Usado" o "Dañado"',
			});
		}

		// Validación de longitud máxima para descripción (opcional)
		if (descripcion && descripcion.length > 500) {
			return res
				.status(400)
				.json({ error: "La descripción no puede exceder los 500 caracteres" });
		}

		// Validaciones para garantía (solo si se proporciona algún campo)
		if (
			nombre_garantia ||
			proveedor_garantia_id ||
			fecha_inicio_garantia ||
			fecha_fin_garantia ||
			costo ||
			condiciones ||
			estado_garantia ||
			descripcion_garantia
		) {
			// Campos obligatorios para garantía
			if (
				!nombre_garantia ||
				!proveedor_garantia_id ||
				!fecha_inicio_garantia ||
				!fecha_fin_garantia
			) {
				return res
					.status(400)
					.json({ error: "Datos incompletos para la garantía" });
			}

			// Validación de fechas para garantía
			if (
				isNaN(Date.parse(fecha_inicio_garantia)) ||
				isNaN(Date.parse(fecha_fin_garantia))
			) {
				return res.status(400).json({ error: "Fechas de garantía no válidas" });
			}

			// Validación de costo para garantía
			if (costo && (isNaN(costo) || parseFloat(costo) < 0)) {
				return res.status(400).json({
					error: "El costo de la garantía debe ser un número positivo o cero",
				});
			}

			// Validación de longitud para condiciones de garantía
			if (condiciones && condiciones.length > 500) {
				return res.status(400).json({
					error: "Las condiciones no pueden exceder los 500 caracteres",
				});
			}
		}

		// Construcción dinámica de la consulta SQL para el activo
		const fields = []; // Campos a insertar
		const values = []; // Valores correspondientes

		// Función auxiliar para agregar campos dinámicamente
		const addField = (field, value) => {
			if (value !== undefined && value !== null) {
				fields.push(field);
				values.push(value);
			}
		};

		// Agregar todos los campos (solo si tienen valor)
		addField("nombre", nombre);
		addField("tipo_id", tipo_id);
		addField("fecha_adquisicion", fecha_adquisicion);
		addField("valor_compra", valor_compra);
		addField("estado", estado);
		addField("proveedor_id", proveedor_id);
		addField("ubicacion_id", ubicacion_id);
		addField("foto_url", foto_url);
		addField("modelo", modelo);
		addField("version_software", version_software);
		addField("tipo_licencia", tipo_licencia);
		addField("fecha_vencimiento_licencia", fecha_vencimiento_licencia);
		addField("costo_mensual", costo_mensual);
		addField("recursos_asignados", recursos_asignados);
		addField("dueno_id", dueno_id);
		addField("descripcion", descripcion);
		addField("etiqueta_serial", etiqueta_serial);
		addField("condicion_fisica", condicion_fisica);

		// Ejecutar inserción del activo
		const query = `INSERT INTO activos (${fields.join(", ")}) VALUES (${values.map(() => "?").join(", ")})`;
		const [result] = await db.query(query, values);

		const activoId = result.insertId; // ID del nuevo activo

		// Insertar garantía si se proporcionaron los campos obligatorios
		if (
			nombre_garantia &&
			proveedor_garantia_id &&
			fecha_inicio_garantia &&
			fecha_fin_garantia
		) {
			await db.query(
				`INSERT INTO garantias 
        (activo_id, proveedor_garantia_id, nombre_garantia, fecha_inicio, fecha_fin, costo, condiciones, estado, descripcion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					activoId,
					proveedor_garantia_id,
					nombre_garantia,
					fecha_inicio_garantia,
					fecha_fin_garantia,
					costo || null,
					condiciones || null,
					estado_garantia || "Vigente",
					descripcion_garantia || null,
				],
			);
		}

		// Registrar acción en el historial
		const comentariosDinamicos = `Activo "${nombre}" creado con estado "${estado}".`;

		await db.query(
			`INSERT INTO historial (activo_id, accion, usuario_responsable, detalles)
      VALUES (?, ?, ?, ?)`,
			[
				activoId,
				"Activo creado",
				req.user?.id || null, // Usuario autenticado (si existe)
				comentariosDinamicos,
			],
		);

		// Respuesta exitosa
		res
			.status(201)
			.json({ id: activoId, message: "Activo creado exitosamente" });
	} catch (error) {
		console.error("[ERROR CREATE ACTIVO]:", error.message);
		res.status(500).json({ error: "Error al crear el activo" });
	}
};

function formatearFechaParaHistorial(valor) {
	// Verificar si el valor ya está en el formato deseado (YYYY-MM-DD)
	if (typeof valor === "string" && valor.match(/^\d{4}-\d{2}-\d{2}$/)) {
		return valor; // Devolver tal cual si ya está formateado correctamente
	}

	// Intentar crear un objeto Date a partir del valor recibido
	const fecha = new Date(valor);

	// Verificar si la fecha creada es válida (no es NaN)
	if (!isNaN(fecha.getTime())) {
		// Convertir a formato ISO y extraer solo la parte de la fecha (YYYY-MM-DD)
		return fecha.toISOString().split("T")[0];
	}

	// Si no es una fecha reconocible, devolver el valor original sin modificar
	return valor;
}

exports.updateActivo = async (req, res) => {
	// Extracción de parámetros y datos del cuerpo
	const { id } = req.params;
	const {
		nombre,
		tipo_id,
		fecha_adquisicion,
		fecha_registro,
		fecha_salida,
		valor_compra,
		etiqueta_serial,
		descripcion,
		estado,
		proveedor_id,
		ubicacion_id,
		foto_url,
		modelo,
		version_software,
		tipo_licencia,
		fecha_vencimiento_licencia,
		costo_mensual,
		recursos_asignados,
		dueno_id,
		nombre_garantia,
		proveedor_garantia_id,
		fecha_inicio,
		fecha_fin,
		estado_garantia,
		descripcion_garantia,
		costo,
		condiciones,
	} = req.body;

	try {
		// 1. VERIFICACIÓN INICIAL - Comprobar que el activo existe
		const [activoExistente] = await db.query(
			"SELECT * FROM activos WHERE id = ?",
			[id],
		);
		if (activoExistente.length === 0) {
			return res.status(404).json({ error: "El activo no existe." });
		}

		// 2. VALIDACIONES DE DATOS

		// Validaciones numéricas para campos monetarios

		if (
			valor_compra &&
			(isNaN(valor_compra) || parseFloat(valor_compra) <= 0)
		) {
			return res
				.status(400)
				.json({ error: "El valor de compra debe ser un número positivo" });
		}

		if (
			costo_mensual &&
			(isNaN(costo_mensual) || parseFloat(costo_mensual) < 0)
		) {
			return res
				.status(400)
				.json({ error: "El costo mensual debe ser un número positivo o cero" });
		}

		if (costo && (isNaN(costo) || parseFloat(costo) < 0)) {
			return res.status(400).json({
				error: "El costo de la garantía debe ser un número positivo o cero",
			});
		}
		// Validaciones de formato de fecha
		if (fecha_adquisicion && isNaN(Date.parse(fecha_adquisicion))) {
			return res
				.status(400)
				.json({ error: "La fecha de adquisición no es válida" });
		}

		if (fecha_registro && isNaN(Date.parse(fecha_registro))) {
			return res
				.status(400)
				.json({ error: "La fecha de registro no es válida" });
		}

		if (fecha_salida && isNaN(Date.parse(fecha_salida))) {
			return res.status(400).json({ error: "La fecha de salida no es válida" });
		}
		// Validación de unicidad para etiqueta serial
		if (etiqueta_serial) {
			const [existingSerial] = await db.query(
				"SELECT id FROM activos WHERE etiqueta_serial = ? AND id != ?",
				[etiqueta_serial, id],
			);
			if (existingSerial.length > 0) {
				return res
					.status(400)
					.json({ error: "La etiqueta serial ya está registrada" });
			}
		}
		// Validaciones de relaciones (claves foráneas)
		if (tipo_id) {
			const [tipoExists] = await db.query("SELECT id FROM tipos WHERE id = ?", [
				tipo_id,
			]);
			if (tipoExists.length === 0) {
				return res.status(400).json({ error: "El tipo de activo no existe" });
			}
		}

		if (proveedor_id) {
			const [proveedorExists] = await db.query(
				"SELECT id FROM proveedores WHERE id = ?",
				[proveedor_id],
			);
			if (proveedorExists.length === 0) {
				return res.status(400).json({ error: "El proveedor no existe" });
			}
		}

		if (ubicacion_id) {
			const [ubicacionExists] = await db.query(
				"SELECT id FROM ubicaciones WHERE id = ?",
				[ubicacion_id],
			);
			if (ubicacionExists.length === 0) {
				return res.status(400).json({ error: "La ubicación no existe" });
			}
		}
		// 3. PREPARACIÓN DE CAMBIOS PARA HISTORIAL

		// Obtener nombres de relaciones existentes para el historial
		const [tipoAnterior] = await db.query(
			"SELECT nombre FROM tipos WHERE id = ?",
			[activoExistente[0].tipo_id],
		);
		const [proveedorAnterior] = await db.query(
			"SELECT nombre FROM proveedores WHERE id = ?",
			[activoExistente[0].proveedor_id],
		);
		const [ubicacionAnterior] = await db.query(
			"SELECT nombre FROM ubicaciones WHERE id = ?",
			[activoExistente[0].ubicacion_id],
		);
		const [duenoAnterior] = await db.query(
			"SELECT nombre FROM usuarios WHERE id = ?",
			[activoExistente[0].dueno_id],
		);

		// 3. Preparar cambios para el historial
		let comentariosDinamicos = "";
		const cambios = {};

		const registrarCambio = (
			campo,
			valorAnterior,
			valorNuevo,
			esRelacion = false,
		) => {
			if (valorNuevo !== undefined && valorNuevo !== valorAnterior) {
				// Formatea los valores ANTES de crear el mensaje
				const valorAnteriorFormateado =
					formatearFechaParaHistorial(valorAnterior);
				const valorNuevoFormateado = formatearFechaParaHistorial(valorNuevo);

				cambios[campo] = {
					anterior: valorAnteriorFormateado,
					nuevo: valorNuevoFormateado,
				};

				if (esRelacion) {
					return `${campo} cambiado de "${valorAnteriorFormateado}" a "${valorNuevoFormateado}". `;
				} else {
					return `${campo} actualizado de "${valorAnteriorFormateado}" a "${valorNuevoFormateado}". `;
				}
			}
			return "";
		};

		// Registrar cambios para campos básicos
		comentariosDinamicos += registrarCambio(
			"Nombre",
			activoExistente[0].nombre,
			nombre,
		);
		comentariosDinamicos += registrarCambio(
			"Estado",
			activoExistente[0].estado,
			estado,
		);
		comentariosDinamicos += registrarCambio(
			"Descripción",
			activoExistente[0].descripcion,
			descripcion,
		);
		comentariosDinamicos += registrarCambio(
			"Valor de compra",
			activoExistente[0].valor_compra,
			valor_compra,
		);
		comentariosDinamicos += registrarCambio(
			"Fecha adquisición",
			activoExistente[0].fecha_adquisicion,
			fecha_adquisicion,
		);
		comentariosDinamicos += registrarCambio(
			"Fecha registro",
			activoExistente[0].fecha_registro,
			fecha_registro,
		);
		comentariosDinamicos += registrarCambio(
			"Fecha salida",
			activoExistente[0].fecha_salida,
			fecha_salida,
		);

		// Registrar cambios para relaciones (con nombres)
		if (tipo_id && tipo_id !== activoExistente[0].tipo_id) {
			const [nuevoTipo] = await db.query(
				"SELECT nombre FROM tipos WHERE id = ?",
				[tipo_id],
			);
			if (nuevoTipo.length > 0) {
				comentariosDinamicos += registrarCambio(
					"Tipo",
					tipoAnterior[0]?.nombre || "Sin tipo",
					nuevoTipo[0].nombre,
					true,
				);
			}
		}

		if (proveedor_id && proveedor_id !== activoExistente[0].proveedor_id) {
			const [nuevoProveedor] = await db.query(
				"SELECT nombre FROM proveedores WHERE id = ?",
				[proveedor_id],
			);
			if (nuevoProveedor.length > 0) {
				comentariosDinamicos += registrarCambio(
					"Proveedor",
					proveedorAnterior[0]?.nombre || "Sin proveedor",
					nuevoProveedor[0].nombre,
					true,
				);
			}
		}

		if (ubicacion_id && ubicacion_id !== activoExistente[0].ubicacion_id) {
			const [nuevaUbicacion] = await db.query(
				"SELECT nombre FROM ubicaciones WHERE id = ?",
				[ubicacion_id],
			);
			if (nuevaUbicacion.length > 0) {
				comentariosDinamicos += registrarCambio(
					"Ubicación",
					ubicacionAnterior[0]?.nombre || "Sin ubicación",
					nuevaUbicacion[0].nombre,
					true,
				);
			}
		}

		if (dueno_id && dueno_id !== activoExistente[0].dueno_id) {
			const [nuevoDueno] = await db.query(
				"SELECT nombre FROM usuarios WHERE id = ?",
				[dueno_id],
			);
			if (nuevoDueno.length > 0) {
				comentariosDinamicos += registrarCambio(
					"Dueño/Responsable",
					duenoAnterior[0]?.nombre || "Sin dueño",
					nuevoDueno[0].nombre,
					true,
				);
			}
		}

		if (!comentariosDinamicos) {
			comentariosDinamicos = "Sin cambios adicionales.";
		}

		// 4. ACTUALIZACIÓN DEL ACTIVO EN LA BASE DE DATOS

		// Construir consulta dinámica de actualización
		const updates = [];
		const values = [];

		// Mapeo de campos actualizables
		const camposActualizables = {
			nombre,
			tipo_id,
			fecha_adquisicion,
			fecha_registro,
			fecha_salida,
			valor_compra,
			etiqueta_serial,
			descripcion,
			estado,
			proveedor_id,
			ubicacion_id,
			foto_url,
			modelo,
			version_software,
			tipo_licencia,
			fecha_vencimiento_licencia,
			costo_mensual,
			recursos_asignados,
			dueno_id,
		};
		// Preparar SET clauses para la consulta SQL
		Object.entries(camposActualizables).forEach(([key, value]) => {
			if (value !== undefined) {
				updates.push(`${key} = ?`);
				values.push(value);
			}
		});
		// Verificar que hay campos para actualizar
		if (updates.length === 0) {
			return res
				.status(400)
				.json({ error: "No se proporcionaron datos para actualizar" });
		}

		// Ejecutar actualización
		values.push(id);
		const query = `UPDATE activos SET ${updates.join(", ")} WHERE id = ?`;
		await db.query(query, values);

		// 5. MANEJO DE GARANTÍAS
		let cambiosGarantia = "";
		// Verificar si se proporcionó información de garantía

		if (
			nombre_garantia ||
			proveedor_garantia_id ||
			fecha_inicio ||
			fecha_fin ||
			estado_garantia ||
			descripcion_garantia ||
			costo ||
			condiciones
		) {
			// Buscar garantía existente
			const [existingGarantia] = await db.query(
				"SELECT * FROM garantias WHERE activo_id = ?",
				[id],
			);

			// Obtener nombres de proveedores de garantía
			const [proveedorGarantiaAnterior] =
				existingGarantia.length > 0
					? await db.query(
							"SELECT nombre FROM proveedoresgarantia WHERE id = ?",
							[existingGarantia[0].proveedor_garantia_id],
						)
					: [null];

			if (existingGarantia.length > 0) {
				// Formatear fechas existentes
				const fechaInicioAnterior = formatearFechaParaHistorial(
					existingGarantia[0].fecha_inicio,
				);
				const fechaFinAnterior = formatearFechaParaHistorial(
					existingGarantia[0].fecha_fin,
				);

				// Formatear fechas nuevas
				const fechaInicioNueva = formatearFechaParaHistorial(fecha_inicio);
				const fechaFinNueva = formatearFechaParaHistorial(fecha_fin);

				// Actualizar garantía existente
				const garantiaUpdates = [];
				const garantiaValues = [];

				// Mapeo de campos de garantía
				const camposGarantia = {
					nombre_garantia,
					proveedor_garantia_id,
					fecha_inicio,
					fecha_fin,
					estado: estado_garantia,
					descripcion: descripcion_garantia,
					costo,
					condiciones,
				};

				// Obtener nombre del proveedor
				const [nuevoProveedorGarantia] = proveedor_garantia_id
					? await db.query(
							"SELECT nombre FROM proveedoresgarantia WHERE id = ?",
							[proveedor_garantia_id],
						)
					: [null];

				Object.entries(camposGarantia).forEach(([key, value]) => {
					if (value !== undefined && value !== existingGarantia[0][key]) {
						garantiaUpdates.push(`${key} = ?`);
						garantiaValues.push(value);
						// Solo un bloque de registro (usando el formateado)
						if (key === "proveedor_garantia_id") {
							cambiosGarantia += `Garantía: proveedor cambiado de "${proveedorGarantiaAnterior[0]?.nombre || "Sin proveedor"}" a "${nuevoProveedorGarantia[0]?.nombre || "Sin proveedor"}". `;
						} else if (key === "fecha_inicio") {
							cambiosGarantia += `Garantía: fecha_inicio actualizado de "${fechaInicioAnterior}" a "${fechaInicioNueva}". `;
						} else if (key === "fecha_fin") {
							cambiosGarantia += `Garantía: fecha_fin actualizado de "${fechaFinAnterior}" a "${fechaFinNueva}". `;
						} else {
							cambiosGarantia += `Garantía: ${key} actualizado de "${existingGarantia[0][key]}" a "${value}". `;
						}
					}
				});

				if (garantiaUpdates.length > 0) {
					await db.query(
						`UPDATE garantias SET ${garantiaUpdates.join(", ")} WHERE id = ?`,
						[...garantiaValues, existingGarantia[0].id],
					);
				}
			} else {
				// Crear nueva garantía con fechas formateadas en el mensaje
				const fechaInicioFormateada = formatearFechaParaHistorial(fecha_inicio);
				const fechaFinFormateada = formatearFechaParaHistorial(fecha_fin);
				const [nuevoProveedorGarantia] = proveedor_garantia_id
					? await db.query(
							"SELECT nombre FROM proveedoresgarantia WHERE id = ?",
							[proveedor_garantia_id],
						)
					: [null];

				// Crear nueva garantía
				await db.query(
					`INSERT INTO garantias (
    activo_id, nombre_garantia, proveedor_garantia_id, 
    fecha_inicio, fecha_fin, estado, descripcion, costo, condiciones
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[
						id,
						nombre_garantia || null,
						proveedor_garantia_id || null,
						fecha_inicio || null,
						fecha_fin || null,
						estado_garantia || null,
						descripcion_garantia || null,
						costo || null,
						condiciones || null,
					],
				);

				cambiosGarantia =
					`Nueva garantía creada: ` +
					`proveedor: ${nuevoProveedorGarantia[0]?.nombre || "Sin proveedor"}, ` +
					`inicio: ${fechaInicioFormateada}, ` +
					`fin: ${fechaFinFormateada}.`;
			}
		}

		// 6. Registrar en el historial
		if (!req.user || !req.user.id) {
			return res.status(401).json({ error: "Acceso no autorizado." });
		}

		const detallesCompletos =
			`${comentariosDinamicos} ${cambiosGarantia}`.trim();

		await db.query(
			"INSERT INTO historial (activo_id, accion, usuario_responsable, detalles) VALUES (?, ?, ?, ?)",
			[
				id,
				"Activo actualizado",
				req.user.id,
				detallesCompletos || "Sin cambios registrados",
			],
		);

		// 7. Obtener y devolver datos actualizados
		const [updatedActivo] = await db.query(
			"SELECT * FROM activos WHERE id = ?",
			[id],
		);
		const [updatedGarantia] = await db.query(
			"SELECT * FROM garantias WHERE activo_id = ?",
			[id],
		);

		res.status(200).json({
			message: "Activo actualizado exitosamente",
			cambios: detallesCompletos,
			activo: updatedActivo[0],
			garantia: updatedGarantia[0] || null,
		});
	} catch (error) {
		console.error("[ERROR UPDATE ACTIVO]:", error.message);

		if (error.code === "ER_DUP_ENTRY") {
			return res.status(400).json({ error: "Registro duplicado" });
		}
		if (error.message.includes("FOREIGN KEY")) {
			return res.status(400).json({
				error:
					"Uno de los valores proporcionados no existe en la base de datos",
			});
		}

		res.status(500).json({
			error: "Error al actualizar el activo",
			detalle:
				process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

exports.deleteActivo = async (req, res) => {
	const { id } = req.params; // Extraemos el ID del activo

	try {
		// Verificar dependencias en otras tablas
		const [asignaciones] = await db.query(
			"SELECT id FROM asignaciones WHERE activo_id = ?",
			[id],
		);
		if (asignaciones.length > 0) {
			return res.status(400).json({
				error:
					"No se puede eliminar el activo porque tiene asignaciones asociadas",
			});
		}

		const [garantias] = await db.query(
			"SELECT id FROM garantias WHERE activo_id = ?",
			[id],
		);
		if (garantias.length > 0) {
			return res.status(400).json({
				error:
					"No se puede eliminar el activo porque tiene garantías asociadas",
			});
		}

		// Verificar si el activo existe
		const [activoExistente] = await db.query(
			"SELECT * FROM activos WHERE id = ?",
			[id],
		);
		if (activoExistente.length === 0) {
			return res.status(404).json({ error: "Activo no encontrado" });
		}

		// Eliminar el activo
		await db.query("DELETE FROM activos WHERE id = ?", [id]);

		// Respondemos con un mensaje de éxito
		res.status(200).json({ message: "Activo eliminado exitosamente" });
	} catch (error) {
		console.error("[ERROR DELETE ACTIVO]:", error.message);
		res.status(500).json({ error: "Error al eliminar el activo" });
	}
};

exports.obtenerDatosAuxiliares = async (req, res) => {
	try {
		const estados = [
			{ id: "Disponible", nombre: "Disponible" },
			{ id: "Asignado", nombre: "Asignado" },
			{ id: "En mantenimiento", nombre: "En mantenimiento" },
			{ id: "Dado de baja", nombre: "Dado de baja" },
		];

		// Consulta para obtener los tipos de activos
		const [tipos] = await db.query("SELECT id, nombre FROM tipos");
		if (!tipos || tipos.length === 0) {
			return res.status(404).json({
				error: "No se encontraron tipos de activos",
				errorCode: "DATA_001",
			});
		}

		// Consulta para obtener los proveedores
		const [proveedores] = await db.query("SELECT id, nombre FROM proveedores");
		if (!proveedores || proveedores.length === 0) {
			return res.status(404).json({
				error: "No se encontraron proveedores",
				errorCode: "DATA_002",
			});
		}

		// Consulta para obtener las ubicaciones
		const [ubicaciones] = await db.query("SELECT id, nombre FROM ubicaciones");
		if (!ubicaciones || ubicaciones.length === 0) {
			return res.status(404).json({
				error: "No se encontraron ubicaciones",
				errorCode: "DATA_003",
			});
		}

		// Consulta para obtener los proveedores de garantía
		const [proveedoresGarantia] = await db.query(
			"SELECT id, nombre FROM proveedoresgarantia",
		);
		if (!proveedoresGarantia || proveedoresGarantia.length === 0) {
			return res.status(404).json({
				error: "No se encontraron proveedores de garantía",
				errorCode: "DATA_004",
			});
		}

		// Consulta para obtener los dueños (usuarios)
		const [duenos] = await db.query("SELECT id, nombre FROM usuarios");
		if (!duenos || duenos.length === 0) {
			return res
				.status(404)
				.json({ error: "No se encontraron usuarios", errorCode: "DATA_005" });
		}

		// Devuelve los datos en un objeto JSON
		res.status(200).json({
			tipos,
			proveedores,
			ubicaciones,
			proveedoresGarantia,
			duenos,
			estados,
		});
	} catch (error) {
		console.error("Error al obtener datos auxiliares:", error);
		res
			.status(500)
			.json({ error: "Error interno del servidor", errorCode: "SERVER_001" });
	}
};
exports.validarEtiquetaSerial = async (req, res) => {
	const { etiqueta_serial } = req.body;

	try {
		// Consulta la base de datos para verificar si la etiqueta serial existe
		const [rows] = await db.query(
			"SELECT id FROM activos WHERE etiqueta_serial = ?",
			[etiqueta_serial],
		);

		if (rows.length > 0) {
			// Si existe, devuelve un error
			return res
				.status(400)
				.json({ error: "La etiqueta serial ya está registrada" });
		}

		// Si no existe, devuelve una respuesta exitosa
		res.status(200).json({ message: "La etiqueta serial está disponible" });
	} catch (error) {
		console.error("[ERROR VALIDAR ETIQUETA SERIAL]:", error.message);
		res.status(500).json({ error: "Error al validar la etiqueta serial" });
	}
};

exports.darDeBajaActivo = async (req, res) => {
	const { id } = req.params;

	try {
		// 2. Verificar si el activo existe
		const [activo] = await db.query(
			"SELECT id, estado, nombre FROM activos WHERE id = ?",
			[id],
		);
		if (activo.length === 0) {
			return res.status(404).json({
				success: false,
				message: "Activo no encontrado.",
			});
		}

		const activoData = activo[0];

		// 3. Validar si ya está dado de baja
		if (activoData.estado === "Dado de baja") {
			return res.status(400).json({
				success: false,
				message: `El activo "${activoData.nombre}" ya está dado de baja.`,
			});
		}

		// 4. Verificar si tiene asignaciones activas
		const [asignacion] = await db.query(
			"SELECT id FROM asignaciones WHERE activo_id = ?",
			[id],
		);

		if (asignacion.length > 0) {
			return res.status(400).json({
				success: false,
				message: `No se puede dar de baja: El activo "${activoData.nombre}" está asignado a ${asignacion.length} usuario(s).`,
			});
		}

		// 5. Actualizar estado y fecha_salida
		await db.query(
			'UPDATE activos SET estado = "Dado de baja", fecha_salida = CURRENT_DATE WHERE id = ?',
			[id],
		);

		// 6. Registrar en el historial con más detalles
		const detallesHistorial = `Baja permanente del activo "${activoData.nombre}"`;
		await db.query(
			"INSERT INTO historial (activo_id, accion, usuario_responsable, detalles) VALUES (?, ?, ?, ?)",
			[id, "Baja del activo", req.user.id, detallesHistorial],
		);

		// 7. Respuesta exitosa
		res.json({
			success: true,
			message: `Activo "${activoData.nombre}" dado de baja exitosamente.`,
		});
	} catch (error) {
		console.error("Error en darDeBajaActivo:", error);
		res.status(500).json({
			success: false,
			message: "Error interno al procesar la baja.",
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
