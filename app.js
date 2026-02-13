// Dependencias principales
const express = require("express");
const morgan = require("morgan"); // Logs de peticiones
const helmet = require("helmet"); // Seguridad HTTP
const cors = require("cors"); // Permisos CORS
require("dotenv").config(); // Variables de entorno
const path = require("path");
const pool = require("./config/db"); // O como se llame tu carpeta/archivo de conexión

// Swagger (Documentación API)
const { swaggerDocs, swaggerUi } = require("./swagger/swagger");

// Rutas
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

// 1. CORS primero de todo para manejar preflights sin bloqueos
app.use(cors());

// Confía en el proxy (Traefik) para que pase las IPs reales y protocolos
app.set("trust proxy", 1);

app.use(
	helmet({
		contentSecurityPolicy: false,
		crossOriginResourcePolicy: { policy: "cross-origin" },
	}),
);

// ruta para obtener imagenes estaticas
app.use(
	"/assets/images",
	express.static(path.resolve(__dirname, "./mi-carpeta-imagenes")),
); // Servir imágenes estáticas desde la carpeta especificada

// Middlewares básicos
app.use(express.json()); // Parseo de JSON
app.use(morgan("dev")); // Logs en consola

// Configuración de rutas principales
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Documentación API (Swagger UI)
app.use("/gestion-activos", activosRoutes); // ruta para gestionar los activos
app.use("/auth", authRoutes); // Rutas relacionadas con autenticación
app.use("/dashboard", dashboardRoutes); // Rutas para el panel de control
app.use("/historial", historialRoutes); // Rutas para el historial de operaciones
app.use("/asignaciones", asignacionesRoutes); // Rutas para gestión de asignaciones
app.use("/garantias", garantiasRoutes); // Rutas para manejo de garantías
app.use("/reportes", reporteRoutes); // Rutas para generación de reportes
app.use("/configuracion", configuracionRoutes); // Rutas para configuración del sistema

// ✅ NUEVO: Endpoint de Salud (Health Check)
// Sirve para que Traefik o tú verifiquen que la app está viva sin autenticación
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "ok",
		uptime: process.uptime(),
		message: "Gestor de Activos Backend is running correctly!",
		timestamp: new Date().toISOString()
	});
});

// Inicialización del servidor
const PORT = process.env.SERVER_PORT || 3000; // Usa el puerto de .env o 3000 por defecto

// 🚨 CORRECCIÓN CRUCIAL: Agregamos "0.0.0.0"
// Esto permite que Docker/Traefik se conecten desde fuera del contenedor
app.listen(PORT, "0.0.0.0", () => {
	console.log(`✅ Servidor ejecutándose en http://0.0.0.0:${PORT}`);
	console.log(`📚 Documentación API disponible en http://0.0.0.0:${PORT}/api-docs`);
	console.log(`🏥 Health check disponible en http://0.0.0.0:${PORT}/health`);
});