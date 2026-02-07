const express = require("express");
const router = express.Router();
const asignacionesController = require("../controllers/asignacionesController");
const authenticate = require("../middleware/authenticate");
const checkRole = require("../middleware/checkRole"); // Middleware de verificación de roles

/**
 * @swagger
 * tags:
 *   name: Asignaciones
 *   description: Gestión de asignaciones de activos a usuarios
 */

/**
 * @swagger
 * /asignaciones:
 *   get:
 *     summary: Obtiene listado paginado de asignaciones con filtros
 *     description: |
 *       Devuelve un listado de asignaciones con capacidad de:
 *       - Paginación
 *       - Ordenamiento
 *       - Filtrado por búsqueda general, tipo de activo, ubicación o usuario
 *     tags: [Asignaciones]
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
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Dirección de ordenamiento (asc/desc)
 *         example: asc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda general en ID o nombre de activo
 *         example: "Laptop"
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: integer
 *         description: ID del tipo de activo para filtrar
 *         example: 2
 *       - in: query
 *         name: ubicacion
 *         schema:
 *           type: integer
 *         description: ID de ubicación para filtrar
 *         example: 3
 *       - in: query
 *         name: usuario_asignado
 *         schema:
 *           type: integer
 *         description: ID de usuario asignado para filtrar
 *         example: 5
 *     responses:
 *       200:
 *         description: Listado de asignaciones con metadatos de paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AsignacionDetallada'
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
 *                       example: 45
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al obtener las asignaciones"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AsignacionDetallada:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         activo:
 *           type: string
 *           example: "Laptop Dell XPS 15"
 *         tipo_activo:
 *           type: string
 *           example: "Equipo de cómputo"
 *         estado_activo:
 *           type: string
 *           example: "Asignado"
 *         usuario:
 *           type: string
 *           example: "Juan Pérez"
 *         ubicacion:
 *           type: string
 *           example: "Oficina Central - Piso 3"
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:00Z"
 *         fecha_devolucion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         comentarios:
 *           type: string
 *           nullable: true
 *           example: "Asignado para trabajo remoto"
 *       required:
 *         - id
 *         - activo
 *         - usuario
 *         - fecha_asignacion
 */
router.get(
	"/activos-disponibles",
	authenticate,
	asignacionesController.getActivosDisponibles,
);

/**
 * @swagger
 * /api/activos/datos-auxiliares/{id}:
 *   get:
 *     tags: [Asignaciones]
 *     summary: Obtener datos auxiliares para gestión de activos
 *     description: Retorna los datos de referencia necesarios para formularios de activos (usuarios, tipos, proveedores, ubicaciones) y opcionalmente el nombre de un activo específico
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID del activo (opcional) para obtener su nombre
 *     responses:
 *       200:
 *         description: Datos auxiliares obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuarios:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nombre:
 *                         type: string
 *                         example: "Juan Pérez"
 *                 tiposActivos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nombre:
 *                         type: string
 *                         example: "Laptop"
 *                 proveedores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nombre:
 *                         type: string
 *                         example: "Dell Technologies"
 *                 ubicaciones:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nombre:
 *                         type: string
 *                         example: "Oficina Central"
 *                 nombreActivo:
 *                   type: string
 *                   nullable: true
 *                   example: "Laptop Dell XPS 15"
 *               example:
 *                 usuarios:
 *                   - {id: 1, nombre: "Juan Pérez"}
 *                   - {id: 2, nombre: "María García"}
 *                 tiposActivos:
 *                   - {id: 1, nombre: "Laptop"}
 *                   - {id: 2, nombre: "Teléfono"}
 *                 proveedores:
 *                   - {id: 1, nombre: "Dell Technologies"}
 *                   - {id: 2, nombre: "HP Inc."}
 *                 ubicaciones:
 *                   - {id: 1, nombre: "Oficina Central"}
 *                   - {id: 2, nombre: "Sucursal Norte"}
 *                 nombreActivo: "Laptop Dell XPS 15"
 *       400:
 *         description: ID de activo inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "El ID proporcionado no es válido"
 *       404:
 *         description: Activo no encontrado (cuando se proporciona ID)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Activo no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al obtener los usuarios"
 */

