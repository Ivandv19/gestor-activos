// Express
import express from "express";

const router = express.Router();

// Controladores
import * as activosController from "../controllers/activosController.js";
// Middleware
import { autenticar } from "../middleware/autenticar.js";
import { permisos } from "../middleware/permisos.js";
import { subirArchivo } from "../middleware/subida.js";
import { validar } from "../middleware/validar.js";
// Schemas
import {
	createActivoSchema,
	updateActivoSchema,
	validarEtiquetaSchema,
} from "../schemas/activos.js";

// GET /api/gestion-activos/activos — lista paginada de activos
router.get("/activos", autenticar, activosController.getActivos);

// GET /api/gestion-activos/activos/:id — activo individual
router.get("/activos/:id", autenticar, activosController.getActivoById);

// POST /api/gestion-activos/activos — crea activo con imagen opcional
router.post(
	"/activos",
	autenticar,
	permisos("Administrador"),
	subirArchivo,
	validar(createActivoSchema),
	activosController.createActivo,
);

// PATCH /api/gestion-activos/baja/:id — da de baja lógica un activo
router.patch(
	"/baja/:id",
	autenticar,
	permisos("Administrador"),
	activosController.darDeBajaActivo,
);

// PUT /api/gestion-activos/activos/:id — actualiza activo existente
router.put(
	"/activos/:id",
	autenticar,
	permisos("Administrador"),
	subirArchivo,
	validar(updateActivoSchema),
	activosController.updateActivo,
);

// DELETE /api/gestion-activos/activos/:id — elimina activo físicamente
router.delete(
	"/activos/:id",
	autenticar,
	permisos("Administrador"),
	activosController.deleteActivo,
);

// POST /api/gestion-activos/activos/upload — sube imagen a R2
router.post(
	"/activos/upload",
	autenticar,
	permisos("Administrador"),
	subirArchivo,
	activosController.subirImagen,
);

// GET /api/gestion-activos/datos-auxiliares — catálogos para formularios
router.get(
	"/datos-auxiliares",
	autenticar,
	activosController.obtenerDatosAuxiliares,
);

// POST /api/gestion-activos/validar-etiqueta-serial — verifica disponibilidad
router.post(
	"/validar-etiqueta-serial",
	autenticar,
	permisos("Administrador"),
	validar(validarEtiquetaSchema),
	activosController.validarEtiquetaSerial,
);

export default router;
