/** Pruebas para el módulo de configuración */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// 1. Mock de BD con Drizzle
jest.mock("mysql2/promise", () => {
	const p = {
		query: jest.fn(),
		execute: jest.fn(),
		end: jest.fn(),
		getConnection: jest.fn(),
	};
	return { createPool: jest.fn(() => p), __mockPool: p };
});

import mysql from "mysql2/promise";

const mockPool = mysql.__mockPool;

// 2. Mock de servicios
jest.mock("../services/hashService", () => ({
	generarHash: jest.fn(),
	verificarHash: jest.fn(),
}));

import hashService from "../services/hashService";

jest.mock("../services/r2Service", () => ({
	generarClave: jest.fn(),
	subirAR2: jest.fn(),
}));

// 3. Middlewares en línea
const app = express();
app.use(express.json());

const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

const checkRole = (_role) => (_req, _res, next) => {
	next();
};

// 4. Crear app mínima con rutas en línea
import * as configuracionController from "../controllers/configuracionController";
import { validar } from "../middleware/validar";
import {
	updateConfigSchema,
	updatePerfilSchema,
} from "../schemas/configuracion";

app.get(
	"/api/configuracion/aplicacion",
	authenticate,
	configuracionController.obtenerConfiguracion,
);
app.put(
	"/api/configuracion/aplicacion",
	authenticate,
	checkRole("Administrador"),
	validar(updateConfigSchema),
	configuracionController.actualizarConfiguracion,
);
app.get(
	"/api/configuracion/perfil",
	authenticate,
	configuracionController.perfilUsuario,
);
app.put(
	"/api/configuracion/perfil",
	authenticate,
	validar(updatePerfilSchema),
	configuracionController.actualizarPerfil,
);

