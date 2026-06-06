/**
 * Configuración y montaje de la aplicación Express
 */

// Express y tipos
import express from "express";
// Middleware
import morgan from "morgan";
import { errores } from "./middleware/errores.js";
import { limiteGlobal } from "./middleware/limite.js";
import { corsMiddleware, helmetMiddleware } from "./middleware/seguridad.js";
import activosRoutes from "./routes/activosRoutes.js";
import asignacionesRoutes from "./routes/asignacionesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import configuracionRoutes from "./routes/configuracionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import garantiasRoutes from "./routes/garantiasRoutes.js";
// Rutas
import healthRoutes from "./routes/healthRoutes.js";
import historialRoutes from "./routes/historialRoutes.js";
import reporteRoutes from "./routes/reporteRoutes.js";
// Documentación
import { swaggerDocs, swaggerUi } from "./swagger/swagger.js";

const app = express();

// Seguridad
app.use(corsMiddleware);
app.use(helmetMiddleware);
app.set("trust proxy", 1);

// Parseo y logging
app.use(express.json());
app.use(morgan("dev"));

// Rate limiting global
app.use("/api", limiteGlobal);

// Documentación
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rutas de la API
app.use("/api/health", healthRoutes);
app.use("/api/gestion-activos", activosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/asignaciones", asignacionesRoutes);
app.use("/api/garantias", garantiasRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/configuracion", configuracionRoutes);

// Error handler global
app.use(errores);

export default app;
