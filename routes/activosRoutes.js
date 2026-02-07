const express = require("express");
const router = express.Router();
const activosController = require("../controllers/activosController");
const authenticate = require("../middleware/authenticate"); // Middleware de autenticación
const checkRole = require("../middleware/checkRole"); // Middleware de verificación de roles
const imageUpload = require("../middleware/imageUpload"); //

/**
 * @swagger
 * /gestion-activos/{id}/baja:
 *   patch:
 *     summary: Da de baja un activo (cambia su estado a "Dado de baja")
 *     tags: [Activos]
 *     description: |
 *       - Valida que el activo exista y no esté ya dado de baja.
 *       - Verifica que no tenga asignaciones activas.
 *       - Registra la acción en el historial.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del activo a dar de baja
 *     responses:
 *       200:
 *         description: Activo dado de baja exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Activo "Laptop HP" dado de baja exitosamente.'
 *       400:
 *         description: Error de validación (ya está dado de baja o tiene asignaciones)
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
 *                   example: 'No se puede dar de baja: El activo "Laptop HP" está asignado a 1 usuario(s).'
 *       404:
 *         description: Activo no encontrado
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
 *                   example: 'Activo no encontrado.'
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
 *                   example: 'Error interno al procesar la baja.'
 *                 error:
 *                   type: string
 *                   example: 'Mensaje detallado del error...'
 */

router.patch("/baja/:id", authenticate, activosController.darDeBajaActivo);

/**
 * @swagger
 * tags:
 *   name: Activos
 *   description: Gestión de activos empresariales
 */

/**
 * @swagger
 * /gestion-activos/activos:
 *   get:
 *     summary: Obtiene activos con filtros avanzados
 *     tags: [Activos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados por página
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Ordenamiento (asc o desc)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda general en nombre o ID
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: integer
 *         description: Filtro por ID de tipo de activo
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Disponible, Asignado, En mantenimiento, Dado de baja]
 *         description: Filtro por estado del activo
 *       - in: query
 *         name: ubicacion
 *         schema:
 *           type: integer
 *         description: Filtro por ID de ubicación
 *       - in: query
 *         name: usuario_asignado
 *         schema:
 *           type: integer
 *         description: Filtro por ID de usuario asignado
 *       - in: query
 *         name: licencia_proxima
 *         schema:
 *           type: boolean
 *         description: Filtro para licencias próximas a vencer (true/false)
 *       - in: query
 *         name: garantia_proxima
 *         schema:
 *           type: boolean
 *         description: Filtro para garantías próximas a expirar (true/false)
 *       - in: query
 *         name: fecha_devolucion_proxima
 *         schema:
 *           type: boolean
 *         description: Filtro para activos próximos a devolver (true/false)
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial para rangos (ej. "2023-01-01")
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final para rangos (ej. "2023-12-31")
 *     responses:
 *       200:
 *         description: Lista de activos filtrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivoDetallado'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivoDetallado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *           description: "ID único del activo"
 *         nombre:
 *           type: string
 *           example: "Laptop Dell XPS 15"
 *           description: "Nombre del activo"
 *         tipo_id:
 *           type: integer
 *           example: 2
 *           description: "ID del tipo de activo"
 *         tipo:
 *           type: string
 *           example: "Equipo de computo"
 *           description: "Tipo de activo (ej. Equipo de computo)"
 *         estado:
 *           type: string
 *           enum: [Disponible, Asignado, En mantenimiento, Dado de baja]
 *           example: "Disponible"
 *           description: "Estado actual del activo"
 *         proveedor_id:
 *           type: integer
 *           example: 3
 *           description: "ID del proveedor del activo"
 *         proveedor:
 *           type: string
 *           example: "TecnoSuministros S.A."
 *           description: "Nombre del proveedor del activo"
 *         ubicacion_id:
 *           type: integer
 *           example: 5
 *           description: "ID de la ubicación del activo"
 *         ubicacion:
 *           type: string
 *           example: "Oficina Central - Piso 3"
 *           description: "Ubicación física del activo"
 *         usuario_asignado:
 *           type: string
 *           nullable: true
 *           example: "Juan Pérez"
 *           description: "Usuario al que se le ha asignado el activo"
 *         fecha_adquisicion:
 *           type: string
 *           format: date
 *           example: "2023-05-15"
 *           description: "Fecha en que se adquirió el activo"
 *         valor:
 *           type: number
 *           format: float
 *           example: 1599.99
 *           description: "Valor monetario del activo"
 *         depreciacion:
 *           type: number
 *           format: float
 *           example: 15.5
 *           description: "Depreciación acumulada del activo"
 *         codigo_barras:
 *           type: string
 *           example: "A100023456789"
 *           description: "Código de barras del activo"
 *         garantia:
 *           type: string
 *           example: "12 meses"
 *           description: "Duración de la garantía del activo"
 *         fecha_vencimiento_garantia:
 *           type: string
 *           format: date
 *           example: "2025-06-30"
 *           description: "Fecha de vencimiento de la garantía del activo"
 *         fecha_vencimiento_licencia:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *           description: "Fecha de vencimiento de la licencia del activo"
 *         fecha_devolucion:
 *           type: string
 *           format: date
 *           example: "2024-06-15"
 *           nullable: true
 *           description: "Fecha de devolución programada del activo"
 *         tiene_licencia_proxima:
 *           type: boolean
 *           example: true
 *           description: "Indica si la licencia del activo está próxima a vencer"
 *         tiene_garantia_proxima:
 *           type: boolean
 *           example: false
 *           description: "Indica si la garantía del activo está próxima a expirar"
 *       required:
 *         - id
 *         - nombre
 *         - tipo_id
 *         - estado
 */
