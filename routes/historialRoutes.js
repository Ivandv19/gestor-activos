const express = require("express");
const router = express.Router();
const historialController = require("../controllers/historialController");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const { registrarAccionSchema } = require("../schemas/historial");

router.get("/activos/:id", authenticate, historialController.getHistorialActivo);

router.get("/filtros-auxiliares", authenticate, historialController.getDatosAuxiliares);

router.post(
	"/activos/:id",
	authenticate,
	validate(registrarAccionSchema),
	historialController.registrarAccionHistorial,
);

module.exports = router;
