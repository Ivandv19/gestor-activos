// Express
import type { Request, Response } from "express-serve-static-core";
// Servicios
import {
	getDatosAuxiliares,
	getHistorialActivo,
	registrarAccion,
} from "../services/historialService.js";
// Logger
import { logger } from "../services/logger.js";

// Controller: historial de un activo
export const historialActivo = async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			res
				.status(400)
				.json({ error: "ID del activo debe ser un número válido." });
			return;
		}
		const page = parseInt(req.query.page as string, 10) || 1;
		const limit = parseInt(req.query.limit as string, 10) || 10;
		const orden = (req.query.orden as string) || "asc";
		const search = (req.query.search as string) || "";
		const accion = (req.query.accion as string) || "";
		const usuario_responsable = (req.query.usuario_responsable as string) || "";

		const result = await getHistorialActivo(
			id,
			page,
			limit,
			orden,
			search,
			accion,
			usuario_responsable,
		);
		res.json(result);
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR HISTORIAL]:", message);
		if (message.toLowerCase().includes("debe ser un número")) {
			res.status(400).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("encontr")) {
			res.status(404).json({ error: message });
			return;
		}
		res
			.status(500)
			.json({ error: "Error al obtener el historial del activo." });
	}
};

// Controller: filtros auxiliares del historial
export const datosAuxiliares = async (_req: Request, res: Response) => {
	try {
		const data = await getDatosAuxiliares();
		res.status(200).json({ data });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR HISTORIAL]:", message);
		if (message.toLowerCase().includes("encontr")) {
			res.status(404).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

// Controller: registra acción en historial
export const registrarAccionHistorial = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { accion, detalles, fecha, usuario_asignado, ubicacion_nueva } =
			req.validated as {
				accion: string;
				detalles?: string;
				fecha?: string;
				usuario_asignado?: number;
				ubicacion_nueva?: number;
			};
		const usuarioResponsable = req.user?.id;

		const historial = await registrarAccion(
			Number(id),
			accion,
			detalles,
			fecha,
			usuarioResponsable,
			usuario_asignado,
			ubicacion_nueva,
		);

		res.status(201).json({
			data: { historial },
			message: "Acción registrada correctamente en el historial.",
		});
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR HISTORIAL]:", message);
		if (message.toLowerCase().includes("encontr")) {
			res.status(404).json({ error: message });
			return;
		}
		res
			.status(500)
			.json({ error: "Error al registrar la acción en el historial." });
	}
};