router.get("/activos", authenticate, activosController.getActivos);

/**
 * @swagger
 * /gestion-activos/activos/{id}:
 *   get:
 *     summary: Obtiene un activo específico con toda su información detallada
 *     description:
 *       Devuelve información completa del activo incluyendo:
 *       - Datos básicos
 *       - Información de ubicación y responsable
 *       - Detalles de garantías (si existen)
 *       - Datos técnicos y financieros
 *     tags: [Activos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del activo a consultar
 *         example: 123
 *     responses:
 *       200:
 *         description: Detalle completo del activo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActivoCompleto'
 *       400:
 *         description: ID inválido (no numérico o <= 0)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ID inválido"
 *       404:
 *         description: Activo no encontrado
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
 *                   example: "Error al obtener el activo"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivoCompleto:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo_id
 *         - fecha_adquisicion
 *         - valor_compra
 *         - estado
 *         - proveedor_id
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Laptop Dell Precision 5560"
 *           maxLength: 100
 *           description: "Nombre del activo"
 *         tipo_id:
 *           type: integer
 *           example: 2
 *           description: "ID del tipo de activo"
 *         fecha_adquisicion:
 *           type: string
 *           format: date
 *           example: "2023-05-15"
 *           description: "Fecha en que se adquirió el activo"
 *         valor_compra:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 2599.99
 *           description: "Valor monetario al momento de compra"
 *         estado:
 *           type: string
 *           example: "Activo"
 *           description: "Estado actual del activo"
 *         proveedor_id:
 *           type: integer
 *           example: 3
 *           description: "ID del proveedor del activo"
 *         ubicacion_id:
 *           type: integer
 *           nullable: true
 *           example: 5
 *           description: "ID de la ubicación del activo"
 *         foto_url:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: "https://mis-activos.com/fotos/laptop-dell.jpg"
 *           description: "URL de la imagen del activo"
 *         modelo:
 *           type: string
 *           nullable: true
 *           maxLength: 50
 *           example: "Precision 5560"
 *           description: "Modelo del activo"
 *         version_software:
 *           type: string
 *           nullable: true
 *           maxLength: 50
 *           example: "Windows 11 Pro 22H2"
 *           description: "Versión del software instalado"
 *         tipo_licencia:
 *           type: string
 *           nullable: true
 *           maxLength: 30
 *           example: "OEM"
 *           description: "Tipo de licencia asociada al activo"
 *         fecha_vencimiento_licencia:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2025-05-15"
 *           description: "Fecha de vencimiento de la licencia"
 *         costo_mensual:
 *           type: number
 *           format: float
 *           minimum: 0
 *           nullable: true
 *           example: 85.50
 *           description: "Costo mensual promedio del activo"
 *         recursos_asignados:
 *           type: string
 *           nullable: true
 *           maxLength: 200
 *           example: "16GB RAM, 1TB SSD, NVIDIA RTX A2000"
 *           description: "Recursos técnicos asignados al activo"
 *         dueno_id:
 *           type: integer
 *           nullable: true
 *           example: 45
 *           description: "ID del dueño o responsable del activo"
 *         etiqueta_serial:
 *           type: string
 *           nullable: true
 *           maxLength: 50
 *           example: "ASSET-2023-00567"
 *           description: "Etiqueta o código de serial del activo"
 *         condicion_fisica:
 *           type: string
 *           nullable: true
 *           enum: ["Nuevo", "Usado", "Dañado"]
 *           example: "Nuevo"
 *           description: "Condición física del activo"
 *         descripcion:
 *           type: string
 *           nullable: true
 *           maxLength: 500
 *           example: "Laptop workstation para diseño gráfico"
 *           description: "Descripción breve del activo"
 *         # Campos opcionales para garantía
 *         nombre_garantia:
 *           type: string
 *           nullable: true
 *           maxLength: 100
 *           example: "Garantía extendida oro"
 *           description: "Nombre de la garantía"
 *         proveedor_garantia_id:
 *           type: integer
 *           nullable: true
 *           example: 8
 *           description: "ID del proveedor de la garantía"
 *         fecha_inicio_garantia:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2023-05-15"
 *           description: "Fecha de inicio de la garantía"
 *         fecha_fin_garantia:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2026-05-15"
 *           description: "Fecha de finalización de la garantía"
 *         costo:
 *           type: number
 *           format: float
 *           minimum: 0
 *           nullable: true
 *           example: 299.99
 *           description: "Costo asociado a la garantía"
 *         condiciones:
 *           type: string
 *           nullable: true
 *           maxLength: 500
 *           example: "Cobertura total incluye daños accidentales"
 *           description: "Condiciones de la garantía"
 *         estado_garantia:
 *           type: string
 *           nullable: true
 *           example: "Vigente"
 *           description: "Estado actual de la garantía"
 *         descripcion_garantia:
 *           type: string
 *           nullable: true
 *           maxLength: 500
 *           example: "Garantía extendida por 3 años adicionales"
 *           description: "Descripción de la garantía"
 *       example:
 *         nombre: "Laptop Dell Precision 5560"
 *         tipo_id: 2
 *         fecha_adquisicion: "2023-05-15"
 *         valor_compra: 2599.99
 *         estado: "Activo"
 *         proveedor_id: 3
 *         ubicacion_id: 5
 *         modelo: "Precision 5560"
 *         version_software: "Windows 11 Pro 22H2"
 *         recursos_asignados: "16GB RAM, 1TB SSD, NVIDIA RTX A2000"
 *         dueno_id: 45
 *         etiqueta_serial: "ASSET-2023-00567"
 *         condicion_fisica: "Nuevo"
 *         descripcion: "Laptop workstation para diseño gráfico"
 *         nombre_garantia: "Garantía extendida oro"
 *         proveedor_garantia_id: 8
 *         fecha_inicio_garantia: "2023-05-15"
 *         fecha_fin_garantia: "2026-05-15"
 *         costo: 299.99
 *         condiciones: "Cobertura total incluye daños accidentales"
 *         estado_garantia: "Vigente"
 *         descripcion_garantia: "Garantía extendida por 3 años adicionales"
 */