/**
 *  @swagger
 * components:
 *   schemas:
 *     DatosAuxiliaresResponse:
 *       type: object
 *       properties:
 *         usuarios:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Usuario'
 *         tiposActivos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TipoActivo'
 *         proveedores:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Proveedor'
 *         ubicaciones:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Ubicacion'
 *         nombreActivo:
 *           type: string
 *           nullable: true
 *           example: "Laptop Dell XPS 15"
 *       example:
 *         usuarios:
 *           - id: 1
 *             nombre: "Juan Pérez"
 *           - id: 2
 *             nombre: "María García"
 *         tiposActivos:
 *           - id: 1
 *             nombre: "Laptop"
 *           - id: 2
 *             nombre: "Teléfono"
 *         proveedores:
 *           - id: 1
 *             nombre: "Dell Technologies"
 *           - id: 2
 *             nombre: "HP Inc."
 *         ubicaciones:
 *           - id: 1
 *             nombre: "Oficina Central"
 *           - id: 2
 *             nombre: "Sucursal Norte"
 *         nombreActivo: "Laptop Dell XPS 15"
 *
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Juan Pérez"
 *
 *     TipoActivo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Laptop"
 *
 *     Proveedor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Dell Technologies"
 *
 *     Ubicacion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Oficina Central"
 *
 *     ErrorValidacion:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "El ID proporcionado no es válido"
 *
 *     ErrorNoEncontrado:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Activo no encontrado"
 *
 *     ErrorBaseDatos:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Error al obtener los usuarios"
 *
 *     ErrorServidor:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Error interno del servidor"
 */
router.get(
	"/datos-auxiliares/:id",
	authenticate,
	asignacionesController.obtenerDatosAuxiliares,
);

/**
 * @swagger
 * /asignaciones/{id}:
 *   get:
 *     summary: Obtiene una asignación específica por su ID
 *     description: |
 *       Devuelve los detalles completos de una asignación incluyendo:
 *       - Información del activo asignado
 *       - Datos del usuario asignado
 *       - Ubicación de la asignación
 *       - Fechas y comentarios
 *     tags: [Asignaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la asignación a consultar
 *         example: 1
 *     responses:
 *       200:
 *         description: Detalles completos de la asignación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 asignacion:
 *                   $ref: '#/components/schemas/AsignacionCompleta'
 *                 message:
 *                   type: string
 *                   example: "Asignación obtenida correctamente"
 *       400:
 *         description: Error de relación (clave foránea inválida)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Uno de los valores relacionados no existe en la base de datos"
 *       404:
 *         description: Asignación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "La asignación no existe"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al obtener la asignación"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AsignacionCompleta:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         activo_id:
 *           type: integer
 *           example: 5
 *         activo_nombre:
 *           type: string
 *           example: "Laptop Dell XPS 15"
 *         usuario_id:
 *           type: integer
 *           example: 3
 *         usuario_nombre:
 *           type: string
 *           example: "Juan Pérez"
 *         ubicacion_id:
 *           type: integer
 *           example: 2
 *         ubicacion_nombre:
 *           type: string
 *           example: "Oficina Central - Piso 3"
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:00Z"
 *         fecha_devolucion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         comentarios:
 *           type: string
 *           nullable: true
 *           example: "Asignado para trabajo remoto"
 *       required:
 *         - id
 *         - activo_id
 *         - usuario_id
 *         - ubicacion_id
 *         - fecha_asignacion
 */
router.get("/:id", authenticate, asignacionesController.getAsignacionPorId);

/**
 * @swagger
 * /asignaciones:
 *   get:
 *     summary: Obtiene un listado paginado de asignaciones con filtros
 *     description: |
 *       Retorna un listado de asignaciones con capacidad de:
 *       - Paginación
 *       - Ordenamiento
 *       - Filtrado por búsqueda general, tipo de activo, ubicación o usuario
 *     tags: [Asignaciones]
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
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Dirección de ordenamiento (asc/desc)
 *         example: asc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda general en ID o nombre de activo
 *         example: "Laptop"
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: integer
 *         description: ID del tipo de activo para filtrar
 *         example: 2
 *       - in: query
 *         name: ubicacion
 *         schema:
 *           type: integer
 *         description: ID de ubicación para filtrar
 *         example: 3
 *       - in: query
 *         name: usuario_asignado
 *         schema:
 *           type: integer
 *         description: ID de usuario asignado para filtrar
 *         example: 5
 *     responses:
 *       200:
 *         description: Listado de asignaciones con metadatos de paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AsignacionResumen'
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
 *                       example: 45
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al obtener las asignaciones"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AsignacionResumen:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         activo:
 *           type: string
 *           example: "Laptop Dell XPS 15"
 *         tipo_activo:
 *           type: string
 *           example: "Equipo de cómputo"
 *         estado_activo:
 *           type: string
 *           example: "Asignado"
 *         usuario:
 *           type: string
 *           example: "Juan Pérez"
 *         ubicacion:
 *           type: string
 *           example: "Oficina Central - Piso 3"
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:00Z"
 *         fecha_devolucion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         comentarios:
 *           type: string
 *           nullable: true
 *           example: "Asignado para trabajo remoto"
 *       required:
 *         - id
 *         - activo
 *         - usuario
 *         - fecha_asignacion
 */
router.get("/", authenticate, asignacionesController.getAsignaciones);