describe("Configuración Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPool.query.mockResolvedValue([[], []]);
	});

	describe("GET /api/configuracion/aplicacion", () => {
		it("debería retornar la configuración de la aplicación desde la BD", async () => {
			const mockConfig = [
				1,
				"es",
				"UTC-5",
				"DD/MM/YYYY",
				"USD",
				"2024-01-01T00:00:00.000Z",
				"2024-01-01T00:00:00.000Z",
			];

			mockPool.query.mockResolvedValueOnce([[mockConfig], []]);

			const res = await request(app).get("/api/configuracion/aplicacion");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data.idioma).toEqual("es");
			expect(res.body.data.zona_horaria).toEqual("UTC-5");
			expect(res.body.data.formato_fecha).toEqual("DD/MM/YYYY");
			expect(res.body.data.formato_moneda).toEqual("USD");
		});

		it("debería retornar 404 cuando no se encuentre la configuración", async () => {
			mockPool.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/configuracion/aplicacion");

			expect(res.statusCode).toEqual(404);
		});

		it("debería retornar 500 en error de BD", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB error"));

			const res = await request(app).get("/api/configuracion/aplicacion");

			expect(res.statusCode).toEqual(500);
		});
	});

	describe("PUT /api/configuracion/aplicacion", () => {
		it("debería actualizar la configuración exitosamente", async () => {
			const updateData = {
				idioma: "es",
				zona_horaria: "UTC-5",
				formato_fecha: "DD/MM/YYYY",
				formato_moneda: "USD",
			};

			mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("message");
			expect(res.body.data.nuevaConfiguracion.idioma).toEqual("es");
		});

		it("debería retornar 400 cuando falten campos obligatorios", async () => {
			const updateData = {
				idioma: "es",
			};

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("debería retornar 400 cuando el idioma no sea válido", async () => {
			const updateData = {
				idioma: "de",
				zona_horaria: "UTC-5",
				formato_fecha: "DD/MM/YYYY",
				formato_moneda: "MXN",
			};

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("Idioma no válido.");
		});

		it("debería retornar 400 cuando la zona horaria no sea válida", async () => {
			const updateData = {
				idioma: "es",
				zona_horaria: "UTC+10",
				formato_fecha: "DD/MM/YYYY",
				formato_moneda: "MXN",
			};

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("Zona horaria no válida.");
		});

		it("debería retornar 500 en error de BD", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB error"));

			const res = await request(app).put("/api/configuracion/aplicacion").send({
				idioma: "es",
				zona_horaria: "UTC-5",
				formato_fecha: "DD/MM/YYYY",
				formato_moneda: "USD",
			});

			expect(res.statusCode).toEqual(500);
		});
	});

	describe("GET /api/configuracion/perfil", () => {
		it("debería retornar el perfil del usuario", async () => {
			const mockUserRow = [
				1,
				"Juan Pérez",
				"juan@empresa.com",
				"hashed",
				"Ventas",
				null,
				"Administrador",
				"https://example.com/photo.jpg",
				"2024-01-01T00:00:00.000",
				"2024-01-01T00:00:00.000",
			];
			const mockUser = {
				id: 1,
				nombre: "Juan Pérez",
				email: "juan@empresa.com",
				contrasena: "hashed",
				departamento: "Ventas",
				fecha_ingreso: null,
				rol: "Administrador",
				foto_url: "https://example.com/photo.jpg",
				created_at: "2024-01-01T00:00:00.000Z",
				updated_at: "2024-01-01T00:00:00.000Z",
			};

			mockPool.query.mockResolvedValueOnce([[mockUserRow], []]);

			const res = await request(app).get("/api/configuracion/perfil");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toEqual(mockUser);
		});

		it("debería retornar 400 cuando no se proporcione el ID del usuario", async () => {
			const appNoAuth = express();
			appNoAuth.use(express.json());
			appNoAuth.get(
				"/api/configuracion/perfil",
				(req, _res, next) => {
					req.user = null;
					next();
				},
				configuracionController.perfilUsuario,
			);

			const res = await request(appNoAuth).get("/api/configuracion/perfil");

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("debería retornar 404 cuando no se encuentre el usuario", async () => {
			mockPool.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/configuracion/perfil");

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
		});

		it("debería retornar 500 en error de base de datos", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/configuracion/perfil");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("PUT /api/configuracion/perfil", () => {
		it("debería actualizar el perfil del usuario exitosamente", async () => {
			const mockUserRow = [
				1,
				"",
				"",
				"hashed_password",
				"",
				null,
				"",
				"",
				"",
				"",
			];
			const updateData = {
				nombre: "Juan Carlos",
				email: "juancarlos@empresa.com",
				departamento: "TI",
				contrasena_actual: "oldPassword123",
			};

			mockPool.query
				.mockResolvedValueOnce([[mockUserRow], []])
				.mockResolvedValueOnce([{ affectedRows: 1 }]);
			hashService.verificarHash.mockResolvedValueOnce(true);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("message");
		});

		it("debería retornar 400 cuando falte la contraseña actual", async () => {
			const updateData = {
				nombre: "Juan Carlos",
				email: "juancarlos@empresa.com",
			};

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("debería retornar 401 cuando la contraseña actual sea incorrecta", async () => {
			const mockUserRow = [
				1,
				"",
				"",
				"hashed_password",
				"",
				null,
				"",
				"",
				"",
				"",
			];
			const updateData = {
				nombre: "Juan Carlos",
				contrasena_actual: "wrongPassword",
			};

			mockPool.query.mockResolvedValueOnce([[mockUserRow], []]);
			hashService.verificarHash.mockResolvedValueOnce(false);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(401);
			expect(res.body).toHaveProperty("error");
		});

		it("debería retornar 404 cuando no se encuentre el usuario para verificar la contraseña", async () => {
			const updateData = {
				nombre: "Juan Carlos",
				contrasena_actual: "password123",
			};

			mockPool.query.mockResolvedValueOnce([[], []]);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
		});

		it("debería retornar 400 cuando no haya campos para actualizar", async () => {
			const mockUserRow = [
				1,
				"",
				"",
				"hashed_password",
				"",
				null,
				"",
				"",
				"",
				"",
			];
			const updateData = {
				contrasena_actual: "password123",
			};

			mockPool.query.mockResolvedValueOnce([[mockUserRow], []]);
			hashService.verificarHash.mockResolvedValueOnce(true);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("debería retornar 400 cuando el correo no sea válido", async () => {
			const updateData = {
				email: "invalid-email",
				contrasena_actual: "password123",
			};

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("debería actualizar la contraseña cuando se proporcione nueva_contrasena", async () => {
			const mockUserRow = [
				1,
				"",
				"",
				"hashed_password",
				"",
				null,
				"",
				"",
				"",
				"",
			];
			const updateData = {
				nombre: "Juan Carlos",
				contrasena_actual: "password123",
				nueva_contrasena: "newPassword456",
				confirmar_nueva_contrasena: "newPassword456",
			};

			mockPool.query
				.mockResolvedValueOnce([[mockUserRow], []])
				.mockResolvedValueOnce([{ affectedRows: 1 }]);
			hashService.verificarHash.mockResolvedValueOnce(true);
			hashService.generarHash.mockResolvedValueOnce("newHashedPassword");

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("message");
			expect(hashService.generarHash).toHaveBeenCalledTimes(1);
		});

		it("debería retornar 400 cuando las contraseñas no coincidan", async () => {
			const mockUserRow = [
				1,
				"",
				"",
				"hashed_password",
				"",
				null,
				"",
				"",
				"",
				"",
			];
			const updateData = {
				contrasena_actual: "password123",
				nueva_contrasena: "newPassword456",
				confirmar_nueva_contrasena: "differentPassword",
			};

			mockPool.query.mockResolvedValueOnce([[mockUserRow], []]);
			hashService.verificarHash.mockResolvedValueOnce(true);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});
	});
});