router.get("/activos/:id", authenticate, activosController.getActivoById);

/**
 * @swagger
 * /gestion-activos/activos:
 *   post:
 *     summary: Crea un nuevo activo con información detallada
 *     description: |
 *       Crea un nuevo activo en el sistema con todos sus datos básicos y opcionalmente
 *       puede incluir información de garantía. Valida todos los campos requeridos
 *       y formatos antes de realizar la inserción.
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevoActivo'
 *     responses:
 *       201:
 *         description: Activo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 123
 *                 message:
 *                   type: string
 *                   example: "Activo creado exitosamente"
 *       400:
 *         description: Error de validación en los datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     camposObligatorios: "Faltan datos obligatorios del activo"
 *                     valorCompraInvalido: "El valor de compra debe ser un número positivo"
 *                     fechaInvalida: "La fecha de adquisición no es válida"
 *                     serialDuplicado: "La etiqueta serial ya está registrada"
 *                     garantiaIncompleta: "Datos incompletos para la garantía"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al crear el activo"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NuevoActivo:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo_id
 *         - fecha_adquisicion
 *         - valor_compra
 *         - estado
 *         - proveedor_id
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Laptop Dell Precision 5560"
 *           maxLength: 100
 *         tipo_id:
 *           type: integer
 *           example: 2
 *         fecha_adquisicion:
 *           type: string
 *           format: date
 *           example: "2023-05-15"
 *         valor_compra:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 2599.99
 *         estado:
 *           type: string
 *           example: "Activo"
 *         proveedor_id:
 *           type: integer
 *           example: 3
 *         ubicacion_id:
 *           type: integer
 *           nullable: true
 *           example: 5
 *         foto_url:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: "https://mis-activos.com/fotos/laptop-dell.jpg"
 *         modelo:
 *           type: string
 *           nullable: true
 *           maxLength: 50
 *           example: "Precision 5560"
 *         version_software:
 *           type: string
 *           nullable: true
 *           maxLength: 50
 *           example: "Windows 11 Pro 22H2"
 *         tipo_licencia:
 *           type: string
 *           nullable: true
 *           maxLength: 30
 *           example: "OEM"
 *         fecha_vencimiento_licencia:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2025-05-15"
 *         costo_mensual:
 *           type: number
 *           format: float
 *           minimum: 0
 *           nullable: true
 *           example: 85.50
 *         recursos_asignados:
 *           type: string
 *           nullable: true
 *           maxLength: 200
 *           example: "16GB RAM, 1TB SSD, NVIDIA RTX A2000"
 *         dueno_id:
 *           type: integer
 *           nullable: true
 *           example: 45
 *         etiqueta_serial:
 *           type: string
 *           nullable: true
 *           maxLength: 50
 *           example: "ASSET-2023-00567"
 *         condicion_fisica:
 *           type: string
 *           nullable: true
 *           enum: ["Nuevo", "Usado", "Dañado"]
 *           example: "Nuevo"
 *         descripcion:
 *           type: string
 *           nullable: true
 *           maxLength: 500
 *           example: "Laptop workstation para diseño gráfico"
 *         # Campos opcionales para garantía
 *         nombre_garantia:
 *           type: string
 *           nullable: true
 *           maxLength: 100
 *           example: "Garantía extendida oro"
 *         proveedor_garantia_id:
 *           type: integer
 *           nullable: true
 *           example: 8
 *         fecha_inicio_garantia:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2023-05-15"
 *         fecha_fin_garantia:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2026-05-15"
 *         costo:
 *           type: number
 *           format: float
 *           minimum: 0
 *           nullable: true
 *           example: 299.99
 *         condiciones:
 *           type: string
 *           nullable: true
 *           maxLength: 500
 *           example: "Cobertura total incluye daños accidentales"
 *         estado_garantia:
 *           type: string
 *           nullable: true
 *           example: "Vigente"
 *         descripcion_garantia:
 *           type: string
 *           nullable: true
 *           maxLength: 500
 *           example: "Garantía extendida por 3 años adicionales"
 *       example:
 *         nombre: "Laptop Dell Precision 5560"
 *         tipo_id: 2
 *         fecha_adquisicion: "2023-05-15"
 *         valor_compra: 2599.99
 *         estado: "Activo"
 *         proveedor_id: 3
 *         ubicacion_id: 5
 *         modelo: "Precision 5560"
 *         version_software: "Windows 11 Pro 22H2"
 *         recursos_asignados: "16GB RAM, 1TB SSD, NVIDIA RTX A2000"
 *         dueno_id: 45
 *         etiqueta_serial: "ASSET-2023-00567"
 *         condicion_fisica: "Nuevo"
 *         descripcion: "Laptop workstation para diseño gráfico"
 *         nombre_garantia: "Garantía extendida oro"
 *         proveedor_garantia_id: 8
 *         fecha_inicio_garantia: "2023-05-15"
 *         fecha_fin_garantia: "2026-05-15"
 *         costo: 299.99
 *         condiciones: "Cobertura total incluye daños accidentales"
 */

