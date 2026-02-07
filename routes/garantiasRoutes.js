const express = require("express");
const router = express.Router();
const garantiasController = require("../controllers/garantiasController");
const authenticate = require("../middleware/authenticate");
const checkRole = require("../middleware/checkRole");

/**
 * @swagger
 * tags:
 *   name: Garantías
 *   description: Gestión de garantías de activos
 */

/**
 * @swagger
 * /garantias:
 *   get:
 *     summary: Obtiene listado paginado de garantías
 *     description: |
 *       Devuelve un listado de todas las garantías registradas en el sistema
 *       con información detallada incluyendo:
 *       - Activo asociado
 *       - Proveedor de garantía
 *       - Fechas de vigencia
 *       - Costo y condiciones
 *     tags: [Garantías]
 *     parameters:
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
 *         description: Listado de garantías con metadatos de paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GarantiaDetallada'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   examples:
 *                     paginacionInvalida: "Los parámetros de paginación deben ser números válidos"
 *                     sintaxisError: "Error en la sintaxis de la consulta"
 *       404:
 *         description: Relación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Uno de los valores relacionados no existe en la base de datos"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al obtener las garantías"
 *                 error:
 *                   type: string
 *                   example: "Detalle del error (solo en desarrollo)"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GarantiaDetallada:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         activo:
 *           type: string
 *           example: "Laptop Dell XPS 15"
 *         proveedor_garantia:
 *           type: string
 *           example: "Dell Servicios Premium"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2023-01-15"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *         costo:
 *           type: number
 *           format: float
 *           example: 299.99
 *         condiciones:
 *           type: string
 *           example: "Cobertura total incluye daños accidentales"
 *         estado:
 *           type: string
 *           example: "Vigente"
 *         descripcion:
 *           type: string
 *           example: "Garantía extendida por 3 años"
 *         nombre_garantia:
 *           type: string
 *           example: "Garantía extendida oro"
 *       required:
 *         - id
 *         - activo
 *         - proveedor_garantia
 *         - fecha_inicio
 *         - fecha_fin
 *         - estado
 */
router.get("/", authenticate, garantiasController.getGarantias);

/**
 * @swagger
 * /garantias:
 *   post:
 *     summary: Registra una nueva garantía para un activo
 *     description: |
 *       Crea un nuevo registro de garantía asociado a un activo,
 *       validando todas las relaciones y registrando la acción en el historial.
 *     tags: [Garantías]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevaGarantia'
 *     responses:
 *       201:
 *         description: Garantía creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 activo_id:
 *                   type: integer
 *                   example: 5
 *                 proveedor_garantia_id:
 *                   type: integer
 *                   example: 3
 *                 nombre_garantia:
 *                   type: string
 *                   example: "Garantía extendida oro"
 *                 fecha_inicio:
 *                   type: string
 *                   format: date
 *                   example: "2023-01-15"
 *                 fecha_fin:
 *                   type: string
 *                   format: date
 *                   example: "2026-01-15"
 *                 costo:
 *                   type: number
 *                   format: float
 *                   example: 299.99
 *                 condiciones:
 *                   type: string
 *                   example: "Cobertura total incluye daños accidentales"
 *                 estado:
 *                   type: string
 *                   example: "Vigente"
 *                 descripcion:
 *                   type: string
 *                   example: "Garantía extendida por 3 años adicionales"
 *                 message:
 *                   type: string
 *                   example: "Garantía registrada correctamente"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   examples:
 *                     camposObligatorios: "Todos los campos obligatorios deben estar presentes"
 *                     fechasInvalidas: "El formato de las fechas es inválido"
 *                     fechaFinInvalida: "La fecha de fin debe ser posterior a la fecha de inicio"
 *                     estadoInvalido: "El estado proporcionado no es válido"
 *                     sintaxisError: "Error en la sintaxis de la consulta"
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   examples:
 *                     activoNoExiste: "El activo no existe"
 *                     proveedorNoExiste: "El proveedor de garantía no existe"
 *                     relacionNoExiste: "Uno de los valores relacionados no existe en la base de datos"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al registrar la garantía"
 *                 error:
 *                   type: string
 *                   example: "Detalle del error (solo en desarrollo)"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NuevaGarantia:
 *       type: object
 *       required:
 *         - activo_id
 *         - proveedor_garantia_id
 *         - nombre_garantia
 *         - fecha_inicio
 *         - fecha_fin
 *         - estado
 *       properties:
 *         activo_id:
 *           type: integer
 *           example: 5
 *         proveedor_garantia_id:
 *           type: integer
 *           example: 3
 *         nombre_garantia:
 *           type: string
 *           example: "Garantía extendida oro"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2023-01-15"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *         costo:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 299.99
 *         condiciones:
 *           type: string
 *           nullable: true
 *           example: "Cobertura total incluye daños accidentales"
 *         estado:
 *           type: string
 *           enum: ["Vigente", "Por vencer", "Vencida"]
 *           example: "Vigente"
 *         descripcion:
 *           type: string
 *           nullable: true
 *           example: "Garantía extendida por 3 años adicionales"
 *       example:
 *         activo_id: 5
 *         proveedor_garantia_id: 3
 *         nombre_garantia: "Garantía extendida oro"
 *         fecha_inicio: "2023-01-15"
 *         fecha_fin: "2026-01-15"
 *         costo: 299.99
 *         condiciones: "Cobertura total incluye daños accidentales"
 *         estado: "Vigente"
 *         descripcion: "Garantía extendida por 3 años adicionales"
 */
