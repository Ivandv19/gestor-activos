// Express
import type {
	NextFunction,
	Request,
	Response,
} from "express-serve-static-core";
// Logger
import { logger } from "../services/logger.js";

// Middleware: captura cualquier error no controlado en la aplicación
export function errores(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
) {
	// 1. Registra el error en el logger
	logger.error("[ERROR GLOBAL]:", err.message);

	// 2. Determina el código de estado HTTP
	const status = (err as unknown as { status?: number }).status || 500;

	// 3. Responde con un mensaje genérico para errores internos
	res.status(status).json({
		error: status === 500 ? "Error interno del servidor" : err.message,
	});
}
