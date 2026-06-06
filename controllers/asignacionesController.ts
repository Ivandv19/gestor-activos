// Express
import type { Request, Response } from "express-serve-static-core";
// Servicios
import * as asignacionesService from "../services/asignacionesService.js";
// Logger
import { logger } from "../services/logger.js";

// Controller: lista paginada de asignaciones
export const getAsignaciones = async (req: Request, res: Response) => {
	try {
		const result = await asignacionesService.getAsignaciones(
			req.query as Record<string, string | undefined>,
		);
		res.json(result);
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ASIGNACIONES]:", message);
		if (
			message.toLowerCase().includes("no exist") ||
			message.toLowerCase().includes("no encontr")
		) {
			res.status(404).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("inválido") ||
			message.toLowerCase().includes("obligatorio")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al obtener las asignaciones" });
	}
};

// Controller: asignación individual por ID
export const getAsignacionPorId = async (req: Request, res: Response) => {
	try {
		const result = await asignacionesService.getAsignacionPorId(
			req.params.id as string,
		);
		res.json({ data: result });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ASIGNACIONES]:", message);
		if (
			message.toLowerCase().includes("no exist") ||
			message.toLowerCase().includes("no encontr")
		) {
			res.status(404).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("inválido") ||
			message.toLowerCase().includes("obligatorio")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al obtener la asignación" });
	}
};

// Controller: crea nueva asignación
export const createAsignacion = async (req: Request, res: Response) => {
	try {
		const input = req.validated as {
			activo_id: number;
			usuario_id: number;
			ubicacion_id: number;
			fecha_asignacion: string;
			fecha_devolucion?: string;
		};
		const result = await asignacionesService.createAsignacion(
			input,
			req.user?.id,
		);
		res
			.status(201)
			.json({ data: result, message: "Asignación creada exitosamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ASIGNACIONES]:", message);
		if (
			message.toLowerCase().includes("no exist") ||
			message.toLowerCase().includes("no encontr")
		) {
			res.status(404).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("inválido") ||
			message.toLowerCase().includes("obligatorio") ||
			message.toLowerCase().includes("disponible")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al crear la asignación" });
	}
};

// Controller: actualiza asignación existente
export const updateAsignacion = async (req: Request, res: Response) => {
	try {
		const input = req.validated as {
			fecha_devolucion?: string;
			usuario_id?: number;
			ubicacion_id?: number;
		};
		await asignacionesService.updateAsignacion(
			req.params.id as string,
			input,
			req.user?.id,
		);
		res.json({ message: "Asignación actualizada exitosamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ASIGNACIONES]:", message);
		if (
			message.toLowerCase().includes("no exist") ||
			message.toLowerCase().includes("no encontr")
		) {
			res.status(404).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("inválido") ||
			message.toLowerCase().includes("obligatorio")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al actualizar la asignación" });
	}
};

// Controller: elimina asignación (soft delete)
export const deleteAsignacion = async (req: Request, res: Response) => {
	try {
		await asignacionesService.deleteAsignacion(
			req.params.id as string,
			req.user?.id,
		);
		res.json({ message: "Asignación eliminada exitosamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ASIGNACIONES]:", message);
		if (
			message.toLowerCase().includes("no exist") ||
			message.toLowerCase().includes("no encontr")
		) {
			res.status(404).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("inválido") ||
			message.toLowerCase().includes("obligatorio")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al eliminar la asignación" });
	}
};

// Controller: activos disponibles para asignar
export const getActivosDisponibles = async (req: Request, res: Response) => {
	try {
		const data = await asignacionesService.getActivosDisponibles(
			req.query as Record<string, string | undefined>,
		);
		res.json(data);
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ASIGNACIONES]:", message);
		if (
			message.toLowerCase().includes("no exist") ||
			message.toLowerCase().includes("no encontr")
		) {
			res.status(404).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("inválido") ||
			message.toLowerCase().includes("obligatorio")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al obtener activos disponibles" });
	}
};

// Controller: datos auxiliares del formulario
export const obtenerDatosAuxiliares = async (req: Request, res: Response) => {
	try {
		const data = await asignacionesService.obtenerDatosAuxiliares(
			req.params.id as string | undefined,
		);
		res.json({ data });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ASIGNACIONES]:", message);
		if (
			message.toLowerCase().includes("no exist") ||
			message.toLowerCase().includes("no encontr")
		) {
			res.status(404).json({ error: message });
			return;
		}
		if (
			message.toLowerCase().includes("inválido") ||
			message.toLowerCase().includes("obligatorio")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al obtener datos auxiliares" });
	}
};
