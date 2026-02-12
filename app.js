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

// Configuración CORS (solo permite front en localhost:4200)
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "*", // Usa la variable o permite todo (*) por seguridad temporal
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

// Configuración de rutas principales
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Documentación API (Swagger UI)
app.use("/gestion-activos", activosRoutes); // ruta para gestionar lso activos
app.use("/auth", authRoutes); // Rutas relacionadas con autenticación
app.use("/dashboard", dashboardRoutes); // Rutas para el panel de control
app.use("/historial", historialRoutes); // Rutas para el historial de operaciones
app.use("/asignaciones", asignacionesRoutes); // Rutas para gestión de asignaciones
app.use("/garantias", garantiasRoutes); // Rutas para manejo de garantías
app.use("/reportes", reporteRoutes); // Rutas para generación de reportes
app.use("/configuracion", configuracionRoutes); // Rutas para configuración del sistema

// Inicialización del servidor
const PORT = process.env.SERVER_PORT || 3000; // Usa el puerto de .env o 3000 por defecto
app.listen(PORT, () => {
	console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
	console.log(
		`📚 Documentación API disponible en http://localhost:${PORT}/api-docs`,
	);
});