router.post(
	"/activos",
	authenticate,
	checkRole("Administrador"),
	activosController.createActivo,
);

/**
 * @swagger
 * /gestion-activos/activos/{id}:
 *   put:
 *     summary: Actualiza un activo existente con información detallada
 *     description: |
 *       Actualiza un activo existente y su garantía asociada (si se proporciona).
 *       Registra todos los cambios en el historial y valida relaciones con otras tablas.
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del activo a actualizar
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActualizarActivo'
 *     responses:
 *       200:
 *         description: Activo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activo actualizado exitosamente"
 *                 cambios:
 *                   type: string
 *                   example: "Nombre actualizado de 'Laptop vieja' a 'Laptop nueva'. Garantía: proveedor cambiado de 'Proveedor A' a 'Proveedor B'"
 *                 activo:
 *                   $ref: '#/components/schemas/ActivoCompleto'
 *                 garantia:
 *                   $ref: '#/components/schemas/Garantia'
 *       400:
 *         description: Error de validación en los datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     valorInvalido: "El valor de compra debe ser un número positivo"
 *                     fechaInvalida: "La fecha de adquisición no es válida"
 *                     serialDuplicado: "La etiqueta serial ya está registrada"
 *                     relacionInvalida: "El tipo de activo no existe"
 *                     sinCambios: "No se proporcionaron datos para actualizar"
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Activo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "El activo no existe"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al actualizar el activo"
 *                 detalle:
 *                   type: string
 *                   example: "Descripción detallada del error (solo en desarrollo)"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ActualizarActivo:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Laptop Dell Precision 5560"
 *           maxLength: 100
 *         tipo_id:
 *           type: integer
 *           example: 2
 *         fecha_adquisicion:
 *           type: string
 *           format: date
 *           example: "2023-05-15"
 *         fecha_registro:
 *           type: string
 *           format: date-time
 *           example: "2023-05-16T08:30:00Z"
 *         fecha_salida:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: null
 *         valor_compra:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 2599.99
 *         etiqueta_serial:
 *           type: string
 *           maxLength: 50
 *           example: "ASSET-2023-00567"
 *         descripcion:
 *           type: string
 *           maxLength: 500
 *           example: "Laptop workstation para diseño gráfico"
 *         estado:
 *           type: string
 *           example: "Activo"
 *         proveedor_id:
 *           type: integer
 *           example: 3
 *         ubicacion_id:
 *           type: integer
 *           example: 5
 *         foto_url:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: "https://mis-activos.com/fotos/laptop-dell.jpg"
 *         modelo:
 *           type: string
 *           maxLength: 50
 *           example: "Precision 5560"
 *         version_software:
 *           type: string
 *           maxLength: 50
 *           example: "Windows 11 Pro 22H2"
 *         tipo_licencia:
 *           type: string
 *           maxLength: 30
 *           example: "OEM"
 *         fecha_vencimiento_licencia:
 *           type: string
 *           format: date
 *           example: "2025-05-15"
 *         costo_mensual:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 85.50
 *         recursos_asignados:
 *           type: string
 *           maxLength: 200
 *           example: "16GB RAM, 1TB SSD, NVIDIA RTX A2000"
 *         dueno_id:
 *           type: integer
 *           example: 45
 *         # Campos opcionales para garantía
 *         nombre_garantia:
 *           type: string
 *           maxLength: 100
 *           example: "Garantía extendida oro"
 *         proveedor_garantia_id:
 *           type: integer
 *           example: 8
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2023-05-15"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2026-05-15"
 *         estado_garantia:
 *           type: string
 *           example: "Vigente"
 *         descripcion_garantia:
 *           type: string
 *           maxLength: 500
 *           example: "Garantía extendida por 3 años adicionales"
 *         costo:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 299.99
 *         condiciones:
 *           type: string
 *           maxLength: 500
 *           example: "Cobertura total incluye daños accidentales"
 *       example:
 *         nombre: "Laptop Dell Precision 5560 (Actualizada)"
 *         valor_compra: 2799.99
 *         estado: "En mantenimiento"
 *         ubicacion_id: 6
 *         descripcion: "Actualización: ahora con 32GB RAM"
 *         nombre_garantia: "Garantía extendida platino"
 *         fecha_fin: "2027-05-15"
 *         costo: 399.99
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Garantia:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Garantía extendida platino"
 *           description: "Nombre descriptivo de la garantía"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2027-05-15"
 *           description: "Fecha de vencimiento de la garantía (YYYY-MM-DD)"
 *         estado:
 *           type: string
 *           example: "Vigente"
 *           enum: [Vigente, Vencida, Cancelada]
 *           description: "Estado actual de la garantía"
 *       required:
 *         - nombre
 *         - fecha_fin
 *         - estado
 */

