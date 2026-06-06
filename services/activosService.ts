import {
	and,
	asc,
	count,
	desc,
	eq,
	getTableColumns,
	isNotNull,
	not,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import db from "../config/db.js";
import {
	activos,
	asignaciones,
	garantias,
	historial,
	proveedores,
	proveedoresgarantia,
	tipos,
	ubicaciones,
	usuarios,
} from "../db/schema.js";
import * as r2Service from "../services/r2Service.js";

// Helper — formatea fechas a YYYY-MM-DD para el historial
function formatearFechaParaHistorial(valor: unknown) {
	if (typeof valor === "string" && valor.match(/^\d{4}-\d{2}-\d{2}$/)) {
		return valor;
	}

	const fecha = new Date(valor as string | number);

	if (!Number.isNaN(fecha.getTime())) {
		return fecha.toISOString().split("T")[0];
	}

	return valor;
}

// Consultas de activos

export async function getActivos(queryParams_: {
	page?: number;
	limit?: number;
	orden?: string;
	search?: string;
	tipo?: string;
	estado?: string;
	ubicacion?: string;
	usuario_asignado?: string;
	licencia_proxima?: string;
	garantia_proxima?: string;
	fecha_devolucion_proxima?: string;
	fecha_inicio?: string;
	fecha_fin?: string;
}) {
	// Paginación y ordenamiento con valores seguros
	const page = queryParams_.page || 1;
	const limit = Math.min(queryParams_.limit || 10, 100);
	const offset = (page - 1) * limit;
	const orden = queryParams_.orden || "asc";
	const direccionOrden = orden.toLowerCase() === "desc" ? "DESC" : "ASC";
	const allowedOrders = ["ASC", "DESC"];
	const safeOrder = allowedOrders.includes(direccionOrden)
		? direccionOrden
		: "ASC";

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
	} = queryParams_;

	const conditions: SQL[] = [eq(activos.activo, 1)];

	// Filtro de búsqueda por texto (fulltext + LIKE)
	if (search) {
		const searchFulltext = `${search}*`;
		const searchLike = `%${search}%`;
		const searchCond = or(
			sql`MATCH(${activos.nombre}, ${activos.descripcion}) AGAINST(${searchFulltext} IN BOOLEAN MODE)`,
			sql`${activos.id} LIKE ${searchLike}`,
		);
		if (searchCond) conditions.push(searchCond);
	}

	// Filtros por tipo, estado y ubicación
	if (tipo) {
		conditions.push(eq(activos.tipo_id, Number(tipo)));
	}
	if (estado) {
		conditions.push(sql`${activos.estado} = ${estado}`);
	}
	if (ubicacion) {
		conditions.push(eq(activos.ubicacion_id, Number(ubicacion)));
	}
	if (usuario_asignado) {
		conditions.push(eq(asignaciones.usuario_id, Number(usuario_asignado)));
	}

	if (licencia_proxima === "true") {
		const licCond = and(
			isNotNull(activos.tipo_licencia),
			sql`${activos.fecha_vencimiento_licencia} BETWEEN ${fecha_inicio || new Date()} AND ${fecha_fin || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}`,
		);
		if (licCond) conditions.push(licCond);
	}

	// Filtro de garantías próximas a vencer (requiere JOIN extra)
	let needsGarantiasJoin = false;
	if (garantia_proxima === "true") {
		needsGarantiasJoin = true;
		conditions.push(
			sql`${garantias.fecha_fin} BETWEEN ${new Date()} AND ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}`,
		);
	}

	// Filtro de devoluciones próximas
	if (fecha_devolucion_proxima === "true") {
		conditions.push(
			sql`${asignaciones.fecha_devolucion} BETWEEN ${fecha_inicio || new Date()} AND ${fecha_fin || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}`,
		);
	}

	// Construye la consulta con joins dinámicos
	let query = db
		.select({
			...getTableColumns(activos),
			tipo: tipos.nombre,
			proveedor: proveedores.nombre,
			ubicacion: ubicaciones.nombre,
			usuario_asignado: usuarios.nombre,
		})
		.from(activos)
		.leftJoin(tipos, eq(activos.tipo_id, tipos.id))
		.leftJoin(proveedores, eq(activos.proveedor_id, proveedores.id))
		.leftJoin(ubicaciones, eq(activos.ubicacion_id, ubicaciones.id))
		.leftJoin(asignaciones, eq(activos.id, asignaciones.activo_id))
		.leftJoin(usuarios, eq(asignaciones.usuario_id, usuarios.id));

	let countQuery = db
		.select({ total: count() })
		.from(activos)
		.leftJoin(tipos, eq(activos.tipo_id, tipos.id))
		.leftJoin(proveedores, eq(activos.proveedor_id, proveedores.id))
		.leftJoin(ubicaciones, eq(activos.ubicacion_id, ubicaciones.id))
		.leftJoin(asignaciones, eq(activos.id, asignaciones.activo_id))
		.leftJoin(usuarios, eq(asignaciones.usuario_id, usuarios.id));

	if (needsGarantiasJoin) {
		query = query.leftJoin(garantias, eq(activos.id, garantias.activo_id));
		countQuery = countQuery.leftJoin(
			garantias,
			eq(activos.id, garantias.activo_id),
		);
	}

	// Consulta principal con paginación
	const rows = await query
		.where(and(...conditions))
		.limit(limit)
		.offset(offset)
		.orderBy(safeOrder === "DESC" ? desc(activos.id) : asc(activos.id));

	// Consulta de total para la paginación
	const [countResult] = await countQuery.where(and(...conditions));

	const total = countResult.total;

	return {
		data: rows,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

// Obtiene un activo por su ID con relaciones (tipo, proveedor, ubicación, dueño)
export async function getActivoById(id: string) {
	// Validación básica del ID
	if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
		throw new Error("ID inválido");
	}

	const rows = await db
		.select({
			...getTableColumns(activos),
			tipo_nombre: tipos.nombre,
			proveedor_nombre: proveedores.nombre,
			ubicacion_nombre: ubicaciones.nombre,
			dueno_nombre: usuarios.nombre,
		})
		.from(activos)
		.leftJoin(tipos, eq(activos.tipo_id, tipos.id))
		.leftJoin(proveedores, eq(activos.proveedor_id, proveedores.id))
		.leftJoin(ubicaciones, eq(activos.ubicacion_id, ubicaciones.id))
		.leftJoin(usuarios, eq(activos.dueno_id, usuarios.id))
		.where(and(eq(activos.id, Number(id)), eq(activos.activo, 1)));

	if (rows.length === 0) {
		throw new Error("Activo no encontrado");
	}

	// Obtiene las garantías asociadas al activo
	const garantiasRows = await db
		.select({
			...getTableColumns(garantias),
			proveedor_garantia_nombre: proveedoresgarantia.nombre,
		})
		.from(garantias)
		.leftJoin(
			proveedoresgarantia,
			eq(garantias.proveedor_garantia_id, proveedoresgarantia.id),
		)
		.where(eq(garantias.activo_id, Number(id)));

	const tieneGarantia = garantiasRows.length > 0;

	const activo = rows[0];
	return {
		id: activo.id,
		nombre: activo.nombre,
		tipo: {
			id: activo.tipo_id,
			nombre: activo.tipo_nombre,
		},
		fecha_adquisicion: activo.fecha_adquisicion,
		fecha_registro: activo.fecha_registro,
		fecha_salida: activo.fecha_salida,
		valor_compra: activo.valor_compra,
		costo_mensual: activo.costo_mensual,
		etiqueta_serial: activo.etiqueta_serial,
		descripcion: activo.descripcion,
		estado: activo.estado,
		ubicacion: {
			id: activo.ubicacion_id,
			nombre: activo.ubicacion_nombre,
		},
		proveedor: {
			id: activo.proveedor_id,
			nombre: activo.proveedor_nombre,
		},
		foto_url: activo.foto_url,
		modelo: activo.modelo,
		version_software: activo.version_software,
		tipo_licencia: activo.tipo_licencia,
		fecha_vencimiento_licencia: activo.fecha_vencimiento_licencia,
		recursos_asignados: activo.recursos_asignados,
		dueno: {
			id: activo.dueno_id,
			nombre: activo.dueno_nombre,
		},
		condicion_fisica: activo.condicion_fisica || null,
		garantia: tieneGarantia
			? garantiasRows.map((garantia: Record<string, unknown>) => ({
					id: garantia.id,
					nombre_garantia: garantia.nombre_garantia,
					proveedor: {
						id: garantia.proveedor_garantia_id,
						nombre: garantia.proveedor_garantia_nombre,
					},
					fecha_inicio: garantia.fecha_inicio,
					fecha_fin: garantia.fecha_fin,
					costo: garantia.costo,
					condiciones: garantia.condiciones,
					estado: garantia.estado,
					descripcion: garantia.descripcion,
				}))
			: null,
	};
}

// Creación de activos

export async function createActivo(
	input: {
		nombre: string;
		tipo_id: number;
		fecha_adquisicion: string;
		valor_compra: number;
		estado: string;
		proveedor_id: number;
		ubicacion_id: number;
		modelo?: string;
		version_software?: string;
		tipo_licencia?: string;
		fecha_vencimiento_licencia?: string;
		costo_mensual?: number;
		recursos_asignados?: string;
		dueno_id?: number;
		etiqueta_serial?: string;
		condicion_fisica?: string;
		descripcion?: string;
		nombre_garantia?: string;
		proveedor_garantia_id?: number;
		fecha_inicio?: string;
		fecha_fin?: string;
		costo?: number;
		condiciones?: string;
		estado_garantia?: string;
		descripcion_garantia?: string;
	},
	file?: Express.Multer.File,
	usuarioResponsableId?: number,
) {
	const {
		nombre,
		tipo_id,
		fecha_adquisicion,
		valor_compra,
		estado,
		proveedor_id,
		ubicacion_id,
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
		nombre_garantia,
		proveedor_garantia_id,
		fecha_inicio,
		fecha_fin,
		costo,
		condiciones,
		estado_garantia,
		descripcion_garantia,
	} = input;

	// Sube la foto a R2 si se incluyó un archivo
	let foto_url: string | null = null;

	if (file) {
		const key = r2Service.generarClave(nombre, file.mimetype);
		const result = await r2Service.subirAR2(file.buffer, key, file.mimetype);
		foto_url = result.url;
	}

	// Valida que la etiqueta serial no esté duplicada
	if (etiqueta_serial) {
		const existingSerial = await db
			.select({ id: activos.id })
			.from(activos)
			.where(eq(activos.etiqueta_serial, etiqueta_serial));

		if (existingSerial.length > 0) {
			throw new Error("La etiqueta serial ya está registrada");
		}
	}

	// Validación de datos de garantía si se proporcionaron
	if (
		nombre_garantia ||
		proveedor_garantia_id ||
		fecha_inicio ||
		fecha_fin ||
		costo ||
		condiciones ||
		estado_garantia ||
		descripcion_garantia
	) {
		// Campos obligatorios para registrar una garantía
		if (
			!nombre_garantia ||
			!proveedor_garantia_id ||
			!fecha_inicio ||
			!fecha_fin
		) {
			throw new Error("Datos incompletos para la garantía");
		}

		if (
			Number.isNaN(Date.parse(fecha_inicio)) ||
			Number.isNaN(Date.parse(fecha_fin))
		) {
			throw new Error("Fechas de garantía no válidas");
		}

		if (costo && (Number.isNaN(costo) || (costo as number) < 0)) {
			throw new Error(
				"El costo de la garantía debe ser un número positivo o cero",
			);
		}

		if (condiciones && condiciones.length > 500) {
			throw new Error("Las condiciones no pueden exceder los 500 caracteres");
		}
	}

	// Construye el objeto INSERT con solo los campos presentes
	const values: Record<string, unknown> = {};

	const addField = (field: string, value: unknown) => {
		if (value !== undefined && value !== null) {
			values[field] = value;
		}
	};

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

	// Transacción: crea el activo, su garantía y el registro en historial
	try {
		const result = await db.transaction(async (tx) => {
			const [insertResult] = await tx
				.insert(activos)
				.values(values as typeof activos.$inferInsert);

			const activoId = insertResult.insertId;

			// Inserta la garantía si se proporcionaron los datos mínimos
			if (
				nombre_garantia &&
				proveedor_garantia_id &&
				fecha_inicio &&
				fecha_fin
			) {
				await tx.insert(garantias).values({
					activo_id: activoId,
					proveedor_garantia_id,
					nombre_garantia,
					fecha_inicio,
					fecha_fin,
					costo: costo || null,
					condiciones: condiciones || null,
					estado: estado_garantia || "Vigente",
					descripcion: descripcion_garantia || null,
				} as unknown as typeof garantias.$inferInsert);
			}

			const comentariosDinamicos = `Activo "${nombre}" creado con estado "${estado}".`;

			await tx.insert(historial).values({
				activo_id: activoId,
				accion: "Activo creado",
				usuario_responsable: usuarioResponsableId || null,
				detalles: comentariosDinamicos,
			} as typeof historial.$inferInsert);

			return { id: activoId };
		});

		return result;
	} catch (error) {
		// Rollback y limpieza de la foto subida si algo falla
		if (foto_url) {
			const key = foto_url.split("/").pop();
			await r2Service.eliminarDeR2(key as string).catch(() => {});
		}
		throw error;
	}
}

// Actualización de activos

export async function updateActivo(
	id: string,
	input: {
		nombre?: string;
		tipo_id?: number;
		fecha_adquisicion?: string;
		fecha_registro?: string;
		fecha_salida?: string;
		valor_compra?: number;
		etiqueta_serial?: string;
		descripcion?: string;
		estado?: string;
		proveedor_id?: number;
		ubicacion_id?: number;
		foto_url?: string;
		modelo?: string;
		version_software?: string;
		tipo_licencia?: string;
		fecha_vencimiento_licencia?: string;
		costo_mensual?: number;
		recursos_asignados?: string;
		dueno_id?: number;
		nombre_garantia?: string;
		proveedor_garantia_id?: number;
		fecha_inicio?: string;
		fecha_fin?: string;
		estado_garantia?: string;
		descripcion_garantia?: string;
		costo?: number;
		condiciones?: string;
	},
	file?: Express.Multer.File,
	usuarioResponsableId?: number,
) {
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
		foto_url: foto_url_body,
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
	} = input;

	let foto_url: string | undefined | null = foto_url_body;

	// Si se subió un archivo nuevo, lo reemplaza en R2
	if (file) {
		const key = r2Service.generarClave(nombre || "activo", file.mimetype);
		const result = await r2Service.subirAR2(file.buffer, key, file.mimetype);
		foto_url = result.url;
	}

	// Obtiene el activo actual para comparar cambios
	const activoExistente = await db
		.select({
			...getTableColumns(activos),
			tipo_nombre: tipos.nombre,
			proveedor_nombre: proveedores.nombre,
			ubicacion_nombre: ubicaciones.nombre,
			dueno_nombre: usuarios.nombre,
		})
		.from(activos)
		.leftJoin(tipos, eq(activos.tipo_id, tipos.id))
		.leftJoin(proveedores, eq(activos.proveedor_id, proveedores.id))
		.leftJoin(ubicaciones, eq(activos.ubicacion_id, ubicaciones.id))
		.leftJoin(usuarios, eq(activos.dueno_id, usuarios.id))
		.where(eq(activos.id, Number(id)));

	if (activoExistente.length === 0) {
		throw new Error("El activo no existe.");
	}

	// Verifica duplicados de etiqueta serial (excluye el ID actual)
	if (etiqueta_serial) {
		const existingSerial = await db
			.select({ id: activos.id })
			.from(activos)
			.where(
				and(
					eq(activos.etiqueta_serial, etiqueta_serial),
					not(eq(activos.id, Number(id))),
				),
			);

		if (existingSerial.length > 0) {
			throw new Error("La etiqueta serial ya está registrada");
		}
	}

	// Valida que las relaciones (tipo, proveedor, ubicación) existan
	if (tipo_id) {
		const tipoRows = await db
			.select({ id: tipos.id })
			.from(tipos)
			.where(eq(tipos.id, tipo_id));
		if (tipoRows.length === 0) {
			throw new Error("El tipo de activo no existe");
		}
	}

	if (proveedor_id) {
		const proveedorRows = await db
			.select({ id: proveedores.id })
			.from(proveedores)
			.where(eq(proveedores.id, proveedor_id));
		if (proveedorRows.length === 0) {
			throw new Error("El proveedor no existe");
		}
	}

	if (ubicacion_id) {
		const ubicacionRows = await db
			.select({ id: ubicaciones.id })
			.from(ubicaciones)
			.where(eq(ubicaciones.id, ubicacion_id));
		if (ubicacionRows.length === 0) {
			throw new Error("La ubicación no existe");
		}
	}

	// Generación de historial de cambios

	let comentariosDinamicos = "";
	const cambios: Record<string, { anterior: unknown; nuevo: unknown }> = {};

	const registrarCambio = (
		campo: string,
		valorAnterior: unknown,
		valorNuevo: unknown,
		esRelacion = false,
	) => {
		if (valorNuevo !== undefined && valorNuevo !== valorAnterior) {
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

	if (tipo_id && tipo_id !== activoExistente[0].tipo_id) {
		const nuevoTipo = await db
			.select({ nombre: tipos.nombre })
			.from(tipos)
			.where(eq(tipos.id, tipo_id));
		if (nuevoTipo.length > 0) {
			comentariosDinamicos += registrarCambio(
				"Tipo",
				activoExistente[0].tipo_nombre || "Sin tipo",
				nuevoTipo[0].nombre,
				true,
			);
		}
	}

	if (proveedor_id && proveedor_id !== activoExistente[0].proveedor_id) {
		const nuevoProveedor = await db
			.select({ nombre: proveedores.nombre })
			.from(proveedores)
			.where(eq(proveedores.id, proveedor_id));
		if (nuevoProveedor.length > 0) {
			comentariosDinamicos += registrarCambio(
				"Proveedor",
				activoExistente[0].proveedor_nombre || "Sin proveedor",
				nuevoProveedor[0].nombre,
				true,
			);
		}
	}

	if (ubicacion_id && ubicacion_id !== activoExistente[0].ubicacion_id) {
		const nuevaUbicacion = await db
			.select({ nombre: ubicaciones.nombre })
			.from(ubicaciones)
			.where(eq(ubicaciones.id, ubicacion_id));
		if (nuevaUbicacion.length > 0) {
			comentariosDinamicos += registrarCambio(
				"Ubicación",
				activoExistente[0].ubicacion_nombre || "Sin ubicación",
				nuevaUbicacion[0].nombre,
				true,
			);
		}
	}

	if (dueno_id && dueno_id !== activoExistente[0].dueno_id) {
		const nuevoDueno = await db
			.select({ nombre: usuarios.nombre })
			.from(usuarios)
			.where(eq(usuarios.id, dueno_id));
		if (nuevoDueno.length > 0) {
			comentariosDinamicos += registrarCambio(
				"Dueño/Responsable",
				activoExistente[0].dueno_nombre || "Sin dueño",
				nuevoDueno[0].nombre,
				true,
			);
		}
	}

	if (!comentariosDinamicos) {
		comentariosDinamicos = "Sin cambios adicionales.";
	}

	// Construye el objeto UPDATE con solo los campos enviados
	const updates: Record<string, unknown> = {};

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

	Object.entries(camposActualizables).forEach(([key, value]) => {
		if (value !== undefined) {
			updates[key] = value;
		}
	});

	if (Object.keys(updates).length === 0) {
		throw new Error("No se proporcionaron datos para actualizar");
	}

	// Transacción: actualiza el activo, gestiona garantías y registra historial
	try {
		const result = await db.transaction(async (tx) => {
			await tx
				.update(activos)
				.set(updates as Partial<typeof activos.$inferInsert>)
				.where(eq(activos.id, Number(id)));

			let cambiosGarantia = "";

			// Maneja la actualización o creación de garantía
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
				const existingGarantias = await tx
					.select()
					.from(garantias)
					.where(eq(garantias.activo_id, Number(id)));

				let proveedorGarantiaAnteriorNombre: string | null = null;
				if (existingGarantias.length > 0) {
					const pgRows = await tx
						.select({ nombre: proveedoresgarantia.nombre })
						.from(proveedoresgarantia)
						.where(
							eq(
								proveedoresgarantia.id,
								existingGarantias[0].proveedor_garantia_id,
							),
						);
					proveedorGarantiaAnteriorNombre =
						pgRows.length > 0 ? pgRows[0].nombre : null;
				}

				if (existingGarantias.length > 0) {
					const existingGarantia = existingGarantias[0];
					const fechaInicioAnterior = formatearFechaParaHistorial(
						existingGarantia.fecha_inicio,
					);
					const fechaFinAnterior = formatearFechaParaHistorial(
						existingGarantia.fecha_fin,
					);

					const fechaInicioNueva = formatearFechaParaHistorial(fecha_inicio);
					const fechaFinNueva = formatearFechaParaHistorial(fecha_fin);

					const garantiaUpdates: Record<string, unknown> = {};

					const camposGarantia: Record<string, unknown> = {
						nombre_garantia,
						proveedor_garantia_id,
						fecha_inicio,
						fecha_fin,
						estado: estado_garantia,
						descripcion: descripcion_garantia,
						costo,
						condiciones,
					};

					let nuevoProveedorGarantiaNombre: string | null = null;
					if (proveedor_garantia_id) {
						const pgRows = await tx
							.select({ nombre: proveedoresgarantia.nombre })
							.from(proveedoresgarantia)
							.where(eq(proveedoresgarantia.id, proveedor_garantia_id));
						nuevoProveedorGarantiaNombre =
							pgRows.length > 0 ? pgRows[0].nombre : null;
					}

					Object.entries(camposGarantia).forEach(([key, value]) => {
						if (
							value !== undefined &&
							value !== (existingGarantia as Record<string, unknown>)[key]
						) {
							garantiaUpdates[key] = value;
							if (key === "proveedor_garantia_id") {
								cambiosGarantia += `Garantía: proveedor cambiado de "${proveedorGarantiaAnteriorNombre || "Sin proveedor"}" a "${nuevoProveedorGarantiaNombre || "Sin proveedor"}". `;
							} else if (key === "fecha_inicio") {
								cambiosGarantia += `Garantía: fecha_inicio actualizado de "${fechaInicioAnterior}" a "${fechaInicioNueva}". `;
							} else if (key === "fecha_fin") {
								cambiosGarantia += `Garantía: fecha_fin actualizado de "${fechaFinAnterior}" a "${fechaFinNueva}". `;
							} else {
								cambiosGarantia += `Garantía: ${key} actualizado de "${(existingGarantia as Record<string, unknown>)[key]}" a "${value}". `;
							}
						}
					});

					if (Object.keys(garantiaUpdates).length > 0) {
						await tx
							.update(garantias)
							.set(garantiaUpdates as Partial<typeof garantias.$inferInsert>)
							.where(eq(garantias.id, existingGarantia.id));
					}
				} else {
					const fechaInicioFormateada =
						formatearFechaParaHistorial(fecha_inicio);
					const fechaFinFormateada = formatearFechaParaHistorial(fecha_fin);

					let nuevoProveedorGarantiaNombre: string | null = null;
					if (proveedor_garantia_id) {
						const pgRows = await tx
							.select({ nombre: proveedoresgarantia.nombre })
							.from(proveedoresgarantia)
							.where(eq(proveedoresgarantia.id, proveedor_garantia_id));
						nuevoProveedorGarantiaNombre =
							pgRows.length > 0 ? pgRows[0].nombre : null;
					}

					await tx.insert(garantias).values({
						activo_id: Number(id),
						nombre_garantia: nombre_garantia || null,
						proveedor_garantia_id: proveedor_garantia_id || null,
						fecha_inicio: fecha_inicio || null,
						fecha_fin: fecha_fin || null,
						estado: estado_garantia || null,
						descripcion: descripcion_garantia || null,
						costo: costo || null,
						condiciones: condiciones || null,
					} as unknown as typeof garantias.$inferInsert);

					cambiosGarantia =
						`Nueva garantía creada: ` +
						`proveedor: ${nuevoProveedorGarantiaNombre || "Sin proveedor"}, ` +
						`inicio: ${fechaInicioFormateada}, ` +
						`fin: ${fechaFinFormateada}.`;
				}
			}

			// Verifica que haya un responsable antes de registrar en el historial
			if (!usuarioResponsableId) {
				throw new Error("Acceso no autorizado.");
			}

			const detallesCompletos =
				`${comentariosDinamicos} ${cambiosGarantia}`.trim();

			await tx.insert(historial).values({
				activo_id: Number(id),
				accion: "Activo actualizado",
				usuario_responsable: usuarioResponsableId,
				detalles: detallesCompletos || "Sin cambios registrados",
			} as typeof historial.$inferInsert);

			const updatedActivoRows = await tx
				.select()
				.from(activos)
				.where(eq(activos.id, Number(id)));
			const updatedGarantiaRows = await tx
				.select()
				.from(garantias)
				.where(eq(garantias.activo_id, Number(id)));

			return {
				cambios: detallesCompletos,
				activo: updatedActivoRows[0],
				garantia: updatedGarantiaRows[0] || null,
			};
		});

		return result;
	} catch (error) {
		// Rollback y limpieza de foto subida en caso de error
		if (file && foto_url) {
			const key = foto_url.split("/").pop();
			await r2Service.eliminarDeR2(key as string).catch(() => {});
		}
		throw error;
	}
}

// Eliminación de activos

export async function deleteActivo(id: string) {
	// Verifica que el activo exista
	const activoRows = await db
		.select({
			id: activos.id,
			foto_url: activos.foto_url,
		})
		.from(activos)
		.where(eq(activos.id, Number(id)));

	if (activoRows.length === 0) {
		throw new Error("Activo no encontrado");
	}

	const { foto_url } = activoRows[0] as {
		foto_url?: string;
	};

	const asignacionesRows = await db
		.select({ id: asignaciones.id })
		.from(asignaciones)
		.where(
			and(eq(asignaciones.activo_id, Number(id)), eq(asignaciones.activo, 1)),
		);

	if (asignacionesRows.length > 0) {
		throw new Error(
			`No se puede eliminar: el activo está asignado a ${asignacionesRows.length} usuario(s)`,
		);
	}
	await db.transaction(async (tx) => {
		await tx.delete(garantias).where(eq(garantias.activo_id, Number(id)));
		await tx.delete(activos).where(eq(activos.id, Number(id)));
	});

	if (foto_url) {
		const key = foto_url.split("/").pop();
		await r2Service.eliminarDeR2(key as string).catch(() => {});
	}
}

// Da de baja un activo (borrado lógico) si no tiene asignaciones activas
export async function darDeBajaActivo(
	id: string,
	usuarioResponsableId?: number,
) {
	const activoRows = await db
		.select({ id: activos.id, estado: activos.estado, nombre: activos.nombre })
		.from(activos)
		.where(eq(activos.id, Number(id)));

	if (activoRows.length === 0) {
		throw new Error("Activo no encontrado");
	}

	const activoData = activoRows[0] as { estado: string; nombre: string };

	if (activoData.estado === "Dado de baja") {
		throw new Error(`El activo "${activoData.nombre}" ya está dado de baja`);
	}

	const asignacionRows = await db
		.select({ id: asignaciones.id })
		.from(asignaciones)
		.where(eq(asignaciones.activo_id, Number(id)));

	if (asignacionRows.length > 0) {
		throw new Error(
			`No se puede dar de baja: El activo "${activoData.nombre}" está asignado a ${asignacionRows.length} usuario(s)`,
		);
	}
	await db.transaction(async (tx) => {
		await tx
			.update(activos)
			.set({
				activo: 0,
				estado: "Dado de baja",
				fecha_salida: sql`CURRENT_DATE`,
			})
			.where(eq(activos.id, Number(id)));

		const detallesHistorial = `Baja permanente del activo "${activoData.nombre}"`;
		await tx.insert(historial).values({
			activo_id: Number(id),
			accion: "Baja del activo",
			usuario_responsable: usuarioResponsableId,
			detalles: detallesHistorial,
		} as typeof historial.$inferInsert);
	});
}

// Datos auxiliares y utilerías

export async function obtenerDatosAuxiliares() {
	// Lista fija de estados disponibles
	const estados = [
		{ id: "Disponible", nombre: "Disponible" },
		{ id: "Asignado", nombre: "Asignado" },
		{ id: "En mantenimiento", nombre: "En mantenimiento" },
		{ id: "Dado de baja", nombre: "Dado de baja" },
	];

	const tiposRows = await db
		.select({ id: tipos.id, nombre: tipos.nombre })
		.from(tipos);
	const proveedoresRows = await db
		.select({ id: proveedores.id, nombre: proveedores.nombre })
		.from(proveedores);
	const ubicacionesRows = await db
		.select({ id: ubicaciones.id, nombre: ubicaciones.nombre })
		.from(ubicaciones);
	const proveedoresGarantiaRows = await db
		.select({ id: proveedoresgarantia.id, nombre: proveedoresgarantia.nombre })
		.from(proveedoresgarantia);
	const duenosRows = await db
		.select({ id: usuarios.id, nombre: usuarios.nombre })
		.from(usuarios);

	return {
		tipos: tiposRows,
		proveedores: proveedoresRows,
		ubicaciones: ubicacionesRows,
		proveedoresGarantia: proveedoresGarantiaRows,
		duenos: duenosRows,
		estados,
	};
}

// Valida que una etiqueta serial no exista ya en la base de datos
export async function validarEtiquetaSerial(etiqueta_serial: string) {
	const rows = await db
		.select({ id: activos.id })
		.from(activos)
		.where(eq(activos.etiqueta_serial, etiqueta_serial));

	if (rows.length > 0) {
		return false;
	}

	return true;
}

// Sube una imagen a R2 y devuelve su URL pública
export async function subirImagen(
	fileBuffer: Buffer,
	mimetype: string,
	nombre?: string,
) {
	const key = r2Service.generarClave(nombre || "activo", mimetype);
	const result = await r2Service.subirAR2(fileBuffer, key, mimetype);

	return { url: result.url };
}
