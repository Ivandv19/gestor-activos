import { and, asc, count, desc, eq, like, or, sql } from "drizzle-orm";
import db from "../config/db.js";
import {
	activos,
	asignaciones,
	historial,
	proveedores,
	tipos,
	ubicaciones,
	usuarios,
} from "../db/schema.js";

// Consultas de asignaciones

export async function getAsignaciones(
	queryParams_: {
		page?: number;
		limit?: number;
		orden?: string;
		search?: string;
		tipo?: string;
		ubicacion?: string;
		usuario_asignado?: string;
	},
	usuarioId?: number,
) {
	// Paginación y orden seguro
	const page = queryParams_.page || 1;
	const limit = Math.min(queryParams_.limit || 10, 100);
	const offset = (page - 1) * limit;

	const orden = queryParams_.orden || "asc";
	const safeOrder = orden.toLowerCase() === "desc" ? "DESC" : "ASC";

	const { search = "", tipo, ubicacion, usuario_asignado } = queryParams_;

	// Construcción dinámica de filtros
	const filters = [
		...(search
			? [
					or(
						sql`CAST(${activos.id} AS CHAR) LIKE ${`%${search}%`}`,
						sql`MATCH(${activos.nombre}) AGAINST(${`${search}*`} IN BOOLEAN MODE)`,
					),
				]
			: []),
		...(tipo ? [eq(tipos.id, Number(tipo))] : []),
		...(ubicacion ? [eq(ubicaciones.id, Number(ubicacion))] : []),
		...(usuario_asignado ? [eq(usuarios.id, Number(usuario_asignado))] : []),
		eq(asignaciones.activo, 1),
		...(usuarioId ? [eq(asignaciones.usuario_id, usuarioId)] : []),
	];

	const results = await db
		.select({
			id: asignaciones.id,
			activo: activos.nombre,
			tipo_activo: tipos.nombre,
			estado_activo: activos.estado,
			usuario: usuarios.nombre,
			ubicacion: ubicaciones.nombre,
			fecha_asignacion: asignaciones.fecha_asignacion,
			fecha_devolucion: asignaciones.fecha_devolucion,
			comentarios: asignaciones.comentarios,
			foto_url: activos.foto_url,
		})
		.from(asignaciones)
		.innerJoin(activos, eq(asignaciones.activo_id, activos.id))
		.innerJoin(tipos, eq(activos.tipo_id, tipos.id))
		.innerJoin(usuarios, eq(asignaciones.usuario_id, usuarios.id))
		.innerJoin(ubicaciones, eq(asignaciones.ubicacion_id, ubicaciones.id))
		.where(and(...filters, eq(activos.activo, 1)))
		.orderBy(
			safeOrder === "DESC" ? desc(asignaciones.id) : asc(asignaciones.id),
		)
		.limit(limit)
		.offset(offset);

	const [totalResult] = await db
		.select({ total: count() })
		.from(asignaciones)
		.innerJoin(activos, eq(asignaciones.activo_id, activos.id))
		.innerJoin(tipos, eq(activos.tipo_id, tipos.id))
		.innerJoin(usuarios, eq(asignaciones.usuario_id, usuarios.id))
		.innerJoin(ubicaciones, eq(asignaciones.ubicacion_id, ubicaciones.id))
		.where(and(...filters));

	const totalAsignaciones = Number(totalResult.total);

	return {
		data: results,
		pagination: {
			page,
			limit,
			total: totalAsignaciones,
			totalPages: Math.ceil(totalAsignaciones / limit),
		},
	};
}

// Obtiene una asignación por su ID con datos relacionados
export async function getAsignacionPorId(id: string) {
	const [asignacion] = await db
		.select({
			id: asignaciones.id,
			activo_id: asignaciones.activo_id,
			activo_nombre: activos.nombre,
			activo_foto: activos.foto_url,
			usuario_id: asignaciones.usuario_id,
			usuario_nombre: usuarios.nombre,
			ubicacion_id: asignaciones.ubicacion_id,
			ubicacion_nombre: ubicaciones.nombre,
			fecha_asignacion: asignaciones.fecha_asignacion,
			fecha_devolucion: asignaciones.fecha_devolucion,
			comentarios: asignaciones.comentarios,
		})
		.from(asignaciones)
		.leftJoin(activos, eq(asignaciones.activo_id, activos.id))
		.leftJoin(usuarios, eq(asignaciones.usuario_id, usuarios.id))
		.leftJoin(ubicaciones, eq(asignaciones.ubicacion_id, ubicaciones.id))
		.where(eq(asignaciones.id, Number(id)));

	if (!asignacion) {
		throw new Error("La asignación no existe.");
	}

	return {
		id: asignacion.id,
		activo_id: asignacion.activo_id,
		nombre: asignacion.activo_nombre,
		foto_url: asignacion.activo_foto,
		usuario_id: asignacion.usuario_id,
		usuario_nombre: asignacion.usuario_nombre,
		ubicacion_id: asignacion.ubicacion_id,
		ubicacion_nombre: asignacion.ubicacion_nombre,
		fecha_asignacion: asignacion.fecha_asignacion,
		fecha_devolucion: asignacion.fecha_devolucion,
		comentarios: asignacion.comentarios,
	};
}

