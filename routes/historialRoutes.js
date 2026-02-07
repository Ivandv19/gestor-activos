const express = require("express");
const router = express.Router();
const historialController = require("../controllers/historialController");
const authenticate = require("../middleware/authenticate");

/**
 * @swagger
 * tags:
 *   name: Historial
 *   description: Gestión del historial de cambios de activos
 */

/**
 * @swagger
 * /historial/activo/{id}:
 *   get:
 *     summary: Obtiene el historial de cambios de un activo específico
 *     description: |
 *       Devuelve un listado paginado de todas las acciones registradas
 *       para un activo en particular, ordenadas por fecha descendente.
 *     tags: [Historial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del activo
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página (default 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Límite de resultados por página (default 10)
 *         example: 10
 *     responses:
 *       200:
 *         description: Historial del activo con metadatos de paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 25
 *                   description: Total de registros en el historial
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                   description: Total de páginas disponibles
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                   description: Página actual
 *                 pageSize:
 *                   type: integer
 *                   example: 10
 *                   description: Cantidad de registros por página
 *                 historial:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RegistroHistorial'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "El ID del activo debe ser un número válido"
 *       404:
 *         description: Activo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "No se encontró ningún activo con el ID 999"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al obtener el historial del activo"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegistroHistorial:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         accion:
 *           type: string
 *           example: "Asignación creada"
 *         fecha:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:00Z"
 *         usuario_responsable:
 *           type: string
 *           example: "admin@example.com"
 *         detalles:
 *           type: string
 *           example: "Activo 'Laptop Dell' asignado al usuario 'Juan Pérez'"
 *       required:
 *         - id
 *         - accion
 *         - fecha
 *         - usuario_responsable
 */
router.get(
	"/activos/:id",
	authenticate,
	historialController.getHistorialActivo,
);

/**
 * @swagger
 * /historial/activo/{id}:
 *   post:
 *     summary: Registra una nueva acción en el historial de un activo
 *     description: |
 *       Crea un nuevo registro en el historial de cambios de un activo,
 *       registrando quién realizó la acción y los detalles del cambio.
 *     tags: [Historial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del activo al que se asocia la acción
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevaAccionHistorial'
 *     responses:
 *       201:
 *         description: Acción registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Acción registrada correctamente en el historial"
 *                 historial:
 *                   $ref: '#/components/schemas/RegistroHistorialCompleto'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "El campo 'accion' es obligatorio y no puede estar vacío"
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Activo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "No se encontró ningún activo con el ID 999"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al registrar la acción en el historial"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NuevaAccionHistorial:
 *       type: object
 *       required:
 *         - accion
 *       properties:
 *         accion:
 *           type: string
 *           example: "Asignación creada"
 *           description: Tipo de acción realizada (ej. "Asignación", "Modificación", etc.)
 *         detalles:
 *           type: string
 *           example: "Se asignó el activo al usuario Juan Pérez"
 *           nullable: true
 *         fecha:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:00Z"
 *           description: Fecha de la acción (opcional, usa fecha actual si no se proporciona)
 *         usuario_asignado:
 *           type: integer
 *           example: 2
 *           nullable: true
 *           description: ID del usuario asignado (si aplica)
 *         ubicacion_nueva:
 *           type: integer
 *           example: 3
 *           nullable: true
 *           description: ID de la nueva ubicación (si aplica)
 *       example:
 *         accion: "Asignación creada"
 *         detalles: "Se asignó el activo al usuario Juan Pérez"
 *         fecha: "2023-05-15T10:30:00Z"
 *         usuario_asignado: 2
 *         ubicacion_nueva: 3
 *
 *     RegistroHistorialCompleto:
 *       allOf:
 *         - $ref: '#/components/schemas/RegistroHistorial'
 *         - type: object
 *           properties:
 *             usuario_asignado:
 *               type: integer
 *               example: 2
 *               nullable: true
 *             ubicacion_nueva:
 *               type: integer
 *               example: 3
 *               nullable: true
 */
router.post(
	"/activos/:id",
	authenticate,
	historialController.registrarAccionHistorial,
);

/**
 * @swagger
 * /historial/filtros-auxiliares:
 *   get:
 *     tags: [Historial]
 *     summary: Obtener datos auxiliares para filtros de historial
 *     description: Retorna listas de acciones y usuarios disponibles para filtrar el historial
 *     responses:
 *       200:
 *         description: Datos auxiliares obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 acciones:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nombre:
 *                         type: string
 *                         example: "Asignación"
 *                         description: Nombre de la acción registrada en el historial
 *                 usuarios:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                         description: ID del usuario
 *                       nombre:
 *                         type: string
 *                         example: "Juan Pérez"
 *                         description: Nombre del usuario
 *               example:
 *                 acciones:
 *                   - {nombre: "Asignación"}
 *                   - {nombre: "Modificación"}
 *                   - {nombre: "Reparación"}
 *                 usuarios:
 *                   - {id: 1, nombre: "Juan Pérez"}
 *                   - {id: 2, nombre: "María García"}
 *
 *       404:
 *         description: No se encontraron datos auxiliares
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorAccionesNoEncontradas'
 *                 - $ref: '#/components/schemas/ErrorUsuariosNoEncontrados'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorServidor'
 *
 * components:
 *   schemas:
 *     ErrorAccionesNoEncontradas:
 *       type: object
 *       properties:
 *         mensaje:
 *           type: string
 *           example: "No se encontraron acciones"
 *         errorCode:
 *           type: string
 *           example: "HIST_001"
 *
 *     ErrorUsuariosNoEncontrados:
 *       type: object
 *       properties:
 *         mensaje:
 *           type: string
 *           example: "No se encontraron usuarios"
 *         errorCode:
 *           type: string
 *           example: "HIST_002"
 *
 *     ErrorServidor:
 *       type: object
 *       properties:
 *         mensaje:
 *           type: string
 *           example: "Error interno del servidor"
 *         errorCode:
 *           type: string
 *           example: "HIST_500"
 */
router.get(
	"/filtros-auxiliares",
	authenticate,
	historialController.getDatosAuxiliares,
);

module.exports = router;