router.post(
	"/",
	authenticate,
	checkRole("Administrador"),
	garantiasController.createGarantia,
);

/**
 * @swagger
 * /garantias/{id}:
 *   put:
 *     summary: Actualiza una garantía existente
 *     description: |
 *       Actualiza los datos de una garantía existente, validando:
 *       - Estado contra valores permitidos
 *       - Fecha de fin contra fecha actual
 *       - Relaciones con activo y proveedor
 *       Registra la acción en el historial del sistema.
 *     tags: [Garantías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la garantía a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActualizarGarantia'
 *     responses:
 *       200:
 *         description: Garantía actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 activo_id:
 *                   type: integer
 *                   example: 5
 *                 proveedor_garantia_id:
 *                   type: integer
 *                   example: 3
 *                 nombre_garantia:
 *                   type: string
 *                   example: "Garantía extendida platino"
 *                 fecha_inicio:
 *                   type: string
 *                   format: date
 *                   example: "2023-01-15"
 *                 fecha_fin:
 *                   type: string
 *                   format: date
 *                   example: "2027-01-15"
 *                 costo:
 *                   type: number
 *                   format: float
 *                   example: 399.99
 *                 condiciones:
 *                   type: string
 *                   example: "Cobertura premium incluye daños accidentales"
 *                 estado:
 *                   type: string
 *                   example: "Vigente"
 *                 descripcion:
 *                   type: string
 *                   example: "Garantía extendida por 4 años adicionales"
 *                 message:
 *                   type: string
 *                   example: "Garantía actualizada correctamente"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   examples:
 *                     estadoInvalido: "El estado proporcionado no es válido"
 *                     fechaInvalida: "El formato de la fecha de fin es inválido"
 *                     fechaFinPasada: "La fecha de fin debe ser posterior a la fecha actual"
 *                     camposVacios: "No se proporcionaron campos para actualizar"
 *                     sintaxisError: "Error en la sintaxis de la consulta"
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   examples:
 *                     garantiaNoExiste: "La garantía no existe"
 *                     relacionNoExiste: "Uno de los valores relacionados no existe en la base de datos"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al actualizar la garantía"
 *                 error:
 *                   type: string
 *                   example: "Detalle del error (solo en desarrollo)"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ActualizarGarantia:
 *       type: object
 *       properties:
 *         nombre_garantia:
 *           type: string
 *           example: "Garantía extendida platino"
 *         estado:
 *           type: string
 *           enum: ["Vigente", "Por vencer", "Vencida"]
 *           example: "Vigente"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2027-01-15"
 *         descripcion:
 *           type: string
 *           nullable: true
 *           example: "Garantía extendida por 4 años adicionales"
 *         proveedor_garantia_id:
 *           type: integer
 *           example: 3
 *         costo:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 399.99
 *         condiciones:
 *           type: string
 *           nullable: true
 *           example: "Cobertura premium incluye daños accidentales"
 *       example:
 *         nombre_garantia: "Garantía extendida platino"
 *         estado: "Vigente"
 *         fecha_fin: "2027-01-15"
 *         costo: 399.99
 *         condiciones: "Cobertura premium incluye daños accidentales"
 */
router.put(
	"/:id",
	authenticate,
	checkRole("Administrador"),
	garantiasController.updateGarantia,
);

/**
 * @swagger
 * /garantias/{id}:
 *   delete:
 *     summary: Elimina una garantía del sistema
 *     description: |
 *       Elimina permanentemente un registro de garantía.
 *       Nota: Esta acción no puede deshacerse y no verifica dependencias.
 *     tags: [Garantías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la garantía a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Garantía eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Garantía eliminada correctamente"
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Garantía no encontrada (implícito, aunque no se verifique explícitamente)
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al eliminar la garantía"
 *                 error:
 *                   type: string
 *                   example: "Detalle del error (solo en desarrollo)"
 */
router.delete(
	"/:id",
	authenticate,
	checkRole("Administrador"),
	garantiasController.deleteGarantia,
);

module.exports = router;