router.put(
	"/activos/:id",
	authenticate,
	checkRole("Administrador"),
	activosController.updateActivo,
);

/**
 * @swagger
 * /gestion-activos/activos/{id}:
 *   delete:
 *     summary: Elimina un activo del sistema
 *     description: |
 *       Elimina un activo siempre que no tenga asignaciones o garantías asociadas.
 *       Realiza validaciones previas para evitar eliminaciones inconsistentes.
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del activo a eliminar
 *         example: 123
 *     responses:
 *       200:
 *         description: Activo eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activo eliminado exitosamente"
 *       400:
 *         description: No se puede eliminar por dependencias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     asignaciones: "No se puede eliminar el activo porque tiene asignaciones asociadas"
 *                     garantias: "No se puede eliminar el activo porque tiene garantías asociadas"
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Activo no encontrado
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
 *                   example: "Error al eliminar el activo"
 */
router.delete(
	"/activos/:id",
	authenticate,
	checkRole("Administrador"),
	activosController.deleteActivo,
);

/**
 * @swagger
 * /gestion-activos/datos-auxiliares:
 *   get:
 *     summary: Obtiene datos auxiliares para formularios de activos
 *     description: |
 *       Proporciona listados de referencia necesarios para formularios:
 *       - Tipos de activos
 *       - Proveedores
 *       - Ubicaciones
 *       - Proveedores de garantía
 *       - Usuarios (dueños)
 *       - Estados predefinidos
 *     tags: [Activos]
 *     responses:
 *       200:
 *         description: Listados de datos auxiliares
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatosAuxiliares'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Error interno del servidor"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DatosAuxiliares:
 *       type: object
 *       properties:
 *         tipos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Equipo de cómputo"
 *         proveedores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "TecnoSuministros S.A."
 *         ubicaciones:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Oficina Central - Piso 3"
 *         proveedoresGarantia:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Dell Servicios Premium"
 *         duenos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *         estados:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "Disponible"
 *               nombre:
 *                 type: string
 *                 example: "Disponible"
 *       example:
 *         tipos:
 *           - id: 1
 *             nombre: "Equipo de cómputo"
 *           - id: 2
 *             nombre: "Mobiliario"
 *         proveedores:
 *           - id: 1
 *             nombre: "TecnoSuministros S.A."
 *           - id: 2
 *             nombre: "Muebles y Más"
 *         ubicaciones:
 *           - id: 1
 *             nombre: "Oficina Central - Piso 3"
 *           - id: 2
 *             nombre: "Sucursal Norte"
 *         proveedoresGarantia:
 *           - id: 1
 *             nombre: "Dell Servicios Premium"
 *           - id: 2
 *             nombre: "Garantías Total"
 *         duenos:
 *           - id: 1
 *             nombre: "Juan Pérez"
 *           - id: 2
 *             nombre: "María González"
 *         estados:
 *           - id: "Disponible"
 *             nombre: "Disponible"
 *           - id: "Asignado"
 *             nombre: "Asignado"
 */
