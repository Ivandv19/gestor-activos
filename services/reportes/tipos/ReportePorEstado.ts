import type { EstrategiaReporte } from "../EstrategiaReporte.js";

export class ReportePorEstado implements EstrategiaReporte {
	buildQuery(filtros: Record<string, unknown>) {
		const conditions: string[] = [];
		const params: unknown[] = [];

		if (filtros.usuario_id) {
			conditions.push("asig.usuario_id = ?");
			params.push(filtros.usuario_id);
		}
		if (filtros.ubicacion_id) {
			conditions.push("a.ubicacion_id = ?");
			params.push(filtros.ubicacion_id);
		}
		if (filtros.fecha_inicio) {
			conditions.push("a.fecha_registro >= ?");
			params.push(filtros.fecha_inicio);
		}
		if (filtros.fecha_fin) {
			conditions.push("a.fecha_salida <= ?");
			params.push(filtros.fecha_fin);
		}

		const where =
			conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

		return {
			query: `
        SELECT a.estado, COUNT(*) AS cantidad
        FROM activos a
        LEFT JOIN asignaciones asig ON a.id = asig.activo_id
        WHERE a.activo = 1 ${where}
        GROUP BY a.estado
      `,
			params,
		};
	}

	procesar(results: Record<string, unknown>[]) {
		const resumen: Record<string, unknown> = {};
		results.forEach((row) => {
			resumen[row.estado as string] = row.cantidad;
		});
		return { resumen, detalles: results };
	}
}
