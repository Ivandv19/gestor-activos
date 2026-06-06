import type { EstrategiaReporte } from "../EstrategiaReporte.js";

export class ReporteCostos implements EstrategiaReporte {
	buildQuery(filtros: Record<string, unknown>) {
		const conditions: string[] = [];
		const params: unknown[] = [];

		if (filtros.usuario_id) {
			conditions.push(
				"a.id IN (SELECT activo_id FROM asignaciones WHERE usuario_id = ?)",
			);
			params.push(filtros.usuario_id);
		}
		if (filtros.tipo_activo_id) {
			conditions.push("a.tipo_id = ?");
			params.push(filtros.tipo_activo_id);
		}

		const where =
			conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

		return {
			query: `
        SELECT SUM(a.valor_compra) AS costo_total
        FROM activos a
        LEFT JOIN asignaciones asig ON a.id = asig.activo_id
        WHERE a.activo = 1 ${where}
      `,
			params,
		};
	}

	procesar(results: Record<string, unknown>[]) {
		return {
			resumen: { "Costo total": results[0]?.costo_total || 0 },
			detalles: results,
		};
	}
}