router.get(
	"/datos-auxiliares",
	authenticate,
	activosController.obtenerDatosAuxiliares,
);

/**
 * @swagger
 * /gestion-activos/validar-serial:
 *   post:
 *     summary: Valida la disponibilidad de una etiqueta serial
 *     description: |
 *       Verifica si una etiqueta serial ya está registrada en el sistema.
 *       Útil para validar antes de crear o actualizar un activo.
 *     tags: [Activos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - etiqueta_serial
 *             properties:
 *               etiqueta_serial:
 *                 type: string
 *                 description: Código único de identificación del activo
 *                 example: "ASSET-2023-001"
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Etiqueta serial disponible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "La etiqueta serial está disponible"
 *       400:
 *         description: Etiqueta serial ya registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "La etiqueta serial ya está registrada"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al validar la etiqueta serial"
 */

router.post(
	"/validar-etiqueta-serial",
	authenticate,
	activosController.validarEtiquetaSerial,
);

/**
 * @swagger
 * /gestion-activos/upload:
 *   post:
 *     summary: Sube una imagen para asociar a un activo
 *     description: |
 *       Sube un archivo de imagen (JPEG, PNG, etc.) al servidor y devuelve su URL relativa.
 *       - Requiere autenticación JWT.
 *       - Tamaño máximo: 5MB.
 *       - Guarda la imagen en `/assets/images/`.
 *     tags: [Activos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen a subir (max 5MB)
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "/assets/images/1717832123.jpg"
 *                   description: URL relativa de la imagen guardada
 *       400:
 *         description: Error en la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No se recibió ninguna imagen."
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al subir la imagen"
 */

router.post(
	"/upload",
	authenticate,
	imageUpload.imageUploadMiddleware,
	activosController.uploadImage,
);

module.exports = router;
