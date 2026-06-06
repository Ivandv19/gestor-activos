// Express
import express from "express";

const router = express.Router();

// Controladores
import {
	datosAuxiliares,
	historialActivo,
	registrarAccionHistorial,
} from "../controllers/historialController.js";
// Middleware
import { autenticar } from "../middleware/autenticar.js";
import { validar } from "../middleware/validar.js";
// Schemas
import { registrarAccionSchema } from "../schemas/historial.js";

// GET /api/historial/activos/:id — historial paginado de un activo
router.get("/activos/:id", autenticar, historialActivo);

// GET /api/historial/filtros-auxiliares — acciones y usuarios para filtros
router.get("/filtros-auxiliares", autenticar, datosAuxiliares);

// POST /api/historial/activos/:id — registra acción en el historial
router.post(
	"/activos/:id",
	autenticar,
	validar(registrarAccionSchema),
	registrarAccionHistorial,
);

export default router;
