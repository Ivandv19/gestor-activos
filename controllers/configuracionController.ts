// Express
import type { Request, Response } from "express-serve-static-core";
// Servicios
import {
	getConfiguracionAplicacion,
	getPerfilUsuario,
	subirImagenPerfil,
	updateConfiguracionAplicacion,
	updatePerfilUsuario,
} from "../services/configuracionService.js";
// Logger
import { logger } from "../services/logger.js";

// Controller: configuración global de la app
export const obtenerConfiguracion = async (_req: Request, res: Response) => {
	try {
		const data = await getConfiguracionAplicacion();
		res.json({ data });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR CONFIGURACIÓN]:", message);
		if (message.toLowerCase().includes("no encontr")) {
			res.status(404).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("incorrecta")) {
			res.status(401).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("no hay campos") ||
			message.toLowerCase().includes("no hay datos") ||
			message.toLowerCase().includes("al menos")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

// Controller: actualiza configuración global
export const actualizarConfiguracion = async (req: Request, res: Response) => {
	try {
		const input = req.validated as {
			idioma: string;
			zona_horaria: string;
			formato_fecha: string;
			formato_moneda: string;
		};
		await updateConfiguracionAplicacion(input);
		res.json({
			message: "Configuración global actualizada correctamente",
			data: { nuevaConfiguracion: input },
		});
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR CONFIGURACIÓN]:", message);
		if (message.toLowerCase().includes("no encontr")) {
			res.status(404).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("incorrecta")) {
			res.status(401).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("no hay campos") ||
			message.toLowerCase().includes("no hay datos") ||
			message.toLowerCase().includes("al menos")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

// Controller: perfil del usuario autenticado
export const perfilUsuario = async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			res.status(400).json({ error: "ID de usuario no proporcionado." });
			return;
		}
		const userId = req.user.id;
		const data = await getPerfilUsuario(userId);
		res.json({ data });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR CONFIGURACIÓN]:", message);
		if (message.toLowerCase().includes("no encontr")) {
			res.status(404).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("incorrecta")) {
			res.status(401).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("no hay campos") ||
			message.toLowerCase().includes("no hay datos") ||
			message.toLowerCase().includes("al menos")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

// Controller: actualiza perfil del usuario
export const actualizarPerfil = async (req: Request, res: Response) => {
	try {
		const input = req.validated as {
			nombre?: string;
			email?: string;
			departamento?: string;
			contrasena_actual: string;
			nueva_contrasena?: string;
			confirmar_nueva_contrasena?: string;
			foto_url?: string;
		};
		await updatePerfilUsuario(req.user?.id, input);
		res.json({
			data: null,
			message: "Datos del perfil actualizados correctamente.",
		});
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR CONFIGURACIÓN]:", message);
		if (message.toLowerCase().includes("no encontr")) {
			res.status(404).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("incorrecta")) {
			res.status(401).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("no hay campos") ||
			message.toLowerCase().includes("no hay datos") ||
			message.toLowerCase().includes("al menos")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

// Controller: sube imagen de perfil a R2
export const subirImagen = async (req: Request, res: Response) => {
	try {
		// Validación de archivo requerido
		const file = (req as unknown as { file: Express.Multer.File }).file;
		if (!file) {
			res.status(400).json({ error: "No se recibió ninguna imagen." });
			return;
		}
		const result = await subirImagenPerfil(file.buffer, file.mimetype);
		res.json({ data: { url: result.url } });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR CONFIGURACIÓN]:", message);
		if (message.toLowerCase().includes("no encontr")) {
			res.status(404).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("incorrecta")) {
			res.status(401).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("no hay campos") ||
			message.toLowerCase().includes("no hay datos") ||
			message.toLowerCase().includes("al menos")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error interno del servidor" });
	}
};
