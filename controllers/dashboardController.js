const pool = require("../config/db");

exports.getResumen = async (req, res) => {
	try {
		// Consulta para calcular estadísticas generales
		const [result] = await pool.query(`
      SELECT 
        COUNT(*) AS total_activos,
        SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) AS activos_disponibles,
        SUM(CASE WHEN estado = 'Asignado' THEN 1 ELSE 0 END) AS activos_asignados,
        SUM(CASE WHEN estado = 'En mantenimiento' THEN 1 ELSE 0 END) AS activos_en_mantenimiento,
        SUM(CASE WHEN estado = 'Dado de baja' THEN 1 ELSE 0 END) AS activos_dados_de_baja
      FROM activos;
    `);

		// Si no hay activos registrados, devolver un mensaje específico
		if (result[0].total_activos === 0) {
			return res.status(200).json({ message: "No hay activos registrados" });
		}

		// Calcular el rango de fechas: desde hace un año hasta hoy
		const fechaActual = new Date();
		const fechaHaceUnAno = new Date(fechaActual);
		fechaHaceUnAno.setFullYear(fechaActual.getFullYear() - 1);

		// Consulta para obtener la tendencia mensual (incluyendo todos los meses)
		const [tendenciaMensualResult] = await pool.query(
			`
      WITH Meses AS (
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
      FROM Meses m
      LEFT JOIN activos a 
        ON MONTH(a.fecha_registro) = m.numero 
        AND a.fecha_registro >= ? AND a.fecha_registro <= ?
      GROUP BY m.mes, m.numero, YEAR(a.fecha_registro)
      ORDER BY YEAR(a.fecha_registro), m.numero;
    `,
			[fechaHaceUnAno, fechaActual],
		);

		// Extraer el año de los resultados (asumimos que todos los registros pertenecen al mismo año)
		const ano =
			tendenciaMensualResult.length > 0
				? tendenciaMensualResult[0].ano
				: new Date().getFullYear();

		// Transformar los resultados en el formato esperado por el frontend
		const tendenciaMensual = {
			labels: tendenciaMensualResult.map((row) => row.mes), // Etiquetas: ['Ene', 'Feb', ...]
			data: tendenciaMensualResult.map((row) => row.cantidad), // Datos: [10, 20, ...]
		};

		// Devolver las estadísticas junto con la tendencia mensual y el año
		res.status(200).json({
			...result[0],
			tendencia_mensual: tendenciaMensual,
			ano_tendencia: ano,
		});
	} catch (error) {
		console.error("[ERROR GET RESUMEN]:", error.message); // Logs detallados para depuración
		res
			.status(500)
			.json({ message: "Error al obtener el resumen del dashboard" });
	}
};

exports.getAlertas = async (req, res) => {
	try {
		// Consulta para contar licencias próximas a vencer
		const [licenciasProximas] = await pool.query(`
            SELECT COUNT(*) AS count
            FROM activos
            WHERE tipo_id = 2 AND fecha_vencimiento_licencia BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);
        `);

		// Consulta para contar garantías próximas a expirar
		const [garantiasProximas] = await pool.query(`
            SELECT COUNT(*) AS count
            FROM garantias
            WHERE fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);
          `);

		// Consulta para contar activos en mantenimiento
		const [activosMantenimiento] = await pool.query(`
            SELECT COUNT(*) AS count
            FROM activos
            WHERE estado = 'En mantenimiento';
        `);

		// Consulta para contar activos próximos a devolver
		const [activosDevolver] = await pool.query(`
            SELECT COUNT(*) AS count
            FROM asignaciones
            WHERE fecha_devolucion BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);
        `);

		// Devolver un resumen numérico de las alertas
		res.status(200).json({
			licencias_proximas_a_vencer: licenciasProximas[0].count || 0,
			garantias_proximas_a_expirar: garantiasProximas[0].count || 0,
			activos_en_mantenimiento: activosMantenimiento[0].count || 0,
			activos_proximos_a_devolver: activosDevolver[0].count || 0,
		});
	} catch (error) {
		console.error("[ERROR GET ALERTAS]:", error.message); // Logs detallados para depuración
		res
			.status(500)
			.json({ message: "Error al obtener las alertas del dashboard" });
	}
};