// Creación de asignaciones

export async function createAsignacion(
	input: {
		activo_id: number;
		usuario_id: number;
		ubicacion_id: number;
		fecha_asignacion: string;
		fecha_devolucion?: string;
	},
	usuarioResponsableId?: number,
) {
	const {
		activo_id,
		usuario_id,
		ubicacion_id,
		fecha_asignacion,
		fecha_devolucion,
	} = input;

	// Valida que el activo, usuario y ubicación existan
	const [activoCheck] = await db
		.select({ total: count() })
		.from(activos)
		.where(and(eq(activos.id, activo_id), eq(activos.activo, 1)));

	if (!activoCheck.total) {
		throw new Error("El activo no existe o está dado de baja.");
	}

	const [usuarioCheck] = await db
		.select({ total: count() })
		.from(usuarios)
		.where(eq(usuarios.id, usuario_id));

	if (!usuarioCheck.total) {
		throw new Error("El usuario no existe.");
	}

	const [ubicacionCheck] = await db
		.select({ total: count() })
		.from(ubicaciones)
		.where(eq(ubicaciones.id, ubicacion_id));

	if (!ubicacionCheck.total) {
		throw new Error("La ubicación no existe.");
	}

	const [activo] = await db
		.select({ nombre: activos.nombre })
		.from(activos)
		.where(eq(activos.id, activo_id));
	const [usuario] = await db
		.select({ nombre: usuarios.nombre })
		.from(usuarios)
		.where(eq(usuarios.id, usuario_id));
	const [ubicacion] = await db
		.select({ nombre: ubicaciones.nombre })
		.from(ubicaciones)
		.where(eq(ubicaciones.id, ubicacion_id));

	const comentariosDinamicos = `Activo "${activo.nombre}" asignado al usuario "${usuario.nombre}" en la ubicación "${ubicacion.nombre}".`;

	// Transacción: inserta la asignación, actualiza estado del activo y registra historial
	return await db.transaction(async (tx) => {
		const [result] = await tx.insert(asignaciones).values({
			activo_id,
			usuario_id,
			ubicacion_id,
			fecha_asignacion: new Date(fecha_asignacion),
			fecha_devolucion: fecha_devolucion ? new Date(fecha_devolucion) : null,
			comentarios: comentariosDinamicos,
		});

		await tx
			.update(activos)
			.set({ estado: "Asignado" })
			.where(eq(activos.id, activo_id));

		if (!usuarioResponsableId) {
			throw new Error("Acceso no autorizado.");
		}

		await tx.insert(historial).values({
			activo_id,
			accion: "Activo asignado",
			usuario_responsable: usuarioResponsableId,
			usuario_asignado: usuario_id,
			ubicacion_nueva: ubicacion_id,
			detalles: comentariosDinamicos,
		});

		return {
			id: result.insertId,
			activo_id,
			usuario_id,
			ubicacion_id,
			fecha_asignacion,
			fecha_devolucion: fecha_devolucion || null,
			comentarios: comentariosDinamicos,
		};
	});
}

// Actualización de asignaciones

