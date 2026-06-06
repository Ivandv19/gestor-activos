import { and, eq, sql } from "drizzle-orm";
import db from "../config/db.js";
import { activos, asignaciones, garantias } from "../db/schema.js";

// Resumen general del dashboard

export async function getResumen() {
	// Cuenta total de activos agrupados por estado
	const [result] = await db
		.select({
			total_activos: sql<number>`COUNT(*)`,
			activos_disponibles: sql<number>`SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END)`,
			activos_asignados: sql<number>`SUM(CASE WHEN estado = 'Asignado' THEN 1 ELSE 0 END)`,
			activos_en_mantenimiento: sql<number>`SUM(CASE WHEN estado = 'En mantenimiento' THEN 1 ELSE 0 END)`,
			activos_dados_de_baja: sql<number>`SUM(CASE WHEN estado = 'Dado de baja' THEN 1 ELSE 0 END)`,
		})
		.from(activos)
		.where(eq(activos.activo, 1));

	// Sin activos registrados — devuelve ceros
	if (result.total_activos === 0) {
		return {
			total_activos: 0,
			activos_disponibles: 0,
			activos_asignados: 0,
			activos_en_mantenimiento: 0,
			activos_dados_de_baja: 0,
			tendencia_mensual: { labels: [], data: [] },
			ano_tendencia: new Date().getFullYear(),
		};
	}

	// Tendencia mensual de registros en el último año
	const fechaActual = new Date();
	const fechaHaceUnAno = new Date(fechaActual);
	fechaHaceUnAno.setFullYear(fechaActual.getFullYear() - 1);

	const tendenciaMensualResult = (await db.execute(sql`
    WITH meses AS (
      SELECT 'Ene' AS mes, 1 AS numero UNION ALL
      SELECT 'Feb', 2 UNION ALL
      SELECT 'Mar', 3 UNION ALL
      SELECT 'Abr', 4 UNION ALL
      SELECT 'May', 5 UNION ALL
      SELECT 'Jun', 6 UNION ALL
      SELECT 'Jul', 7 UNION ALL
      SELECT 'Ago', 8 UNION ALL
      SELECT 'Sep', 9 UNION ALL
      SELECT 'Oct', 10 UNION ALL
      SELECT 'Nov', 11 UNION ALL
      SELECT 'Dic', 12
    )
    SELECT 
      m.mes,
      COALESCE(COUNT(a.id), 0) AS cantidad,
      YEAR(a.fecha_registro) AS ano
    FROM meses m
    LEFT JOIN activos a 
      ON MONTH(a.fecha_registro) = m.numero 
      AND a.fecha_registro >= ${fechaHaceUnAno} AND a.fecha_registro <= ${fechaActual}
      AND a.activo = 1
    GROUP BY m.mes, m.numero, YEAR(a.fecha_registro)
    ORDER BY YEAR(a.fecha_registro), m.numero;
  `)) as unknown as Array<{ mes: string; cantidad: number; ano: number }>;

	const ano =
		tendenciaMensualResult.length > 0
			? tendenciaMensualResult[0].ano
			: new Date().getFullYear();

	return {
		total_activos: result.total_activos,
		activos_disponibles: result.activos_disponibles,
		activos_asignados: result.activos_asignados,
		activos_en_mantenimiento: result.activos_en_mantenimiento,
		activos_dados_de_baja: result.activos_dados_de_baja,
		tendencia_mensual: {
			labels: (tendenciaMensualResult as Array<{ mes: string }>).map(
				(row) => row.mes,
			),
			data: (tendenciaMensualResult as Array<{ cantidad: number }>).map(
				(row) => row.cantidad,
			),
		},
		ano_tendencia: ano,
	};
}

// Alertas del dashboard

export async function getAlertas() {
	// Licencias por vencer en los próximos 30 días
	const [licenciasProximas] = await db
		.select({
			count: sql<number>`COUNT(*)`,
		})
		.from(activos)
		.where(
			and(
				eq(activos.activo, 1),
				sql`fecha_vencimiento_licencia IS NOT NULL AND fecha_vencimiento_licencia BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`,
			),
		);

	// Garantías próximas a expirar en los próximos 30 días
	const [garantiasProximas] = await db
		.select({
			count: sql<number>`COUNT(*)`,
		})
		.from(garantias)
		.where(
			and(
				eq(garantias.activo, 1),
				sql`fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`,
			),
		);

	// Activos actualmente en mantenimiento
	const [activosMantenimiento] = await db
		.select({
			count: sql<number>`COUNT(*)`,
		})
		.from(activos)
		.where(and(eq(activos.activo, 1), eq(activos.estado, "En mantenimiento")));

	// Asignaciones con fecha de devolución próxima
	const [activosDevolver] = await db
		.select({
			count: sql<number>`COUNT(*)`,
		})
		.from(asignaciones)
		.where(
			and(
				eq(asignaciones.activo, 1),
				sql`fecha_devolucion BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`,
			),
		);

	return {
		licencias_proximas_a_vencer: licenciasProximas.count || 0,
		garantias_proximas_a_expirar: garantiasProximas.count || 0,
		activos_en_mantenimiento: activosMantenimiento.count || 0,
		activos_proximos_a_devolver: activosDevolver.count || 0,
	};
}
