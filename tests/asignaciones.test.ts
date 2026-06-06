/** Pruebas para el módulo de asignaciones */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// 1. Mock de BD
jest.mock("mysql2/promise", () => {
	const thePool = {
		query: jest.fn(),
		execute: jest.fn(),
		end: jest.fn(),
		getConnection: jest.fn(() => Promise.resolve(thePool)),
		release: jest.fn(),
	};
	return { createPool: jest.fn(() => thePool), __mockPool: thePool };
});

import mysql from "mysql2/promise";

const mockPool = mysql.__mockPool;

// 2. Mock Middlewares inline
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador", email: "admin@test.com" };
	next();
};

const checkRole = (_role) => (_req, _res, next) => {
	next();
};

const _imageUploadMiddleware = (_req, _res, next) => next();

// 3. Create minimal app with inline routes
const app = express();
app.use(express.json());

// Import controller directly
import * as asignacionesController from "../controllers/asignacionesController.js";

const { validar } = require("../middleware/validar");
const {
	createAsignacionSchema,
	updateAsignacionSchema,
} = require("../schemas/asignaciones");

// Define routes inline
app.get(
	"/api/asignaciones",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.getAsignaciones,
);
app.post(
	"/api/asignaciones",
	authenticate,
	checkRole("Administrador"),
	validar(createAsignacionSchema),
	asignacionesController.createAsignacion,
);
app.get(
	"/api/asignaciones/activos-disponibles",
	authenticate,
	asignacionesController.getActivosDisponibles,
);
app.get(
	"/api/asignaciones/datos-auxiliares/:id",
	authenticate,
	asignacionesController.obtenerDatosAuxiliares,
);
app.get(
	"/api/asignaciones/:id",
	authenticate,
	asignacionesController.getAsignacionPorId,
);
app.put(
	"/api/asignaciones/:id",
	authenticate,
	checkRole("Administrador"),
	validar(updateAsignacionSchema),
	asignacionesController.updateAsignacion,
);
app.delete(
	"/api/asignaciones/:id",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.deleteAsignacion,
);

