// Express
import type { Request, Response } from "express-serve-static-core";
// Servicios
import { iniciarSesion, registrarUsuario } from "../services/authService.js";
// Logger
import { logger } from "../services/logger.js";

// Controller: registra usuario nuevo
export const registro = async (req: Request, res: Response) => {
	try {
		const input = req.validated as {
			nombre: string;
			email: string;
			contrasena: string;
			departamento: string;
			fecha_ingreso: string;
			rol: string;
		};
		await registrarUsuario(input);
		res
			.status(201)
			.json({ data: null, message: "Usuario registrado exitosamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR AUTH]:", message);
		if (message.toLowerCase().includes("hash service")) {
			res
				.status(503)
				.json({ error: "El servicio de autenticación no está disponible." });
			return;
		}
		if (message === "El correo electrónico ya está registrado") {
			res.status(400).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error al registrar el usuario" });
	}
};

// Controller: inicia sesión de usuario
export const login = async (req: Request, res: Response) => {
	try {
		const { email, contrasena } = req.validated as {
			email: string;
			contrasena: string;
		};
		const result = await iniciarSesion({ email, contrasena });
		res.json({ data: result, message: "Sesión iniciada correctamente" });
	} catch (error: unknown) {
		const message = (error as Error).message;
		logger.error("[ERROR AUTH]:", message);
		if (message.toLowerCase().includes("hash service")) {
			res
				.status(503)
				.json({ error: "El servicio de autenticación no está disponible." });
			return;
		}
		if (
			message === "Usuario no registrado" ||
			message === "Contraseña incorrecta"
		) {
			res.status(401).json({ error: message });
			return;
		}
		res.status(500).json({ error: "Error interno al iniciar sesión" });
	}
};

// Controller: verifica token JWT
export const test = (req: Request, res: Response) => {
	res.json({ data: { user: req.user }, message: "Token válido" });
};
