const express = require("express");
const router = express.Router();
const reporteController = require("../controllers/reporteController");
const authenticate = require("../middleware/authenticate");
const checkRole = require("../middleware/checkRole");
const validate = require("../middleware/validate");
const { generarReporteSchema } = require("../schemas/reporte");

router.get("/tipos", authenticate, checkRole("Administrador"), reporteController.getTiposReporte);

router.get("/datos-auxiliares", authenticate, checkRole("Administrador"), reporteController.getDatosAuxiliares);

router.post(
	"/generar",
	authenticate,
	checkRole("Administrador"),
	validate(generarReporteSchema),
	reporteController.generarReporte,
);

module.exports = router;
