// Express
import type { Request, Response } from "express-serve-static-core";
// Servicios
import {
	createGarantia,
	deleteGarantia,
	getGarantias,
	updateGarantia,
} from "../services/garantiasService.js";
// Logger
import { logger } from "../services/logger.js";

// Controller: lista paginada de garantías
export const listarGarantias = async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string, 10) || 1;
		const limit = parseInt(req.query.limit as string, 10) || 10;
		const result = await getGarantias(page, limit);
		res.json(result);
	} catch (error: unknown) {
		logger.error("[ERROR GARANTIAS]:", (error as Error).message);
		res.status(500).json({ error: "Error al obtener las garantías." });
	}
};

// Controller: registra nueva garantía
export const crearGarantia = async (req: Request, res: Response) => {
	try {
		const input = req.validated as {
			activo_id: number;
			proveedor_garantia_id: number;
			nombre_garantia: string;
			fecha_inicio: string;
			fecha_fin: string;
			costo?: number;
			condiciones?: string;
			estado: string;
			descripcion?: string;
		};
		const result = await createGarantia(input, req.user?.id);
		res
			.status(201)
			.json({ data: result, message: "Garantía registrada correctamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR GARANTIAS]:", message);
		if (
			message.toLowerCase().includes("no existe") ||
			message.toLowerCase().includes("no válido") ||
			message.toLowerCase().includes("posterior")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al registrar la garantía." });
	}
};

// Controller: actualiza garantía existente
export const actualizarGarantia = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;
		const input = req.validated as {
			nombre_garantia?: string;
			estado?: string;
			fecha_fin?: string;
			descripcion?: string;
			proveedor_garantia_id?: number;
			costo?: number;
			condiciones?: string;
		};
		const result = await updateGarantia(id, input);
		res.json({ data: result, message: "Garantía actualizada correctamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR GARANTIAS]:", message);
		if (
			message.toLowerCase().includes("no existe") ||
			message.toLowerCase().includes("no válido") ||
			message.toLowerCase().includes("posterior")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al actualizar la garantía." });
	}
};

// Controller: elimina garantía
export const eliminarGarantia = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string;
		await deleteGarantia(id);
		res.json({ data: null, message: "Garantía eliminada físicamente" });
	} catch (error: unknown) {
		logger.error("[ERROR GARANTIAS]:", (error as Error).message);
		res.status(500).json({ error: "Error al eliminar la garantía." });
	}
};
