const express = require("express");
const router = express.Router();
const asignacionesController = require("../controllers/asignacionesController");
const authenticate = require("../middleware/authenticate");
const checkRole = require("../middleware/checkRole");
const validate = require("../middleware/validate");
const {
	createAsignacionSchema,
	updateAsignacionSchema,
} = require("../schemas/asignaciones");

router.get("/activos-disponibles", authenticate, asignacionesController.getActivosDisponibles);

router.get("/datos-auxiliares/:id", authenticate, asignacionesController.obtenerDatosAuxiliares);

router.get("/:id", authenticate, asignacionesController.getAsignacionPorId);

router.get("/", authenticate, asignacionesController.getAsignaciones);

router.post(
	"/",
	authenticate,
	checkRole("Administrador"),
	validate(createAsignacionSchema),
	asignacionesController.createAsignacion,
);

router.put(
	"/:id",
	authenticate,
	checkRole("Administrador"),
	validate(updateAsignacionSchema),
	asignacionesController.updateAsignacion,
);

router.delete(
	"/:id",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.deleteAsignacion,
);

module.exports = router;
