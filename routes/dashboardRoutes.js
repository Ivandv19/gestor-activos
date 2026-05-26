const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authenticate = require("../middleware/authenticate");

router.get("/resumen", authenticate, dashboardController.getResumen);

router.get("/alertas", authenticate, dashboardController.getAlertas);

module.exports = router;
