const rateLimit = require("express-rate-limit");

// Middleware para limitar intentos fallidos
const loginLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minuto (ajustado para pruebas)
	max: 1000, // Máximo 1000 intentos por IP (subido para desarrollo)
	message: (req) => {
		const resetTime = new Date(Date.now() + 1 * 60 * 1000); // Calcula el tiempo de reinicio
		return `Demasiados intentos fallidos. Por favor, inténtalo nuevamente después de ${resetTime.toLocaleTimeString()}.`;
	},
	standardHeaders: true, // Devuelve encabezados `RateLimit-*` en la respuesta
	legacyHeaders: false, // Deshabilita los encabezados `X-RateLimit-*` antiguos
});

module.exports = loginLimiter;
