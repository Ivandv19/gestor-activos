import { and, count, eq, sql } from "drizzle-orm";
import db from "../config/db.js";
import {
	activos,
	garantias,
	historial,
	proveedoresgarantia,
} from "../db/schema.js";

// Consultas de garantías

export async function getGarantias(page: number, limit: number) {
	// Validación de parámetros de paginación
	if (Number.isNaN(page) || Number.isNaN(limit)) {
		throw new Error("Los parámetros de paginación deben ser números válidos.");
	}

	const safeLimit = Math.min(limit, 100);

	const offset = (page - 1) * safeLimit;

	const results = await db
		.select({
			id: garantias.id,
			activo: activos.nombre,
			proveedor_garantia: proveedoresgarantia.nombre,
			fecha_inicio: sql<string>`DATE_FORMAT(${garantias.fecha_inicio}, '%Y-%m-%d')`,
			fecha_fin: sql<string>`DATE_FORMAT(${garantias.fecha_fin}, '%Y-%m-%d')`,
			costo: garantias.costo,
			condiciones: garantias.condiciones,
			estado: garantias.estado,
			descripcion: garantias.descripcion,
			nombre_garantia: garantias.nombre_garantia,
		})
		.from(garantias)
		.innerJoin(activos, eq(garantias.activo_id, activos.id))
		.innerJoin(
			proveedoresgarantia,
			eq(garantias.proveedor_garantia_id, proveedoresgarantia.id),
		)
		.where(eq(garantias.activo, 1))
		.limit(safeLimit)
		.offset(offset);

	const [countResult] = await db
		.select({ total: count() })
		.from(garantias)
		.where(eq(garantias.activo, 1));
	const total = countResult.total;

	return {
		data: results,
		pagination: {
			page,
			limit: safeLimit,
			total,
			totalPages: Math.ceil(total / safeLimit),
		},
	};
}

// Creación de garantías

export async function createGarantia(
	input: {
		activo_id: number;
		proveedor_garantia_id: number;
		nombre_garantia: string;
		fecha_inicio: string;
		fecha_fin: string;
		costo?: number;
		condiciones?: string;
		estado: string;
		descripcion?: string;
	},
	usuarioResponsableId?: number,
) {
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
	} = input;

	// Valida que la fecha de fin sea posterior a la de inicio
	const fechaInicioValida = new Date(fecha_inicio);
	const fechaFinValida = new Date(fecha_fin);

	if (fechaFinValida <= fechaInicioValida) {
		throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
	}

	// Verifica que el activo exista y esté activo
	const activo = await db
		.select({ id: activos.id, nombre: activos.nombre })
		.from(activos)
		.where(and(eq(activos.id, activo_id), eq(activos.activo, 1)));

	if (activo.length === 0) {
		throw new Error("El activo no existe o está dado de baja.");
	}

	const proveedor = await db
		.select({ id: proveedoresgarantia.id })
		.from(proveedoresgarantia)
		.where(eq(proveedoresgarantia.id, proveedor_garantia_id));

	if (proveedor.length === 0) {
		throw new Error("El proveedor de garantía no existe.");
	}

	const result = await db.insert(garantias).values({
		activo_id,
		proveedor_garantia_id,
		nombre_garantia,
		fecha_inicio: new Date(fecha_inicio),
		fecha_fin: new Date(fecha_fin),
		costo: costo != null ? String(costo) : null,
		condiciones: condiciones || null,
		estado: estado as "Vigente" | "Por vencer" | "Vencida",
		descripcion: descripcion || null,
	});

	const nombreActivo = activo[0].nombre;

	if (!usuarioResponsableId) {
		throw new Error("Acceso no autorizado.");
	}

	try {
		await db.insert(historial).values({
			activo_id,
			accion: "Garantía registrada",
			usuario_responsable: usuarioResponsableId,
			usuario_asignado: null,
			ubicacion_nueva: null,
			detalles: `Se registró una nueva garantía: ${nombre_garantia} para el activo "${nombreActivo}".`,
		});
	} catch {
		throw new Error("Error al registrar la acción en el historial.");
	}

	return {
		id: result[0].insertId,
		activo_id,
		proveedor_garantia_id,
		nombre_garantia,
		fecha_inicio,
		fecha_fin,
		costo,
		condiciones,
		estado,
		descripcion,
	};
}

