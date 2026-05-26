const express = require("express");
const router = express.Router();
const garantiasController = require("../controllers/garantiasController");
const authenticate = require("../middleware/authenticate");
const checkRole = require("../middleware/checkRole");
const validate = require("../middleware/validate");
const { createGarantiaSchema, updateGarantiaSchema } = require("../schemas/garantias");

router.get("/", authenticate, garantiasController.getGarantias);

router.post(
	"/",
	authenticate,
	checkRole("Administrador"),
	validate(createGarantiaSchema),
	garantiasController.createGarantia,
);

router.put(
	"/:id",
	authenticate,
	checkRole("Administrador"),
	validate(updateGarantiaSchema),
	garantiasController.updateGarantia,
);

router.delete(
	"/:id",
	authenticate,
	checkRole("Administrador"),
	garantiasController.deleteGarantia,
);

module.exports = router;
