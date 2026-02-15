// Dependencias core
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const pool = require("./config/db");

// Documentación Swagger
const { swaggerDocs, swaggerUi } = require("./swagger/swagger");

// Importación de rutas
const activosRoutes = require("./routes/activosRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const historialRoutes = require("./routes/historialRoutes");
const asignacionesRoutes = require("./routes/asignacionesRoutes");
const garantiasRoutes = require("./routes/garantiasRoutes");
const reporteRoutes = require("./routes/reporteRoutes");
const configuracionRoutes = require("./routes/configuracionRoutes");

// Inicializar Express
const app = express();

// Seguridad y configuración de Proxy
app.use(cors());
app.set("trust proxy", 1);

// Configuración de Helmet y Seguridad
app.use(
	helmet({
		contentSecurityPolicy: false,
		crossOriginResourcePolicy: { policy: "cross-origin" },
	}),
);

// Recursos estáticos (imágenes)
app.use(
	"/api/assets/images",
	express.static(path.resolve(__dirname, "./mi-carpeta-imagenes")),
);

// Middleware para parseo y logs
app.use(express.json());
app.use(morgan("dev"));

// Registro de rutas principales
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api/gestion-activos", activosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/asignaciones", asignacionesRoutes);
app.use("/api/garantias", garantiasRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/configuracion", configuracionRoutes);

// Endpoint de salud del sistema
app.get("/api/health", (req, res) => {
	res.status(200).json({
		status: "ok",
		uptime: process.uptime(),
		message: "Gestor de Activos Backend is running correctly!",
		timestamp: new Date().toISOString()
	});
});

// Puerto y encendido del servidor
const PORT = process.env.SERVER_PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
	console.log(`✅ Servidor ejecutándose en http://0.0.0.0:${PORT}`);
	console.log(`📚 Documentación API disponible en http://0.0.0.0:${PORT}/api/docs`);
	console.log(`🏥 Health check disponible en http://0.0.0.0:${PORT}/api/health`);
});