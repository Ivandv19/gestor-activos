const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: {
		error:
			"Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

module.exports = loginLimiter;