// Actualización de garantías

export async function updateGarantia(
	id: string,
	input: {
		nombre_garantia?: string;
		estado?: string;
		fecha_fin?: string;
		descripcion?: string;
		proveedor_garantia_id?: number;
		costo?: number;
		condiciones?: string;
	},
) {
	const {
		nombre_garantia,
		estado,
		fecha_fin,
		descripcion,
		proveedor_garantia_id,
		costo,
		condiciones,
	} = input;

	// Verifica que la garantía exista antes de actualizarla
	const garantiaExistente = await db
		.select()
		.from(garantias)
		.where(eq(garantias.id, Number(id)));
	if (garantiaExistente.length === 0) {
		throw new Error("La garantía no existe.");
	}

	const activo = await db
		.select({ nombre: activos.nombre })
		.from(activos)
		.where(eq(activos.id, garantiaExistente[0].activo_id));
	const _nombreActivo = activo[0]?.nombre || "Activo desconocido";

	// Valida el estado contra valores permitidos
	const estadosPermitidos = ["Vigente", "Por vencer", "Vencida"];
	if (estado && !estadosPermitidos.includes(estado)) {
		throw new Error("El estado proporcionado no es válido.");
	}

	// Valida formato y que la fecha de fin sea futura
	if (fecha_fin) {
		const fechaFinValida = new Date(fecha_fin);
		if (Number.isNaN(fechaFinValida.getTime())) {
			throw new Error("El formato de la fecha de fin es inválido.");
		}

		const fechaActual = new Date();
		if (fechaFinValida <= fechaActual) {
			throw new Error("La fecha de fin debe ser posterior a la fecha actual.");
		}
	}

	const values: Record<string, unknown> = {};
	if (nombre_garantia) values.nombre_garantia = nombre_garantia;
	if (estado) values.estado = estado;
	if (fecha_fin) values.fecha_fin = fecha_fin;
	if (descripcion !== undefined) values.descripcion = descripcion || null;
	if (proveedor_garantia_id)
		values.proveedor_garantia_id = proveedor_garantia_id;
	if (costo !== undefined) values.costo = costo || null;
	if (condiciones !== undefined) values.condiciones = condiciones || null;

	if (Object.keys(values).length === 0) {
		throw new Error("No se proporcionaron campos para actualizar.");
	}

	await db
		.update(garantias)
		.set(values)
		.where(eq(garantias.id, Number(id)));

	return {
		id: Number(id),
		activo_id: garantiaExistente[0].activo_id,
		proveedor_garantia_id:
			proveedor_garantia_id || garantiaExistente[0].proveedor_garantia_id,
		nombre_garantia: nombre_garantia || garantiaExistente[0].nombre_garantia,
		fecha_inicio: garantiaExistente[0].fecha_inicio,
		fecha_fin: fecha_fin || garantiaExistente[0].fecha_fin,
		costo: costo !== undefined ? costo : garantiaExistente[0].costo,
		condiciones:
			condiciones !== undefined
				? condiciones
				: garantiaExistente[0].condiciones,
		estado: estado || garantiaExistente[0].estado,
		descripcion:
			descripcion !== undefined
				? descripcion
				: garantiaExistente[0].descripcion,
	};
}

// Eliminación de garantías

export async function deleteGarantia(id: string) {
	// Verifica que la garantía exista antes de eliminar
	const garantia = await db
		.select({ id: garantias.id })
		.from(garantias)
		.where(eq(garantias.id, Number(id)));
	if (garantia.length === 0) {
		throw new Error("La garantía no existe.");
	}

	await db
		.update(garantias)
		.set({ activo: 0 })
		.where(eq(garantias.id, Number(id)));
}
