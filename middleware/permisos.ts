// Express
import type {
	NextFunction,
	Request,
	Response,
} from "express-serve-static-core";
// Logger
import { logger } from "../services/logger.js";

// Middleware: autoriza el acceso según el rol del usuario
export function permisos(...requiredRoles: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = req.user;

		// 1. Rechaza si el usuario no tiene datos válidos en el token
		if (!user || !user.id || !user.email) {
			logger.warn("Acceso denegado: usuario sin datos", {
				ip: req.ip,
				path: req.path,
			});
			res
				.status(403)
				.json({ error: "Token inválido: falta información esencial." });
			return;
		}

		// 2. Valida que los roles requeridos sean un arreglo de strings
		if (
			!Array.isArray(requiredRoles) ||
			requiredRoles.some((role) => typeof role !== "string")
		) {
			logger.error("permisos: roles inválidos", { requiredRoles });
			res.status(500).json({ error: "Error interno del servidor" });
			return;
		}

		// 3. Compara el rol del usuario contra los roles permitidos
		if (
			user.rol &&
			requiredRoles
				.map((role) => role.toLowerCase())
				.includes(user.rol.toLowerCase())
		) {
			// 3a. Coincide — permite el acceso
			next();
		} else {
			// 3b. No coincide — deniega el acceso
			logger.warn("Acceso denegado: rol insuficiente", {
				usuario: user.id,
				rol: user.rol,
				requerido: requiredRoles.join(", "),
				path: req.path,
			});
			res.status(403).json({
				error: `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(", ")}.`,
			});
		}
	};
}
