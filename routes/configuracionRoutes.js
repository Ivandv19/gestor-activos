const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const authenticate = require('../middleware/authenticate'); 
const imageUpload = require('../middleware/imageUpload'); // 


/**
 * @swagger
 * tags:
 *   name: Configuración
 *   description: Configuración global de la aplicación
 */

/**
 * @swagger
 * /configuracion:
 *   get:
 *     summary: Obtiene la configuración global de la aplicación
 *     description: |
 *       Devuelve la configuración almacenada en el archivo globalConfig.json.
 *       Los datos se cachean después de la primera lectura para mejorar el rendimiento.
 *     tags: [Configuración]
 *     responses:
 *       200:
 *         description: Configuración obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 # Ejemplo de estructura genérica (ajustar según tu archivo real)
 *                 appName:
 *                   type: string
 *                   example: "Sistema de Gestión de Activos"
 *                 maxLoginAttempts:
 *                   type: integer
 *                   example: 5
 *                 sessionTimeout:
 *                   type: integer
 *                   example: 3600
 *                 # Agregar aquí todas las propiedades de tu configuración
 *               example:
 *                 appName: "Sistema de Gestión de Activos"
 *                 maxLoginAttempts: 5
 *                 sessionTimeout: 3600
 *                 theme: "light"
 *                 language: "es"
 *       404:
 *         description: Archivo de configuración no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "El archivo de configuración no fue encontrado"
 *                 error:
 *                   type: string
 *                   example: "ENOENT: no such file or directory..."
 *       500:
 *         description: Error al leer o parsear la configuración
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     parseError: "El archivo de configuración no es un JSON válido"
 *                     genericError: "Error al obtener la configuración global"
 *                 error:
 *                   type: string
 *                   example: "Detalle del error (solo en desarrollo)"
 */
router.get(
  '/aplicacion',
  authenticate,
  configuracionController.getConfiguracionAplicacion
);

/**
 * @swagger
 * /configuracion:
 *   put:
 *     summary: Actualiza la configuración global de la aplicación
 *     description: |
 *       Actualiza los parámetros de configuración del sistema y crea un backup
 *       automático del archivo de configuración anterior.
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActualizarConfiguracion'
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Configuración global actualizada correctamente"
 *                 nuevaConfiguracion:
 *                   type: object
 *                   properties:
 *                     idioma:
 *                       type: string
 *                       example: "es"
 *                     zona_horaria:
 *                       type: string
 *                       example: "UTC-5"
 *                     formato_fecha:
 *                       type: string
 *                       example: "DD/MM/YYYY"
 *                     formato_moneda:
 *                       type: string
 *                       example: "$0,0.00"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     camposObligatorios: "Todos los campos son obligatorios"
 *                     idiomaInvalido: "Idioma no válido"
 *                     zonaHorariaInvalida: "Zona horaria no válida"
 *       404:
 *         description: Archivo de configuración no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "El archivo de configuración no fue encontrado"
 *                 error:
 *                   type: string
 *                   example: "ENOENT: no such file or directory..."
 *       500:
 *         description: Error al procesar la configuración
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     parseError: "El archivo de configuración no es un JSON válido"
 *                     writeError: "Error al escribir el archivo de configuración"
 *                     genericError: "Error al actualizar la configuración global"
 *                 error:
 *                   type: string
 *                   example: "Detalle del error (solo en desarrollo)"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ActualizarConfiguracion:
 *       type: object
 *       required:
 *         - idioma
 *         - zona_horaria
 *         - formato_fecha
 *         - formato_moneda
 *       properties:
 *         idioma:
 *           type: string
 *           enum: ["es", "en", "fr"]
 *           example: "es"
 *           description: Código de idioma del sistema
 *         zona_horaria:
 *           type: string
 *           enum: ["UTC-5", "UTC+1", "UTC+2"]
 *           example: "UTC-5"
 *           description: Zona horaria del sistema
 *         formato_fecha:
 *           type: string
 *           example: "DD/MM/YYYY"
 *           description: Formato de visualización de fechas
 *         formato_moneda:
 *           type: string
 *           example: "$0,0.00"
 *           description: Formato de visualización de montos monetarios
 *       example:
 *         idioma: "es"
 *         zona_horaria: "UTC-5"
 *         formato_fecha: "DD/MM/YYYY"
 *         formato_moneda: "$0,0.00"
 */
