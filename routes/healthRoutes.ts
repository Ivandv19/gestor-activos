// Express
import express from "express";

const router = express.Router();

// Controladores
import { health } from "../controllers/healthController.js";

// GET /api/health — verifica que el servidor esté operativo
router.get("/", health);

export default router;
