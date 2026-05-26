const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const loginLimiter = require("../middleware/limitarIntentos");
const authenticate = require("../middleware/authenticate");
const checkRole = require("../middleware/checkRole");
const validate = require("../middleware/validate");
const { loginSchema, registroSchema } = require("../schemas/auth");

router.post(
	"/registro",
	authenticate,
	checkRole("Administrador"),
	validate(registroSchema),
	authController.registro,
);

router.post("/login", loginLimiter, validate(loginSchema), authController.login);

router.get(
	"/test",
	authenticate,
	checkRole("Administrador"),
	authController.test,
);

module.exports = router;