export async function updateAsignacion(
	id: string,
	input: {
		fecha_devolucion?: string;
		usuario_id?: number;
		ubicacion_id?: number;
	},
	usuarioResponsableId?: number,
) {
	const { fecha_devolucion, usuario_id, ubicacion_id } = input;

	// Verifica que la asignación exista antes de modificarla
	const [asignacionExistente] = await db
		.select()
		.from(asignaciones)
		.where(eq(asignaciones.id, Number(id)));

	if (!asignacionExistente) {
		throw new Error("La asignación no existe.");
	}

	const [activoActual] = await db
		.select({ nombre: activos.nombre })
		.from(activos)
		.where(eq(activos.id, asignacionExistente.activo_id));
	const [usuarioAnterior] = await db
		.select({ nombre: usuarios.nombre })
		.from(usuarios)
		.where(eq(usuarios.id, asignacionExistente.usuario_id));
	const [ubicacionAnterior] = await db
		.select({ nombre: ubicaciones.nombre })
		.from(ubicaciones)
		.where(eq(ubicaciones.id, asignacionExistente.ubicacion_id));

	if (!activoActual || !usuarioAnterior || !ubicacionAnterior) {
		throw new Error(
			"Uno de los datos relacionados no existe en la base de datos.",
		);
	}

	let nuevoUsuarioNombre = usuarioAnterior.nombre;
	if (usuario_id && usuario_id !== asignacionExistente.usuario_id) {
		const [nuevoUsuario] = await db
			.select({ nombre: usuarios.nombre })
			.from(usuarios)
			.where(eq(usuarios.id, usuario_id));

		if (!nuevoUsuario) {
			throw new Error("El nuevo usuario no existe.");
		}
		nuevoUsuarioNombre = nuevoUsuario.nombre;
	}

	let nuevaUbicacionNombre = ubicacionAnterior.nombre;
	if (ubicacion_id && ubicacion_id !== asignacionExistente.ubicacion_id) {
		const [nuevaUbicacion] = await db
			.select({ nombre: ubicaciones.nombre })
			.from(ubicaciones)
			.where(eq(ubicaciones.id, ubicacion_id));

		if (!nuevaUbicacion) {
			throw new Error("La nueva ubicación no existe.");
		}
		nuevaUbicacionNombre = nuevaUbicacion.nombre;
	}

	let comentariosDinamicos = "";

	if (
		fecha_devolucion &&
		fecha_devolucion !==
			asignacionExistente.fecha_devolucion?.toISOString().split("T")[0]
	) {
		const fechaValida = new Date(fecha_devolucion);
		if (Number.isNaN(fechaValida.getTime())) {
			throw new Error("El formato de la fecha de devolución es inválido.");
		}
		comentariosDinamicos += `Fecha de devolución actualizada a "${fecha_devolucion}". `;
	}

	if (usuario_id && usuario_id !== asignacionExistente.usuario_id) {
		comentariosDinamicos += `Usuario asignado cambiado de "${usuarioAnterior.nombre}" a "${nuevoUsuarioNombre}". `;
	}

	if (ubicacion_id && ubicacion_id !== asignacionExistente.ubicacion_id) {
		comentariosDinamicos += `Ubicación cambiada de "${ubicacionAnterior.nombre}" a "${nuevaUbicacionNombre}". `;
	}

	if (!comentariosDinamicos) {
		comentariosDinamicos = "Sin cambios adicionales.";
	}

	const nuevoComentario = `Activo "${activoActual.nombre}" asignado al usuario "${nuevoUsuarioNombre}" en la ubicación "${nuevaUbicacionNombre}".`;

	const updateValues: Record<string, unknown> = {};
	if (fecha_devolucion)
		updateValues.fecha_devolucion = new Date(fecha_devolucion);
	if (usuario_id) updateValues.usuario_id = usuario_id;
	if (ubicacion_id) updateValues.ubicacion_id = ubicacion_id;
	updateValues.comentarios = nuevoComentario;

	await db
		.update(asignaciones)
		.set(updateValues)
		.where(eq(asignaciones.id, Number(id)));

	if (!usuarioResponsableId) {
		throw new Error("Acceso no autorizado.");
	}

	await db.insert(historial).values({
		activo_id: asignacionExistente.activo_id,
		accion: "Asignación actualizada",
		usuario_responsable: usuarioResponsableId,
		usuario_asignado: usuario_id || asignacionExistente.usuario_id,
		ubicacion_nueva: ubicacion_id || asignacionExistente.ubicacion_id,
		detalles: comentariosDinamicos,
	});
}

export async function deleteAsignacion(
	id: string,
	usuarioResponsableId?: number,
) {
	const [asignacion] = await db
		.select({
			asignacion_id: asignaciones.id,
			activo_id: asignaciones.activo_id,
			activo_nombre: activos.nombre,
		})
		.from(asignaciones)
		.innerJoin(activos, eq(asignaciones.activo_id, activos.id))
		.where(eq(asignaciones.id, Number(id)));

	if (!asignacion) {
		throw new Error("Asignación no encontrada");
	}

	const { activo_id, activo_nombre } = asignacion;

	await db.transaction(async (tx) => {
		await tx
			.update(activos)
			.set({ estado: "Disponible" })
			.where(eq(activos.id, activo_id));

		await tx
			.update(asignaciones)
			.set({ activo: 0 })
			.where(eq(asignaciones.id, Number(id)));

		const accion = "Desasignado";
		const detalles = `Se desasignó el activo "${activo_nombre}" del usuario.`;

		if (!usuarioResponsableId) {
			throw new Error("Acceso no autorizado.");
		}

		await tx.insert(historial).values({
			activo_id,
			accion,
			usuario_responsable: usuarioResponsableId,
			detalles,
		});
	});
}

