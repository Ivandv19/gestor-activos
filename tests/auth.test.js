const request = require("supertest");
const express = require("express");
const _jwt = require("jsonwebtoken");

// 1. Mock DB
const db = {
	query: jest.fn(),
	execute: jest.fn(),
	end: jest.fn(),
};

jest.mock("../config/db", () => db);

// 2. Mock HashService
jest.mock("../services/hashService", () => ({
	hash: jest.fn(),
	verify: jest.fn(),
}));
const hashService = require("../services/hashService");

// 3. Create minimal app with inline routes
const app = express();
app.use(express.json());

// Import controller directly
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { loginSchema, registroSchema } = require("../schemas/auth");

// Define routes inline
app.post("/api/auth/registro", validate(registroSchema), authController.registro);
app.post("/api/auth/login", validate(loginSchema), authController.login);

describe("Auth Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.JWT_SECRET = "test_secret";
		hashService.hash.mockResolvedValue("hashed_password_123");
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

			db.query.mockResolvedValueOnce([[mockUser], []]);
			hashService.verify.mockResolvedValueOnce(true);

			const res = await request(app).post("/api/auth/login").send({
				email: "test@example.com",
				contrasena: "password123",
			});

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("token");
			expect(res.body.data.userData.email).toBe("test@example.com");
			expect(db.query).toHaveBeenCalled();
			expect(hashService.verify).toHaveBeenCalledWith(
				"password123",
				"hashed_password",
			);
		});

		it("should fail with 401 if user does not exist", async () => {
			db.query.mockResolvedValueOnce([[], []]);

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

			db.query.mockResolvedValueOnce([[mockUser], []]);
			hashService.verify.mockResolvedValueOnce(false);

			const res = await request(app).post("/api/auth/login").send({
				email: "test@example.com",
				contrasena: "wrongpassword",
			});

			expect(res.statusCode).toEqual(401);
			expect(res.body.error).toBe("Contraseña incorrecta");
		});

		it("should fail with 503 if hash service is unavailable", async () => {
			db.query.mockResolvedValueOnce([[{ contrasena: "hash" }], []]);
			hashService.verify.mockRejectedValueOnce(
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
			db.query.mockResolvedValueOnce([[]]);
			hashService.hash.mockResolvedValue("hashed_password_123");
			db.query.mockResolvedValueOnce({});

			const res = await request(app)
				.post("/api/auth/registro")
				.send(validUserData);

			expect(res.statusCode).toEqual(201);
			expect(res.body.message).toBe("Usuario registrado exitosamente");
			expect(hashService.hash).toHaveBeenCalledWith("Password123!");
			expect(db.query).toHaveBeenCalledTimes(2);
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
			db.query.mockResolvedValueOnce([existingUser]);

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
			db.query.mockResolvedValueOnce([[]]);
			hashService.hash.mockResolvedValue("hashed_password_123");
			db.query.mockResolvedValueOnce({});

			await request(app).post("/api/auth/registro").send(validUserData);

			expect(hashService.hash).toHaveBeenCalledWith("Password123!");
			expect(hashService.hash).toHaveBeenCalledTimes(1);
		});
	});
});
