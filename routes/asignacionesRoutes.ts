// Express
import express from "express";

const router = express.Router();

// Controladores
import * as asignacionesController from "../controllers/asignacionesController.js";
// Middleware
import { autenticar } from "../middleware/autenticar.js";
import { permisos } from "../middleware/permisos.js";
import { validar } from "../middleware/validar.js";
// Schemas
import {
	createAsignacionSchema,
	updateAsignacionSchema,
} from "../schemas/asignaciones.js";

// GET /api/asignaciones/activos-disponibles — activos libres para asignar
router.get(
	"/activos-disponibles",
	autenticar,
	asignacionesController.getActivosDisponibles,
);

// GET /api/asignaciones/datos-auxiliares/:id — datos para formulario de asignación
router.get(
	"/datos-auxiliares/:id",
	autenticar,
	asignacionesController.obtenerDatosAuxiliares,
);

// GET /api/asignaciones/:id — asignación individual
router.get("/:id", autenticar, asignacionesController.getAsignacionPorId);

// GET /api/asignaciones/ — lista paginada de asignaciones
router.get("/", autenticar, asignacionesController.getAsignaciones);

// POST /api/asignaciones/ — crea asignación (cambia estado del activo)
router.post(
	"/",
	autenticar,
	permisos("Administrador"),
	validar(createAsignacionSchema),
	asignacionesController.createAsignacion,
);

// PUT /api/asignaciones/:id — actualiza asignación existente
router.put(
	"/:id",
	autenticar,
	permisos("Administrador"),
	validar(updateAsignacionSchema),
	asignacionesController.updateAsignacion,
);

// DELETE /api/asignaciones/:id — elimina asignación (libera el activo)
router.delete(
	"/:id",
	autenticar,
	permisos("Administrador"),
	asignacionesController.deleteAsignacion,
);

export default router;
