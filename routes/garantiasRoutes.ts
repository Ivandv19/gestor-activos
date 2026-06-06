// Express
import express from "express";

const router = express.Router();

// Controladores
import {
	actualizarGarantia,
	crearGarantia,
	eliminarGarantia,
	listarGarantias,
} from "../controllers/garantiasController.js";
// Middleware
import { autenticar } from "../middleware/autenticar.js";
import { permisos } from "../middleware/permisos.js";
import { validar } from "../middleware/validar.js";
// Schemas
import {
	createGarantiaSchema,
	updateGarantiaSchema,
} from "../schemas/garantias.js";

// GET /api/garantias/ — lista paginada de garantías
router.get("/", autenticar, listarGarantias);

// POST /api/garantias/ — registra nueva garantía
router.post(
	"/",
	autenticar,
	permisos("Administrador"),
	validar(createGarantiaSchema),
	crearGarantia,
);

// PUT /api/garantias/:id — actualiza garantía existente
router.put(
	"/:id",
	autenticar,
	permisos("Administrador"),
	validar(updateGarantiaSchema),
	actualizarGarantia,
);

// DELETE /api/garantias/:id — elimina garantía físicamente
router.delete("/:id", autenticar, permisos("Administrador"), eliminarGarantia);

export default router;
