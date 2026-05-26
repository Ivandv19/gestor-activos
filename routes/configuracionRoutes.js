const express = require("express");
const router = express.Router();
const configuracionController = require("../controllers/configuracionController");
const authenticate = require("../middleware/authenticate");
const imageUpload = require("../middleware/imageUpload");
const checkRole = require("../middleware/checkRole");
const validate = require("../middleware/validate");
const { updateConfigSchema, updatePerfilSchema } = require("../schemas/configuracion");

router.get("/aplicacion", authenticate, configuracionController.getConfiguracionAplicacion);

router.put(
	"/aplicacion",
	authenticate,
	checkRole("Administrador"),
	validate(updateConfigSchema),
	configuracionController.updateConfiguracionAplicacion,
);

router.get("/perfil", authenticate, configuracionController.getPerfilUsuario);

router.put(
	"/perfil",
	authenticate,
	imageUpload.imageUploadMiddleware,
	validate(updatePerfilSchema),
	configuracionController.updatePerfilUsuario,
);

module.exports = router;
