// Express
import type { Request, Response } from "express-serve-static-core";
// Servicios
import * as activosService from "../services/activosService.js";
// Logger
import { logger } from "../services/logger.js";

// Controller: lista paginada de activos con filtros
export const getActivos = async (req: Request, res: Response) => {
	try {
		const result = await activosService.getActivos(
			req.query as Record<string, string | undefined>,
		);
		res.json(result);
	} catch (error: unknown) {
		logger.error("[ERROR ACTIVOS]:", (error as Error).message);
		res.status(500).json({ error: "Error al obtener los activos" });
	}
};

// Controller: activo individual por ID
export const getActivoById = async (req: Request, res: Response) => {
	try {
		const result = await activosService.getActivoById(req.params.id as string);
		res.json({ data: result });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ACTIVOS]:", message);
		if (message.toLowerCase().includes("no encontrado")) {
			res.status(404).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al obtener el activo" });
	}
};

// Controller: crea activo con imagen opcional
export const createActivo = async (req: Request, res: Response) => {
	try {
		// Archivo adjunto opcional
		const file = (req as unknown as { file?: Express.Multer.File }).file;
		const result = await activosService.createActivo(
			req.validated as Parameters<typeof activosService.createActivo>[0],
			file,
			req.user?.id,
		);
		res
			.status(201)
			.json({ data: result, message: "Activo creado exitosamente" });
	} catch (error: unknown) {
		logger.error("[ERROR ACTIVOS]:", (error as Error).message);
		res.status(500).json({ error: "Error al crear el activo" });
	}
};

// Controller: actualiza activo existente
export const updateActivo = async (req: Request, res: Response) => {
	try {
		// Archivo adjunto opcional
		const file = (req as unknown as { file?: Express.Multer.File }).file;
		const cambios = await activosService.updateActivo(
			req.params.id as string,
			req.validated as Parameters<typeof activosService.updateActivo>[1],
			file,
			req.user?.id,
		);
		res.json({ message: "Activo actualizado exitosamente", data: { cambios } });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ACTIVOS]:", message);
		if (
			message.toLowerCase().includes("no encontrado") ||
			message.toLowerCase().includes("no existe")
		) {
			res.status(404).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al actualizar el activo" });
	}
};

// Controller: elimina activo físico
export const deleteActivo = async (req: Request, res: Response) => {
	try {
		await activosService.deleteActivo(req.params.id as string);
		res.json({ message: "Activo eliminado físicamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ACTIVOS]:", message);
		if (message.toLowerCase().includes("no se puede eliminar")) {
			res.status(400).json({ error: message });
			return;
		}
		if (message.toLowerCase().includes("no encontrado")) {
			res.status(404).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al eliminar el activo" });
	}
};

// Controller: da de baja lógica un activo
export const darDeBajaActivo = async (req: Request, res: Response) => {
	try {
		await activosService.darDeBajaActivo(req.params.id as string, req.user?.id);
		res.json({ message: "Activo dado de baja exitosamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR ACTIVOS]:", message);
		if (
			message.toLowerCase().includes("no encontrado") ||
			message.toLowerCase().includes("ya está dado")
		) {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al dar de baja el activo" });
	}
};

// Controller: catálogos auxiliares
export const obtenerDatosAuxiliares = async (_req: Request, res: Response) => {
	try {
		const data = await activosService.obtenerDatosAuxiliares();
		res.json({ data });
	} catch (error: unknown) {
		logger.error("[ERROR ACTIVOS]:", (error as Error).message);
		res.status(500).json({ error: "Error al obtener datos auxiliares" });
	}
};

// Controller: valida disponibilidad de etiqueta serial
export const validarEtiquetaSerial = async (req: Request, res: Response) => {
	try {
		const { etiqueta_serial } = req.validated as { etiqueta_serial: string };
		const disponible =
			await activosService.validarEtiquetaSerial(etiqueta_serial);
		if (disponible) {
			res.json({ message: "La etiqueta serial está disponible" });
		} else {
			res.status(400).json({ error: "La etiqueta serial ya está registrada" });
		}
	} catch (error: unknown) {
		logger.error("[ERROR ACTIVOS]:", (error as Error).message);
		res.status(500).json({ error: "Error al validar la etiqueta serial" });
	}
};

// Controller: sube imagen a R2
export const subirImagen = async (req: Request, res: Response) => {
	try {
		// Validación de archivo requerido
		const file = (req as unknown as { file: Express.Multer.File }).file;
		if (!file) {
			res.status(400).json({ error: "No se recibió ninguna imagen." });
			return;
		}
		const result = await activosService.subirImagen(file.buffer, file.mimetype);
		res.json({ url: result.url });
	} catch (error: unknown) {
		logger.error("[ERROR ACTIVOS]:", (error as Error).message);
		res.status(500).json({ error: "Error al subir la imagen" });
	}
};
