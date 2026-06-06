// Express
import express from "express";

const router = express.Router();

// Controladores
import {
	actualizarConfiguracion,
	actualizarPerfil,
	obtenerConfiguracion,
	perfilUsuario,
	subirImagen,
} from "../controllers/configuracionController.js";
// Middleware
import { autenticar } from "../middleware/autenticar.js";
import { permisos } from "../middleware/permisos.js";
import { subirArchivo } from "../middleware/subida.js";
import { validar } from "../middleware/validar.js";
// Schemas
import {
	updateConfigSchema,
	updatePerfilSchema,
} from "../schemas/configuracion.js";

// GET /api/configuracion/aplicacion — configuración global del sistema
router.get("/aplicacion", autenticar, obtenerConfiguracion);

// PUT /api/configuracion/aplicacion — actualiza configuración global (admin)
router.put(
	"/aplicacion",
	autenticar,
	permisos("Administrador"),
	validar(updateConfigSchema),
	actualizarConfiguracion,
);

// GET /api/configuracion/perfil — perfil del usuario autenticado
router.get("/perfil", autenticar, perfilUsuario);

// PUT /api/configuracion/perfil — actualiza perfil del usuario
router.put(
	"/perfil",
	autenticar,
	subirArchivo,
	validar(updatePerfilSchema),
	actualizarPerfil,
);

// POST /api/configuracion/perfil/imagen — sube imagen de perfil a R2
router.post("/perfil/imagen", autenticar, subirArchivo, subirImagen);

export default router;
