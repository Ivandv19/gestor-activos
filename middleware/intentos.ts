// Rate limiter
import rateLimit from "express-rate-limit";

// Middleware: limita los intentos de login a 5 cada 15 minutos
export const limiteIntentos = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: {
		error: "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});
