require("dotenv").config();
const app = require("./app");

const PORT = process.env.SERVER_PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
	console.log(`✅ Servidor ejecutándose en http://0.0.0.0:${PORT}`);
	console.log(
		`📚 Documentación API disponible en http://0.0.0.0:${PORT}/api/docs`,
	);
	console.log(
		`🏥 Health check disponible en http://0.0.0.0:${PORT}/api/health`,
	);
});
