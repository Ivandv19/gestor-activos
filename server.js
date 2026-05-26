require("dotenv").config();
const app = require("./app");
const db = require("./config/db");

const PORT = process.env.SERVER_PORT || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
	console.log(`✅ Servidor ejecutándose en http://0.0.0.0:${PORT}`);
	console.log(
		`📚 Documentación API disponible en http://0.0.0.0:${PORT}/api/docs`,
	);
	console.log(
		`🏥 Health check disponible en http://0.0.0.0:${PORT}/api/health`,
	);
});

const gracefulShutdown = async (signal) => {
	console.log(`[SERVER] ${signal} recibido, cerrando conexiones...`);
	server.close(() => {
		db.end().then(() => {
			console.log("[SERVER] Conexiones cerradas, adiós.");
			process.exit(0);
		});
	});
	setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
