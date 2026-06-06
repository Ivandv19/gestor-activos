// Express
import type { Request, Response } from "express-serve-static-core";
// Servicios
import { getAlertas, getResumen } from "../services/dashboardService.js";
// Logger
import { logger } from "../services/logger.js";

// Controller: dashboard con estadísticas
export const resumen = async (_req: Request, res: Response) => {
	try {
		const data = await getResumen();
		res.status(200).json({ data });
	} catch (error: unknown) {
		logger.error("[ERROR DASHBOARD]:", (error as Error).message);
		res
			.status(500)
			.json({ error: "Error al obtener el resumen del dashboard" });
	}
};

// Controller: alertas del sistema
export const alertas = async (_req: Request, res: Response) => {
	try {
		const data = await getAlertas();
		res.status(200).json({ data });
	} catch (error: unknown) {
		logger.error("[ERROR DASHBOARD]:", (error as Error).message);
		res
			.status(500)
			.json({ error: "Error al obtener las alertas del dashboard" });
	}
};
