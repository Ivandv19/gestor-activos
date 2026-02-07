const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authenticate = require("../middleware/authenticate");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Estadísticas y resúmenes del sistema
 */

/**
 * @swagger
 * /dashboard/resumen:
 *   get:
 *     summary: Obtiene estadísticas generales del sistema
 *     description: |
 *       Proporciona un resumen completo de los activos incluyendo:
 *       - Totales por estado (disponibles, asignados, etc.)
 *       - Tendencia mensual de registros (último año)
 *       - Filtrado automático por el último año desde la fecha actual.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Resumen del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_activos:
 *                   type: integer
 *                   example: 150
 *                   description: Total de activos registrados
 *                 activos_disponibles:
 *                   type: integer
 *                   example: 75
 *                   description: Activos en estado 'Disponible'
 *                 activos_asignados:
 *                   type: integer
 *                   example: 50
 *                   description: Activos en estado 'Asignado'
 *                 activos_en_mantenimiento:
 *                   type: integer
 *                   example: 15
 *                   description: Activos en estado 'En mantenimiento'
 *                 activos_dados_de_baja:
 *                   type: integer
 *                   example: 10
 *                   description: Activos en estado 'Dado de baja'
 *                 tendencia_mensual:
 *                   type: object
 *                   properties:
 *                     labels:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
 *                       description: Nombres de los meses
 *                     data:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [5, 10, 8, 12, 15, 20, 18, 22, 15, 10, 8, 5]
 *                       description: Cantidad de activos registrados por mes
 *                     anos:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [2023, 2023, 2023, 2023, 2023, 2023, 2023, 2023, 2023, 2023, 2023, 2023]
 *                       description: Año correspondiente a cada mes (opcional)
 *                 ano_tendencia:
 *                   type: integer
 *                   example: 2023
 *                   description: Año al que corresponde la tendencia mensual
 *                 message:
 *                   type: string
 *                   example: "No hay activos registrados"
 *                   description: Solo presente cuando no hay activos
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener el resumen del dashboard"
 *                 error:
 *                   type: string
 *                   example: "Detalle del error (solo en desarrollo)"
 *                   description: Opcional, para entornos de desarrollo
 */

router.get("/resumen", authenticate, dashboardController.getResumen);

/**
 * @swagger
 * /dashboard/alertas:
 *   get:
 *     summary: Obtiene alertas y notificaciones del sistema
 *     description: |
 *       Proporciona un resumen de alertas importantes incluyendo:
 *       - Licencias próximas a vencer (30 días)
 *       - Garantías próximas a expirar (30 días)
 *       - Activos en mantenimiento
 *       - Activos próximos a devolver (30 días)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Resumen de alertas del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 licencias_proximas_a_vencer:
 *                   type: integer
 *                   example: 5
 *                   description: Cantidad de licencias que vencen en los próximos 30 días
 *                 garantias_proximas_a_expirar:
 *                   type: integer
 *                   example: 3
 *                   description: Cantidad de garantías que expiran en los próximos 30 días
 *                 activos_en_mantenimiento:
 *                   type: integer
 *                   example: 7
 *                   description: Cantidad de activos actualmente en mantenimiento
 *                 activos_proximos_a_devolver:
 *                   type: integer
 *                   example: 2
 *                   description: Cantidad de activos programados para devolución en los próximos 30 días
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener las alertas del dashboard"
 */
//
router.get("/alertas", authenticate, dashboardController.getAlertas);

module.exports = router;
