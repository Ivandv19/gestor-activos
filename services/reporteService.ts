import { and, eq } from "drizzle-orm";
import type { ExecuteValues, RowDataPacket } from "mysql2/promise";
import db, { pool } from "../config/db.js";
import {
	proveedores,
	tipos,
	tiposreporte,
	ubicaciones,
	usuarios,
} from "../db/schema.js";
import { obtenerEstrategia } from "./reportes/registroReporte.js";

// Tipos de reporte disponibles

export async function getTiposReporte() {
	const tiposReporte = await db.select().from(tiposreporte);

	if (!tiposReporte || tiposReporte.length === 0) {
		throw new Error("No existen tipos de reporte registrados.");
	}

	return tiposReporte;
}

// Datos auxiliares para filtros de reportes
export async function getDatosAuxiliares() {
	const tiposActivo = await db
		.select({ id: tipos.id, nombre: tipos.nombre })
		.from(tipos);
	const usuariosList = await db
		.select({ id: usuarios.id, nombre: usuarios.nombre })
		.from(usuarios);
	const ubicacionesList = await db
		.select({ id: ubicaciones.id, nombre: ubicaciones.nombre })
		.from(ubicaciones);
	const proveedoresList = await db
		.select({ id: proveedores.id, nombre: proveedores.nombre })
		.from(proveedores);

	return {
		tiposActivo,
		usuarios: usuariosList,
		ubicaciones: ubicacionesList,
		proveedores: proveedoresList,
	};
}

// Genera un reporte usando la estrategia correspondiente al tipo
export async function generarReporte(
	tipo_id: number,
	filtros: Record<string, unknown>,
) {
	const tipoReporteRows = await db
		.select({
			id: tiposreporte.id,
			nombre: tiposreporte.nombre,
			descripcion: tiposreporte.descripcion,
		})
		.from(tiposreporte)
		.where(and(eq(tiposreporte.id, tipo_id), eq(tiposreporte.activo, 1)));

	if (tipoReporteRows.length === 0) {
		throw new Error("Tipo de reporte no válido o inactivo.");
	}

	const tipoReporte = tipoReporteRows[0] as {
		nombre: string;
		descripcion: string;
	};
	const strategy = obtenerEstrategia(tipo_id);
	const { query, params } = strategy.buildQuery(filtros);

	const [results] = (await pool.execute(query, params as ExecuteValues[])) as [
		RowDataPacket[],
		unknown,
	];
	const { resumen, detalles } = strategy.procesar(
		results as unknown as Record<string, unknown>[],
	);

	async function getNombre(campo: unknown, tabla: string) {
		if (!campo) return "Todos";
		const [rows] = (await pool.execute(
			`SELECT nombre FROM ${tabla} WHERE id = ?`,
			[String(campo)],
		)) as [RowDataPacket[], unknown];
		const resultRows = rows as RowDataPacket[];
		return resultRows.length > 0
			? ((resultRows[0] as Record<string, unknown>).nombre as string)
			: "Desconocido";
	}

	return {
		tipo_reporte: tipoReporte.nombre,
		descripcion: tipoReporte.descripcion,
		filtros: {
			tipo_activo: await getNombre(filtros.tipo_activo_id, "tipos"),
			usuario: await getNombre(filtros.usuario_id, "usuarios"),
			ubicacion: await getNombre(filtros.ubicacion_id, "ubicaciones"),
			proveedor: await getNombre(filtros.proveedor_id, "proveedores"),
			fecha_inicio: (filtros.fecha_inicio as string) || null,
			fecha_fin: (filtros.fecha_fin as string) || null,
		},
		resultados: { resumen, detalles },
	};
}
