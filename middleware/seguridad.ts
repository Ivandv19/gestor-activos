// Seguridad HTTP

import cors from "cors";
import helmet from "helmet";
// Configuración
import env from "../config/env.js";

// Middleware: CORS — solo permite solicitudes desde el frontend configurado
export const corsMiddleware = cors({ origin: env.FRONTEND_URL });

// Middleware: Helmet — cabeceras de seguridad HTTP
export const helmetMiddleware = helmet({
	contentSecurityPolicy: false,
	crossOriginResourcePolicy: { policy: "cross-origin" },
});
