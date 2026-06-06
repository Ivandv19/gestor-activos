// Express
import express from "express";

const router = express.Router();

// Controladores
import { alertas, resumen } from "../controllers/dashboardController.js";
// Middleware
import { autenticar } from "../middleware/autenticar.js";

// GET /api/dashboard/resumen — estadísticas generales
router.get("/resumen", autenticar, resumen);

// GET /api/dashboard/alertas — alertas del sistema
router.get("/alertas", autenticar, alertas);

export default router;