export async function getActivosDisponibles(queryParams_: {
	page?: number;
	limit?: number;
	orden?: string;
	search?: string;
	tipo?: string;
	ubicacion?: string;
	proveedores?: string;
}) {
	const page = queryParams_.page || 1;
	const limit = Math.min(queryParams_.limit || 10, 100);
	const offset = (page - 1) * limit;

	const orden = queryParams_.orden || "asc";
	const safeOrder = orden.toLowerCase() === "desc" ? "DESC" : "ASC";

	const {
		search = "",
		tipo,
		ubicacion,
		proveedores: proveedorId,
	} = queryParams_;

	const filters = [
		eq(activos.activo, 1),
		eq(activos.estado, "Disponible"),
		...(search ? [like(activos.nombre, `%${search}%`)] : []),
		...(tipo ? [eq(activos.tipo_id, Number(tipo))] : []),
		...(ubicacion ? [eq(activos.ubicacion_id, Number(ubicacion))] : []),
		...(proveedorId ? [eq(activos.proveedor_id, Number(proveedorId))] : []),
	];

	const rows = await db
		.select({
			id: activos.id,
			activo: activos.nombre,
			tipo_activo: tipos.nombre,
			estado_activo: activos.estado,
			proveedor: proveedores.nombre,
			ubicacion: ubicaciones.nombre,
			foto_url: activos.foto_url,
		})
		.from(activos)
		.leftJoin(tipos, eq(activos.tipo_id, tipos.id))
		.leftJoin(proveedores, eq(activos.proveedor_id, proveedores.id))
		.leftJoin(ubicaciones, eq(activos.ubicacion_id, ubicaciones.id))
		.where(and(...filters))
		.orderBy(safeOrder === "DESC" ? desc(activos.id) : asc(activos.id))
		.limit(limit)
		.offset(offset);

	const [totalResult] = await db
		.select({ total: count() })
		.from(activos)
		.leftJoin(tipos, eq(activos.tipo_id, tipos.id))
		.leftJoin(proveedores, eq(activos.proveedor_id, proveedores.id))
		.leftJoin(ubicaciones, eq(activos.ubicacion_id, ubicaciones.id))
		.where(and(...filters));

	const total = Number(totalResult.total);

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

export async function obtenerDatosAuxiliares(activoId?: string) {
	if (activoId && Number.isNaN(Number(activoId))) {
		throw new Error("El ID proporcionado no es válido");
	}

	let usuariosData: { id: number; nombre: string }[];
	try {
		usuariosData = await db
			.select({ id: usuarios.id, nombre: usuarios.nombre })
			.from(usuarios);
	} catch {
		throw new Error("Error al obtener los usuarios");
	}

	let tiposActivos: { id: number; nombre: string }[];
	try {
		tiposActivos = await db
			.select({ id: tipos.id, nombre: tipos.nombre })
			.from(tipos);
	} catch {
		throw new Error("Error al obtener los tipos de activos");
	}

	let proveedoresData: { id: number; nombre: string }[];
	try {
		proveedoresData = await db
			.select({ id: proveedores.id, nombre: proveedores.nombre })
			.from(proveedores);
	} catch {
		throw new Error("Error al obtener los proveedores");
	}

	let ubicacionesData: { id: number; nombre: string }[];
	try {
		ubicacionesData = await db
			.select({ id: ubicaciones.id, nombre: ubicaciones.nombre })
			.from(ubicaciones);
	} catch {
		throw new Error("Error al obtener las ubicaciones");
	}

	let nombreActivo: string | null = null;
	let fotoActivo: string | null = null;

	if (activoId) {
		try {
			const [activo] = await db
				.select({ nombre: activos.nombre, foto_url: activos.foto_url })
				.from(activos)
				.where(eq(activos.id, Number(activoId)));

			if (!activo) {
				throw new Error("Activo no encontrado");
			}

			nombreActivo = activo.nombre;
			fotoActivo = activo.foto_url;
		} catch {
			throw new Error("Error al obtener el activo");
		}
	}

	return {
		usuarios: usuariosData,
		tiposActivos,
		proveedores: proveedoresData,
		ubicaciones: ubicacionesData,
		nombre: nombreActivo,
		foto_url: fotoActivo,
	};
}
