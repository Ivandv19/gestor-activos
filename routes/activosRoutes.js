const express = require("express");
const router = express.Router();
const activosController = require("../controllers/activosController");
const authenticate = require("../middleware/authenticate");
const checkRole = require("../middleware/checkRole");
const imageUpload = require("../middleware/imageUpload");
const validate = require("../middleware/validate");
const {
	createActivoSchema,
	updateActivoSchema,
	validarEtiquetaSchema,
} = require("../schemas/activos");

router.get("/activos", authenticate, activosController.getActivos);

router.get("/activos/:id", authenticate, activosController.getActivoById);

router.post(
	"/activos",
	authenticate,
	checkRole("Administrador"),
	imageUpload.imageUploadMiddleware,
	validate(createActivoSchema),
	activosController.createActivo,
);

router.patch(
	"/baja/:id",
	authenticate,
	checkRole("Administrador"),
	activosController.darDeBajaActivo,
);

router.put(
	"/activos/:id",
	authenticate,
	checkRole("Administrador"),
	imageUpload.imageUploadMiddleware,
	validate(updateActivoSchema),
	activosController.updateActivo,
);

router.delete(
	"/activos/:id",
	authenticate,
	checkRole("Administrador"),
	activosController.deleteActivo,
);

router.get("/datos-auxiliares", authenticate, activosController.obtenerDatosAuxiliares);

router.post(
	"/validar-etiqueta-serial",
	authenticate,
	checkRole("Administrador"),
	validate(validarEtiquetaSchema),
	activosController.validarEtiquetaSerial,
);

module.exports = router;
