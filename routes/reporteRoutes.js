const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const authenticate = require('../middleware/authenticate');

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Endpoints para gestión de reportes y sus tipos
 */

/**
 * @swagger
 * /reportes/tipos:
 *   get:
 *     summary: Obtiene todos los tipos de reporte disponibles
 *     description: |
 *       Devuelve un listado de tipos de reporte con sus detalles (id, nombre, descripción y estado).
 *       - Si no hay tipos de reporte registrados, se devuelve un error 404.
 *       - En caso de error interno, se devuelve un mensaje genérico.
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Listado de tipos de reporte
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tiposReporte:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TipoReporte'
 *             example:
 *               success: true
 *               tiposReporte:
 *                 - id: 1
 *                   nombre: "Activos por estado"
 *                   descripcion: "Agrupa activos por su estado actual."
 *                   activo: true
 *                 - id: 2
 *                   nombre: "Activos asignados por usuario"
 *                   descripcion: "Muestra cuántos activos tiene cada usuario."
 *                   activo: true
 *       404:
 *         description: No existen tipos de reporte registrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No existen tipos de reporte registrados."
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error en la consulta."
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TipoReporte:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Activos por estado"
 *         descripcion:
 *           type: string
 *           example: "Agrupa activos por su estado actual."
 *         activo:
 *           type: boolean
 *           example: true
 */

router.get('/tipos', authenticate, reporteController.getTiposReporte);

/**
 * @swagger
 * /reportes/datos-auxiliares:
 *   get:
 *     summary: Obtiene datos auxiliares para formularios de reportes
 *     description: |
 *       Devuelve listados de referencia necesarios para crear/editar reportes:
 *       - Tipos de activo
 *       - Usuarios
 *       - Ubicaciones
 *       - Proveedores
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Datos auxiliares obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatosAuxiliares'
 *             example:
 *               tiposActivo:
 *                 - id: 1
 *                   nombre: "Hardware"
 *                 - id: 2
 *                   nombre: "Software"
 *               usuarios:
 *                 - id: 101
 *                   nombre: "Ana López"
 *                 - id: 102
 *                   nombre: "Carlos Ruiz"
 *               ubicaciones:
 *                 - id: 1
 *                   nombre: "Oficina Central"
 *                 - id: 2
 *                   nombre: "Sucursal Norte"
 *               proveedores:
 *                 - id: 1
 *                   nombre: "TecnoSoluciones"
 *                 - id: 2
 *                   nombre: "CloudServices"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DatosAuxiliares:
 *       type: object
 *       properties:
 *         tiposActivo:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemListaSimple'
 *         usuarios:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemListaSimple'
 *         ubicaciones:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemListaSimple'
 *         proveedores:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemListaSimple'
 * 
 *     ItemListaSimple:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Ejemplo"
 */
router.get('/datos-auxiliares', authenticate,  reporteController.getDatosAuxiliares);

/**
 * @swagger
 * /reportes/generar:
 *   post:
 *     summary: Genera un reporte dinámico basado en tipo y filtros
 *     description: |
 *       Endpoint flexible para generar distintos tipos de reportes:
 *       - Soporta 7 tipos predefinidos (activos por estado, asignaciones, garantías, etc.).
 *       - Aplica filtros avanzados según el tipo de reporte.
 *       - Retorna un resumen y datos detallados.
 *     tags: [Reportes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerarReporteRequest'
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReporteResponse'
 *       400:
 *         description: Error de validación (tipo_id inválido, filtros incorrectos)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "El campo 'tipo_id' es obligatorio."
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error al generar el reporte."
 *                 error:
 *                   type: string
 *                   example: "Detalle del error interno."
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GenerarReporteRequest:
 *       type: object
 *       required:
 *         - tipo_id
 *       properties:
 *         tipo_id:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5, 6, 7]
 *           description: |
 *             ID del tipo de reporte:
 *             - 1: Activos por estado
 *             - 2: Activos asignados por usuario
 *             - 3: Garantías por estado
 *             - 4: Costo total de activos
 *             - 5: Historial de asignaciones
 *             - 6: Activos por tipo
 *             - 7: Ubicación de activos
 *           example: 1
 *         filtros:
 *           type: object
 *           description: Filtros opcionales para personalizar el reporte.
 *           properties:
 *             tipo_activo_id:
 *               type: integer
 *               example: 2
 *               description: Filtra activos por su tipo.
 *             usuario_id:
 *               type: integer
 *               example: 101
 *               description: Filtra activos o asignaciones por usuario.
 *             ubicacion_id:
 *               type: integer
 *               example: 3
 *               description: Filtra activos o asignaciones por ubicación.
 *             proveedor_id:
 *               type: integer
 *               example: 5
 *               description: Filtra garantías o activos por proveedor.
 *             fecha_inicio:
 *               type: string
 *               format: date
 *               example: "2024-01-01"
 *               description: Filtra registros con fecha igual o posterior.
 *             fecha_fin:
 *               type: string
 *               format: date
 *               example: "2024-12-31"
 *               description: Filtra registros con fecha igual o anterior.
 * 
 *     ReporteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Reporte generado exitosamente."
 *         tipo_reporte:
 *           type: string
 *           example: "Activos por estado"
 *         descripcion:
 *           type: string
 *           example: "Muestra la cantidad de activos agrupados por estado."
 *         filtros:
 *           type: object
 *           properties:
 *             tipo_activo:
 *               type: string
 *               example: "Hardware"
 *             usuario:
 *               type: string
 *               example: "Ana López"
 *             ubicacion:
 *               type: string
 *               example: "Oficina Central"
 *             proveedor:
 *               type: string
 *               example: "TecnoSoluciones"
 *             fecha_inicio:
 *               type: string
 *               example: "2024-01-01"
 *             fecha_fin:
 *               type: string
 *               example: "2024-12-31"
 *         resultados:
 *           type: object
 *           properties:
 *             resumen:
 *               type: object
 *               example:
 *                 "Operativo": 15
 *                 "En mantenimiento": 3
 *                 "Dado de baja": 2
 *               description: Resumen de los datos procesados.
 *             detalles:
 *               type: array
 *               items:
 *                 type: object
 *                 example:
 *                   - estado: "Operativo"
 *                     cantidad: 15
 *                   - estado: "En mantenimiento"
 *                     cantidad: 3
 *               description: Datos detallados del reporte.
 */

router.post('/generar', authenticate, reporteController.generarReporte);

module.exports = router;
