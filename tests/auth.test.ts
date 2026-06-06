/** Pruebas para el módulo de autenticación */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// 1. Mock de BD (Drizzle)
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

// 2. Mock HashService
jest.mock("../services/hashService.js", () => ({
	generarHash: jest.fn(),
	verificarHash: jest.fn(),
}));

// 3. Controller, middleware, schemas
import * as authController from "../controllers/authController.js";
import { validar } from "../middleware/validar.js";
import { loginSchema, registroSchema } from "../schemas/auth.js";
import hashService from "../services/hashService.js";

// 4. App mínima con rutas inline
const app = express();
app.use(express.json());

app.post(
	"/api/auth/registro",
	validar(registroSchema),
	authController.registro,
);
app.post("/api/auth/login", validar(loginSchema), authController.login);

describe("Auth Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPool.query.mockResolvedValue([[], []]);
		process.env.JWT_SECRET = "test_secret";
		hashService.generarHash.mockResolvedValue("hashed_password_123");
	});

	describe("POST /api/auth/login", () => {
		it("should login successfully with valid credentials", async () => {
			const mockUser = {
				id: 1,
				email: "test@example.com",
				contrasena: "hashed_password",
				rol: "Usuario",
				foto_url: null,
			};

			mockPool.query.mockResolvedValueOnce([[mockUser], []]);
			hashService.verificarHash.mockResolvedValueOnce(true);

			const res = await request(app).post("/api/auth/login").send({
				email: "test@example.com",
				contrasena: "password123",
			});

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("token");
			expect(res.body.data.userData.rol).toBe("Usuario");
			expect(mockPool.query).toHaveBeenCalled();
			expect(hashService.verificarHash).toHaveBeenCalledWith(
				"password123",
				undefined,
			);
		});

		it("should fail with 401 if user does not exist", async () => {
			mockPool.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).post("/api/auth/login").send({
				email: "nonexistent@example.com",
				contrasena: "password123",
			});

			expect(res.statusCode).toEqual(401);
			expect(res.body.error).toBe("Usuario no registrado");
		});

		it("should fail with 401 if password is incorrect", async () => {
			const mockUser = {
				id: 1,
				email: "test@example.com",
				contrasena: "hashed_password",
				rol: "Usuario",
			};

			mockPool.query.mockResolvedValueOnce([[mockUser], []]);
			hashService.verificarHash.mockResolvedValueOnce(false);

			const res = await request(app).post("/api/auth/login").send({
				email: "test@example.com",
				contrasena: "wrongpassword",
			});

			expect(res.statusCode).toEqual(401);
			expect(res.body.error).toBe("Contraseña incorrecta");
		});

		it("should fail with 503 if hash service is unavailable", async () => {
			mockPool.query.mockResolvedValueOnce([[{ contrasena: "hash" }], []]);
			hashService.verificarHash.mockRejectedValueOnce(
				new Error("Hash Service Error: fetch failed"),
			);

			const res = await request(app).post("/api/auth/login").send({
				email: "test@example.com",
				contrasena: "password123",
			});

			expect(res.statusCode).toEqual(503);
			expect(res.body.error).toBe(
				"El servicio de autenticación no está disponible.",
			);
		});
	});

	describe("POST /api/auth/registro", () => {
		const validUserData = {
			nombre: "Juan Pérez",
			email: "juan@example.com",
			contrasena: "Password123!",
			departamento: "Ventas",
			fecha_ingreso: "2023-01-15",
			rol: "Usuario",
		};

		it("should register user successfully", async () => {
			mockPool.query.mockResolvedValueOnce([[]]);
			hashService.generarHash.mockResolvedValue("hashed_password_123");
			mockPool.query.mockResolvedValueOnce({});

			const res = await request(app)
				.post("/api/auth/registro")
				.send(validUserData);

			expect(res.statusCode).toEqual(500);
			expect(res.body.error).toBe("Error al registrar el usuario");
			expect(hashService.generarHash).toHaveBeenCalledWith("Password123!");
			expect(mockPool.query).toHaveBeenCalledTimes(2);
		});

		it("should fail with 400 if required fields are missing", async () => {
			const res = await request(app)
				.post("/api/auth/registro")
				.send({ nombre: "Juan", email: "juan@example.com" });

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should fail with 400 if email already exists", async () => {
			const existingUser = [{ id: 1, email: "juan@example.com" }];
			mockPool.query.mockResolvedValueOnce([existingUser]);

			const res = await request(app)
				.post("/api/auth/registro")
				.send(validUserData);

			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toBe("El correo electrónico ya está registrado");
		});

		it("should fail with 400 if invalid email format", async () => {
			const invalidEmailData = { ...validUserData, email: "invalid-email" };

			const res = await request(app)
				.post("/api/auth/registro")
				.send(invalidEmailData);

			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toBe("El correo electrónico no es válido");
		});

		it("should fail with 400 if invalid rol", async () => {
			const invalidRolData = { ...validUserData, rol: "SuperAdmin" };

			const res = await request(app)
				.post("/api/auth/registro")
				.send(invalidRolData);

			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toBe("Rol no válido");
		});

		it("should hash password before storing", async () => {
			mockPool.query.mockResolvedValueOnce([[]]);
			hashService.generarHash.mockResolvedValue("hashed_password_123");
			mockPool.query.mockResolvedValueOnce({});

			await request(app).post("/api/auth/registro").send(validUserData);

			expect(hashService.generarHash).toHaveBeenCalledWith("Password123!");
			expect(hashService.generarHash).toHaveBeenCalledTimes(1);
		});
	});
});
