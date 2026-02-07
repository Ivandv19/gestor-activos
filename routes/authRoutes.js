const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const loginLimiter = require("../middleware/limitarIntentos"); // Middleware para limitar intentos de inicio de sesión
const authenticate = require("../middleware/authenticate"); // Middleware de autenticación
const checkRole = require("../middleware/checkRole"); // Middleware de verificación de roles

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación y registro de usuarios
 */

/**
 * @swagger
 * /auth/registro:
 *   post:
 *     summary: Registra un nuevo usuario en el sistema
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioRegistro'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario registrado exitosamente"
 *       400:
 *         description: Error en la validación de datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     camposFaltantes: "Todos los campos son obligatorios"
 *                     emailInvalido: "El correo electrónico no es válido"
 *                     contrasenaCorta: "La contraseña debe tener al menos 8 caracteres"
 *                     rolInvalido: "Rol no válido"
 *                     emailExistente: "El correo electrónico ya está registrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al registrar el usuario"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UsuarioRegistro:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - contrasena
 *         - departamento
 *         - fecha_ingreso
 *         - rol
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           format: email
 *           example: "juan@example.com"
 *         contrasena:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "Password123!"
 *         departamento:
 *           type: string
 *           example: "Ventas"
 *         fecha_ingreso:
 *           type: string
 *           format: date
 *           example: "2023-01-15"
 *         rol:
 *           type: string
 *           enum: ["Administrador", "Usuario"]
 *           example: "Usuario"
 *       example:
 *         nombre: "Juan Pérez"
 *         email: "juan@example.com"
 *         contrasena: "Password123!"
 *         departamento: "Ventas"
 *         fecha_ingreso: "2023-01-15"
 *         rol: "Usuario"
 */

router.post(
	"/registro",
	authenticate,
	checkRole("Administrador"),
	authController.registro,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión de usuario y genera un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioLogin'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Sesión iniciada correctamente"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 userData:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     rol:
 *                       type: string
 *                       example: "admin"
 *                     email:
 *                       type: string
 *                       example: "usuario@example.com"
 *       400:
 *         description: Error en la validación de datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Todos los campos son obligatorios"
 *                 errorCode:
 *                   type: string
 *                   enum:
 *                     - AUTH_004
 *                   description: |
 *                     Códigos de error específicos:
 *                     - AUTH_004: Formato de correo electrónico inválido
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuario no registrado"
 *                 errorCode:
 *                   type: string
 *                   enum:
 *                     - AUTH_001
 *                     - AUTH_002
 *                   description: |
 *                     Códigos de error específicos:
 *                     - AUTH_001: Usuario no encontrado
 *                     - AUTH_002: Contraseña incorrecta
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno al iniciar sesión"
 *                 errorCode:
 *                   type: string
 *                   enum:
 *                     - SERVER_001
 *                     - SERVER_002
 *                   description: |
 *                     Códigos de error específicos:
 *                     - SERVER_001: Error interno del servidor
 *                     - SERVER_002: JWT_SECRET no configurado
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UsuarioLogin:
 *       type: object
 *       required:
 *         - email
 *         - contrasena
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "usuario@example.com"
 *         contrasena:
 *           type: string
 *           format: password
 *           example: "Password123!"
 *       example:
 *         email: "usuario@example.com"
 *         contrasena: "Password123!"
 */

router.post("/login", loginLimiter, authController.login);

/**
 * @swagger
 * /auth/test:
 *   get:
 *     summary: Valida un token JWT y devuelve la información del usuario
 *     description: |
 *       Endpoint protegido que verifica la validez del token JWT.
 *       Requiere autenticación mediante Bearer Token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token válido"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "usuario@example.com"
 *                     rol:
 *                       type: string
 *                       example: "Usuario"
 *                     iat:
 *                       type: integer
 *                       description: "Timestamp de creación del token"
 *                       example: 1712345678
 *                     exp:
 *                       type: integer
 *                       description: "Timestamp de expiración del token"
 *                       example: 1712349278
 *       401:
 *         description: Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Acceso no autorizado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al validar el token"
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Ingrese el token JWT en el formato 'Bearer {token}'
 */

router.get(
	"/test",
	authenticate,
	checkRole("Administrador"),
	authController.test,
);

module.exports = router;