describe("Asignaciones Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPool.getConnection.mockResolvedValue(mockPool);
		mockPool.query.mockResolvedValue([[], []]);
	});

	describe("GET /api/asignaciones", () => {
		it("should return list of asignaciones", async () => {
			const mockAsignaciones = [
				[1, "Laptop", null, null, "Juan", null, null, null, null, null],
			];
			const mockCount = [[1]];

			mockPool.query.mockResolvedValueOnce([mockAsignaciones, []]);
			mockPool.query.mockResolvedValueOnce([mockCount, []]);

			const res = await request(app).get("/api/asignaciones");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveLength(1);
		});
	});

	describe("POST /api/asignaciones", () => {
		it("should create assignment successfully", async () => {
			const newAsignacion = {
				activo_id: 1,
				usuario_id: 2,
				ubicacion_id: 3,
				fecha_asignacion: "2023-01-01",
			};

			mockPool.query.mockResolvedValueOnce([[[1]], []]);
			mockPool.query.mockResolvedValueOnce([[[1]], []]);
			mockPool.query.mockResolvedValueOnce([[[1]], []]);
			mockPool.query.mockResolvedValueOnce([[["Laptop"]], []]);
			mockPool.query.mockResolvedValueOnce([[["Juan"]], []]);
			mockPool.query.mockResolvedValueOnce([[["Oficina"]], []]);
			mockPool.query.mockResolvedValueOnce([{}, []]);
			mockPool.query.mockResolvedValueOnce([
				{ insertId: 50, affectedRows: 1 },
				[],
			]);
			mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
			mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
			mockPool.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app)
				.post("/api/asignaciones")
				.send(newAsignacion);

			expect(res.statusCode).toEqual(201);
			expect(res.body.data.id).toBe(50);
			expect(res.body.message).toContain("creada");
		});

		it("should fail if entities do not exist", async () => {
			const newAsignacion = {
				activo_id: 99,
				usuario_id: 2,
				ubicacion_id: 3,
				fecha_asignacion: "2023-01-01",
			};

			mockPool.query.mockResolvedValueOnce([[[0]], []]);

			const res = await request(app)
				.post("/api/asignaciones")
				.send(newAsignacion);

			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toContain("activo no existe");
		});
	});

	describe("DELETE /api/asignaciones/:id", () => {
		it("should delete assignment and free asset", async () => {
			mockPool.query.mockResolvedValueOnce([[[1, 10, "Laptop"]], []]);
			mockPool.query.mockResolvedValueOnce([{}, []]);
			mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
			mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
			mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
			mockPool.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app).delete("/api/asignaciones/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toContain("eliminada");
		});
	});

	describe("GET /api/asignaciones/:id", () => {
		it("should return asignacion details if found", async () => {
			mockPool.query.mockResolvedValueOnce([
				[
					[
						1,
						10,
						"Laptop Dell",
						"laptop.jpg",
						5,
						"Juan Pérez",
						3,
						"Oficina Central",
						"2023-05-15",
						null,
						"Asignado para trabajo remoto",
					],
				],
				[],
			]);

			const res = await request(app).get("/api/asignaciones/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data.id).toBe(1);
		});

		it("should fail with 404 if asignacion not found", async () => {
			mockPool.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/asignaciones/999");

			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toContain("no existe");
		});

		it("should fail with 500 on DB error", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection error"));

			const res = await request(app).get("/api/asignaciones/1");

			expect(res.statusCode).toEqual(500);
			expect(res.body.error).toContain("Error al obtener");
		});
	});

	describe("PUT /api/asignaciones/:id", () => {
		it("should update asignacion successfully", async () => {
			const updateData = {
				fecha_devolucion: "2023-12-01",
				usuario_id: 10,
				ubicacion_id: 5,
			};

			mockPool.query.mockResolvedValueOnce([
				[[1, 10, 5, 3, null, null, null, 1]],
				[],
			]);
			mockPool.query.mockResolvedValueOnce([[["Laptop"]], []]);
			mockPool.query.mockResolvedValueOnce([[["Juan"]], []]);
			mockPool.query.mockResolvedValueOnce([[["Oficina"]], []]);
			mockPool.query.mockResolvedValueOnce([[["Maria"]], []]);
			mockPool.query.mockResolvedValueOnce([[["Sala B"]], []]);
			mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
			mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);

			const res = await request(app)
				.put("/api/asignaciones/1")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toContain("actualizada");
		});

		it("should fail with 404 if asignacion not found", async () => {
			mockPool.query.mockResolvedValueOnce([[], []]);

			const res = await request(app)
				.put("/api/asignaciones/999")
				.send({ fecha_devolucion: "2023-12-01" });

			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toContain("no existe");
		});

		it("should fail with 400 if validation fails (invalid fecha)", async () => {
			mockPool.query.mockResolvedValueOnce([
				[[1, 10, 5, 3, null, null, null, 1]],
				[],
			]);
			mockPool.query.mockResolvedValueOnce([[["Laptop"]], []]);
			mockPool.query.mockResolvedValueOnce([[["Juan"]], []]);
			mockPool.query.mockResolvedValueOnce([[["Oficina"]], []]);

			const res = await request(app)
				.put("/api/asignaciones/1")
				.send({ fecha_devolucion: "invalid-date" });

			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toContain("inválido");
		});

		it("should fail with 500 on DB error", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection error"));

			const res = await request(app)
				.put("/api/asignaciones/1")
				.send({ fecha_devolucion: "2023-12-01" });

			expect(res.statusCode).toEqual(500);
			expect(res.body.error).toContain("Error al actualizar");
		});
	});

	describe("GET /api/asignaciones/activos-disponibles", () => {
		it("should return list of disponibles activos", async () => {
			const mockActivos = [
				[
					1,
					"Laptop HP",
					"Equipo de cómputo",
					"Disponible",
					"HP Inc",
					"Almacén",
					"laptop.jpg",
				],
			];
			const mockCount = [[1]];

			mockPool.query.mockResolvedValueOnce([mockActivos, []]);
			mockPool.query.mockResolvedValueOnce([mockCount, []]);

			const res = await request(app).get(
				"/api/asignaciones/activos-disponibles",
			);

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveLength(1);
			expect(res.body.pagination.total).toBe(1);
		});

		it("should return empty list if none available", async () => {
			const mockCount = [[0]];

			mockPool.query.mockResolvedValueOnce([[], []]);
			mockPool.query.mockResolvedValueOnce([mockCount, []]);

			const res = await request(app).get(
				"/api/asignaciones/activos-disponibles",
			);

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveLength(0);
		});

		it("should fail with 500 on DB error", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection error"));

			const res = await request(app).get(
				"/api/asignaciones/activos-disponibles",
			);

			expect(res.statusCode).toEqual(500);
			expect(res.body.error).toContain("Error al obtener");
		});
	});

	describe("GET /api/asignaciones/datos-auxiliares/:id", () => {
		it("should return tipos, usuarios, ubicaciones", async () => {
			const mockUsuarios = [[1, "Juan"]];
			const mockTipos = [[1, "Laptop"]];
			const mockProveedores = [[1, "Dell"]];
			const mockUbicaciones = [[1, "Oficina"]];
			const mockActivo = [["Laptop Dell", "dell.jpg"]];

			mockPool.query.mockResolvedValueOnce([mockUsuarios, []]);
			mockPool.query.mockResolvedValueOnce([mockTipos, []]);
			mockPool.query.mockResolvedValueOnce([mockProveedores, []]);
			mockPool.query.mockResolvedValueOnce([mockUbicaciones, []]);
			mockPool.query.mockResolvedValueOnce([mockActivo, []]);

			const res = await request(app).get(
				"/api/asignaciones/datos-auxiliares/1",
			);

			expect(res.statusCode).toEqual(200);
			expect(res.body.data.usuarios).toHaveLength(1);
			expect(res.body.data.tiposActivos).toHaveLength(1);
			expect(res.body.data.proveedores).toHaveLength(1);
			expect(res.body.data.ubicaciones).toHaveLength(1);
			expect(res.body.data.nombre).toBe("Laptop Dell");
		});

		it("should fail with 500 on DB error", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection error"));

			const res = await request(app).get(
				"/api/asignaciones/datos-auxiliares/1",
			);

			expect(res.statusCode).toEqual(500);
			expect(res.body.error).toContain("Error");
		});
	});
});