/**
 * @swagger
 * /asignaciones:
 *   post:
 *     summary: Crea una nueva asignación de activo
 *     description: |
 *       Crea una nueva asignación de activo a usuario, actualizando el estado del activo
 *       y registrando la acción en el historial. Valida todas las relaciones antes de crear.
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevaAsignacion'
 *     responses:
 *       201:
 *         description: Asignación creada exitosamente
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
 *                 usuario_id:
 *                   type: integer
 *                   example: 3
 *                 ubicacion_id:
 *                   type: integer
 *                   example: 2
 *                 fecha_asignacion:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-05-15T10:30:00Z"
 *                 fecha_devolucion:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *                 comentarios:
 *                   type: string
 *                   example: "Activo 'Laptop Dell' asignado al usuario 'Juan Pérez' en la ubicación 'Oficina Central'"
 *                 message:
 *                   type: string
 *                   example: "Asignación creada correctamente"
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
 *                     camposObligatorios: "Todos los campos son obligatorios"
 *                     fechaInvalida: "El formato de la fecha de asignación es inválido"
 *                     asignacionExistente: "Esta asignación ya existe"
 *                     relacionInvalida: "Uno de los valores proporcionados no existe en la base de datos"
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
 *                     usuarioNoExiste: "El usuario no existe"
 *                     ubicacionNoExiste: "La ubicación no existe"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al crear la asignación"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NuevaAsignacion:
 *       type: object
 *       required:
 *         - activo_id
 *         - usuario_id
 *         - ubicacion_id
 *         - fecha_asignacion
 *       properties:
 *         activo_id:
 *           type: integer
 *           example: 5
 *         usuario_id:
 *           type: integer
 *           example: 3
 *         ubicacion_id:
 *           type: integer
 *           example: 2
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:00Z"
 *         fecha_devolucion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *       example:
 *         activo_id: 5
 *         usuario_id: 3
 *         ubicacion_id: 2
 *         fecha_asignacion: "2023-05-15T10:30:00Z"
 */
router.post(
	"/",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.createAsignacion,
);

/**
 * @swagger
 * /asignaciones/{id}:
 *   put:
 *     summary: Actualiza una asignación existente
 *     description: |
 *       Actualiza los datos de una asignación existente, incluyendo:
 *       - Fecha de devolución
 *       - Usuario asignado
 *       - Ubicación
 *       Registra todos los cambios en el historial.
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la asignación a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActualizarAsignacion'
 *     responses:
 *       200:
 *         description: Asignación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 fecha_devolucion:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2023-06-15T10:30:00Z"
 *                 usuario_id:
 *                   type: integer
 *                   example: 3
 *                 ubicacion_id:
 *                   type: integer
 *                   example: 2
 *                 comentarios:
 *                   type: string
 *                   example: "Activo 'Laptop Dell' asignado al usuario 'Juan Pérez' en la ubicación 'Oficina Central'"
 *                 message:
 *                   type: string
 *                   example: "Asignación actualizada correctamente"
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
 *                     fechaInvalida: "El formato de la fecha de devolución es inválido"
 *                     asignacionExistente: "Esta asignación ya existe"
 *                     relacionInvalida: "Uno de los valores proporcionados no existe en la base de datos"
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
 *                     asignacionNoExiste: "La asignación no existe"
 *                     usuarioNoExiste: "El nuevo usuario no existe"
 *                     ubicacionNoExiste: "La nueva ubicación no existe"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error al actualizar la asignación"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ActualizarAsignacion:
 *       type: object
 *       properties:
 *         fecha_devolucion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2023-06-15T10:30:00Z"
 *         usuario_id:
 *           type: integer
 *           example: 3
 *         ubicacion_id:
 *           type: integer
 *           example: 2
 *       example:
 *         fecha_devolucion: "2023-06-15T10:30:00Z"
 *         usuario_id: 4
 *         ubicacion_id: 3
 */
router.put(
	"/:id",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.updateAsignacion,
);

/**
 * @swagger
 * /asignaciones/{id}:
 *   delete:
 *     summary: Elimina una asignación existente y libera el activo asociado
 *     description: |
 *       Elimina una asignación específica del sistema y actualiza el estado del activo asociado a "Disponible".
 *       - Si el activo asociado tiene garantías o licencias vigentes, estas no se ven afectadas.
 *       - Esta operación verifica que la asignación exista antes de proceder.
 *       - La acción se registra automáticamente en el historial del sistema para auditoría.
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la asignación a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Asignación eliminada exitosamente y activo liberado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asignación eliminada y activo liberado correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_asignacion_eliminada:
 *                       type: integer
 *                       example: 1
 *                     nombre_activo:
 *                       type: string
 *                       example: "Laptop Dell XPS 13"
 *
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No autorizado"
 *       404:
 *         description: Asignación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Asignación no encontrada"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor"
 */

router.delete(
	"/:id",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.deleteAsignacion,
);

module.exports = router;
