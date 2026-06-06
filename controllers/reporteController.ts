// Express
import type { Request, Response } from "express-serve-static-core";
// Logger
import { logger } from "../services/logger.js";
// Servicios
import {
	generarReporte,
	getDatosAuxiliares,
	getTiposReporte,
} from "../services/reporteService.js";

// Controller: tipos de reporte disponibles
export const tiposReporte = async (_req: Request, res: Response) => {
	try {
		const tipos = await getTiposReporte();
		res.status(200).json({ data: { tiposReporte: tipos } });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR REPORTE]:", message);
		if (message.toLowerCase().includes("no exist")) {
			res.status(404).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("no válido")) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error en la consulta." });
	}
};

// Controller: datos auxiliares para reportes
export const datosAuxiliares = async (_req: Request, res: Response) => {
	try {
		const data = await getDatosAuxiliares();
		res.json({ data });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR REPORTE]:", message);
		if (message.toLowerCase().includes("no exist")) {
			res.status(404).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("no válido")) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al obtener los datos auxiliares" });
	}
};

// Controller: genera reporte según tipo y filtros
export const generar = async (req: Request, res: Response) => {
	try {
		const { tipo_id, filtros = {} } = req.validated as {
			tipo_id: number;
			filtros?: Record<string, unknown>;
		};
		const result = await generarReporte(tipo_id, filtros);
		res.json({ message: "Reporte generado exitosamente.", data: result });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR REPORTE]:", message);
		if (message.toLowerCase().includes("no exist")) {
			res.status(404).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("no válido")) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al generar el reporte." });
	}
};