router.put(
  '/aplicacion',
  authenticate,
  configuracionController.updateConfiguracionAplicacion
);


/**
 * @swagger
 * /configuracion/perfil:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     description: |
 *       Devuelve la información del perfil del usuario actualmente autenticado,
 *       incluyendo nombre, email, departamento y URL de foto.
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerfilUsuario'
 *       400:
 *         description: ID de usuario inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID de usuario no proporcionado o inválido"
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario no encontrado"
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     campoInvalido: "Error en la consulta: campo inválido"
 *                     errorGenerico: "Error al obtener el perfil del usuario"
 *                 error:
 *                   type: string
 *                   example: "Detalle del error (solo en desarrollo)"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PerfilUsuario:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           format: email
 *           example: "juan.perez@empresa.com"
 *         departamento:
 *           type: string
 *           example: "Ventas"
 *         foto_url:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: "https://ejemplo.com/fotos/juan-perez.jpg"
 *       required:
 *         - nombre
 *         - email
 *         - departamento
 */
router.get('/perfil', authenticate, configuracionController.getPerfilUsuario);

/**
 * @swagger
 * /configuracion/perfil:
 *   put:
 *     summary: Actualiza el perfil del usuario autenticado
 *     description: |
 *       Permite actualizar datos del perfil (nombre, email, departamento, contraseña o foto).
 *       Requiere validación de contraseña actual para cualquier cambio.
 *       - La foto debe ser JPEG, PNG o GIF (max 5MB).
 *       - Para cambiar contraseña, se debe enviar `nueva_contrasena` y `confirmar_nueva_contrasena`.
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePerfilRequest'
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Datos del perfil actualizados correctamente."
 *       400:
 *         description: Error de validación en los datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado (token inválido o contraseña actual incorrecta)
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdatePerfilRequest:
 *       type: object
 *       required:
 *         - contrasena_actual
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           format: email
 *           example: "juan@empresa.com"
 *         departamento:
 *           type: string
 *           example: "Ventas"
 *         contrasena_actual:
 *           type: string
 *           format: password
 *           description: Contraseña actual (obligatoria para cualquier cambio)
 *           example: "oldPassword123"
 *         nueva_contrasena:
 *           type: string
 *           format: password
 *           description: Requiere `confirmar_nueva_contrasena`
 *           example: "newSecurePassword456"
 *         confirmar_nueva_contrasena:
 *           type: string
 *           format: password
 *           example: "newSecurePassword456"
 *         foto:
 *           type: string
 *           format: binary
 *           description: Imagen de perfil (JPEG/PNG/GIF)
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           examples:
 *             passwordMismatch: "La contraseña actual es incorrecta."
 *             invalidEmail: "El correo electrónico no es válido."
 *             noChanges: "Debes proporcionar al menos un campo para actualizar."
 *         error:
 *           type: string
 *           example: "Detalle técnico (solo en desarrollo)"
 */
router.put(
  '/perfil',
  authenticate,
  configuracionController.updatePerfilUsuario
);

/**
 * @swagger
 * /configuracion/upload:
 *   post:
 *     tags:
 *       [Configuración]
 *     summary: "Sube una imagen al servidor"
 *     description: "Endpoint para cargar una imagen y obtener su URL relativa."
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: "object"
 *             properties:
 *               file:
 *                 type: "string"
 *                 format: "binary"
 *                 description: "Archivo de imagen (JPEG, PNG, etc.)"
 *     responses:
 *       200:
 *         description: "Imagen subida correctamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 url:
 *                   type: "string"
 *                   example: "/assets/images/1717832123.jpg"
 *       400:
 *         description: "Error: No se envió ninguna imagen"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 error:
 *                   type: "string"
 *                   example: "No se recibió ninguna imagen."
 *       500:
 *         description: "Error interno del servidor"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 error:
 *                   type: "string"
 *                   example: "Error al subir la imagen"
 */

router.post('/upload', authenticate, imageUpload.imageUploadMiddleware, configuracionController.uploadImage);


module.exports = router;
