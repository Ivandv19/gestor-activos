// Express
import type { Request, Response } from "express-serve-static-core";

// Controller: health check del servidor
export const health = (_req: Request, res: Response) => {
	res.status(200).json({
		data: {
			status: "ok",
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		},
		message: "Gestor de Activos Backend is running correctly!",
	});
};
