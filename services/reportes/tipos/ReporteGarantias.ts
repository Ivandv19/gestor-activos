import type { EstrategiaReporte } from "../EstrategiaReporte.js";

export class ReporteGarantias implements EstrategiaReporte {
	buildQuery(filtros: Record<string, unknown>) {
		const conditions: string[] = [];
		const params: unknown[] = [];

		if (filtros.usuario_id) {
			conditions.push(
				"a.id IN (SELECT activo_id FROM asignaciones WHERE usuario_id = ?)",
			);
			params.push(filtros.usuario_id);
		}
		if (filtros.ubicacion_id) {
			conditions.push("a.ubicacion_id = ?");
			params.push(filtros.ubicacion_id);
		}
		if (filtros.proveedor_id) {
			conditions.push("g.proveedor_garantia_id = ?");
			params.push(filtros.proveedor_id);
		}
		if (filtros.fecha_inicio) {
			conditions.push("g.fecha_inicio >= ?");
			params.push(filtros.fecha_inicio);
		}
		if (filtros.fecha_fin) {
			conditions.push("g.fecha_fin <= ?");
			params.push(filtros.fecha_fin);
		}

		const where =
			conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

		return {
			query: `
        SELECT g.estado, COUNT(*) AS cantidad
        FROM garantias g
        JOIN activos a ON g.activo_id = a.id AND a.activo = 1
        WHERE g.activo = 1 ${where}
        GROUP BY g.estado
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
