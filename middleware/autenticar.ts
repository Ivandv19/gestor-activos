// Express
import type {
	NextFunction,
	Request,
	Response,
} from "express-serve-static-core";
// JWT
import jwt from "jsonwebtoken";
// Configuración y logger
import env from "../config/env.js";
import { logger } from "../services/logger.js";

// Middleware: verifica el token JWT en el encabezado Authorization
export function autenticar(req: Request, res: Response, next: NextFunction) {
	// 1. Extrae el token del encabezado "Bearer <token>"
	const authHeader = req.header("Authorization");

	// 2. Rechaza si no hay token
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		logger.warn("Auth fallida: sin token", { ip: req.ip, path: req.path });
		res.status(401).json({
			error: "Acceso denegado. El encabezado Authorization es obligatorio.",
		});
		return;
	}

	const token = authHeader.split(" ")[1];

	// 3. Verifica la firma del token con la clave secreta
	try {
		const decoded = jwt.verify(token, env.JWT_SECRET) as {
			id: number;
			email: string;
			nombre: string;
			rol: string;
		};

		// 4. Rechaza tokens que no contengan datos esenciales
		if (!decoded.id || !decoded.email) {
			logger.warn("Auth fallida: token sin datos esenciales", { ip: req.ip });
			res
				.status(403)
				.json({ error: "Token inválido: falta información esencial." });
			return;
		}

		// 5. Adjunta el usuario decodificado a la request
		req.user = decoded;
		next();

		// 6. Maneja errores específicos del JWT
	} catch (error: unknown) {
		const errName = (error as Error).name;
		logger.warn("Auth fallida: token inválido", { ip: req.ip, error: errName });

		// Token expirado
		if (errName === "TokenExpiredError") {
			res.status(403).json({
				error: "Token expirado. Por favor, inicia sesión nuevamente.",
			});
			return;
		}

		// Token manipulado o malformado
		if (errName === "JsonWebTokenError") {
			res.status(403).json({ error: "Token inválido o ha sido manipulado." });
			return;
		}

		// Cualquier otro error del JWT
		res.status(403).json({ error: "Token inválido o expirado." });
	}
}
