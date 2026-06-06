import { and, asc, count, desc, eq, like, or } from "drizzle-orm";
import db from "../config/db.js";
import { activos, historial, usuarios } from "../db/schema.js";

// Consultas de historial

export async function getHistorialActivo(
	id: number,
	page: number,
	limit: number,
	orden: string,
	search: string,
	accion: string,
	usuario_responsable: string,
) {
	// Verifica que el activo exista antes de consultar su historial
	const [activo] = await db
		.select({ id: activos.id })
		.from(activos)
		.where(eq(activos.id, id))
		.limit(1);
	if (!activo) {
		throw new Error(`No se encontró ningún activo con el ID ${id}.`);
	}

	// Paginación, orden y filtros dinámicos
	const safeLimit = Math.min(limit, 100);
	const offset = (page - 1) * safeLimit;

	const whereConditions = [eq(historial.activo_id, id)];

	// Filtro por texto en acción o detalles
	if (search) {
		const searchCondition = or(
			like(historial.accion, `%${search}%`),
			like(historial.detalles, `%${search}%`),
		);
		if (searchCondition) {
			whereConditions.push(searchCondition);
		}
	}

	// Filtro por tipo de acción
	if (accion) {
		whereConditions.push(eq(historial.accion, accion));
	}

	// Filtro por usuario responsable
	if (usuario_responsable) {
		whereConditions.push(
			eq(historial.usuario_responsable, Number(usuario_responsable)),
		);
	}

	const rows = await db
		.select({
			id: historial.id,
			accion: historial.accion,
			fecha: historial.fecha,
			usuario_responsable: usuarios.nombre,
			detalles: historial.detalles,
		})
		.from(historial)
		.innerJoin(usuarios, eq(historial.usuario_responsable, usuarios.id))
		.where(and(...whereConditions))
		.orderBy(orden === "desc" ? desc(historial.fecha) : asc(historial.fecha))
		.limit(safeLimit)
		.offset(offset);

	const [totalResult] = await db
		.select({ total: count() })
		.from(historial)
		.innerJoin(usuarios, eq(historial.usuario_responsable, usuarios.id))
		.where(and(...whereConditions));

	return {
		data: rows,
		pagination: {
			page,
			limit: safeLimit,
			total: totalResult.total,
			totalPages: Math.ceil(totalResult.total / safeLimit),
		},
	};
}

// Obtiene listas de acciones y usuarios para filtros del historial
export async function getDatosAuxiliares() {
	const acciones = await db
		.select({
			id: activos.id,
			nombre: activos.nombre,
			fecha_registro: activos.fecha_registro,
			estado: activos.estado,
		})
		.from(activos);
	if (!acciones.length) {
		throw new Error("No se encontraron acciones");
	}

	const usuariosList = await db
		.selectDistinct({ id: usuarios.id, nombre: usuarios.nombre })
		.from(usuarios)
		.innerJoin(historial, eq(usuarios.id, historial.usuario_responsable))
		.orderBy(asc(usuarios.nombre));
	if (!usuariosList.length) {
		throw new Error("No se encontraron usuarios");
	}

	return {
		acciones,
		usuarios: usuariosList,
	};
}

// Registro de acciones en el historial

export async function registrarAccion(
	activoId: number,
	accion: string,
	detalles: string | undefined,
	fecha: string | undefined,
	usuarioResponsable: number | undefined,
	usuarioAsignado: number | undefined,
	ubicacionNueva: number | undefined,
) {
	// Verifica que el activo exista antes de registrar
	const [activo] = await db
		.select({ id: activos.id })
		.from(activos)
		.where(eq(activos.id, activoId))
		.limit(1);
	if (!activo) {
		throw new Error(`No se encontró ningún activo con el ID ${activoId}.`);
	}

	const fechaRegistrada = fecha
		? new Date(fecha).toISOString().replace("T", " ").substring(0, 19)
		: new Date().toISOString().replace("T", " ").substring(0, 19);

	const [result] = await db.insert(historial).values({
		activo_id: activoId,
		accion,
		fecha: new Date(fechaRegistrada),
		usuario_responsable: usuarioResponsable ?? null,
		usuario_asignado: usuarioAsignado || null,
		ubicacion_nueva: ubicacionNueva || null,
		detalles: detalles || null,
	} as unknown as typeof historial.$inferInsert);

	return {
		id: (result as unknown as { insertId: number }).insertId,
		accion,
		fecha: fechaRegistrada,
		usuario_responsable: usuarioResponsable,
		usuario_asignado: usuarioAsignado,
		ubicacion_nueva: ubicacionNueva,
		detalles,
	};
}
