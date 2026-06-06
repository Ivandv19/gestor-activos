import type { EstrategiaReporte } from "../EstrategiaReporte.js";

export class ReportePorUsuario implements EstrategiaReporte {
	buildQuery(filtros: Record<string, unknown>) {
		const conditions: string[] = [];
		const params: unknown[] = [];

		if (filtros.usuario_id) {
			conditions.push("asig.usuario_id = ?");
			params.push(filtros.usuario_id);
		}
		if (filtros.ubicacion_id) {
			conditions.push("asig.ubicacion_id = ?");
			params.push(filtros.ubicacion_id);
		}
		if (filtros.fecha_inicio) {
			conditions.push("asig.fecha_asignacion >= ?");
			params.push(filtros.fecha_inicio);
		}
		if (filtros.fecha_fin) {
			conditions.push("asig.fecha_devolucion <= ?");
			params.push(filtros.fecha_fin);
		}

		const where =
			conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

		return {
			query: `
        SELECT u.nombre AS usuario, COUNT(a.id) AS cantidad
        FROM asignaciones asig
        JOIN usuarios u ON asig.usuario_id = u.id
        JOIN activos a ON asig.activo_id = a.id AND a.activo = 1
        WHERE asig.activo = 1 ${where}
        GROUP BY u.nombre
      `,
			params,
		};
	}

	procesar(results: Record<string, unknown>[]) {
		const resumen: Record<string, unknown> = {};
		results.forEach((row) => {
			resumen[row.usuario as string] = row.cantidad;
		});
		return { resumen, detalles: results };
	}
}
