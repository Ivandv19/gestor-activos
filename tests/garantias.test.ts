/** Pruebas para el módulo de garantías */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// 1. Mock de BD
// Mock de BD con mysql2 para Drizzle
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

// Crear una app mínima con rutas inline (sin depender del archivo de rutas)
const app = express();
app.use(express.json());

// Middleware authenticate inline
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

// Importar controlador directamente
import * as garantiasController from "../controllers/garantiasController.js";
import { validar } from "../middleware/validar.js";
import {
	createGarantiaSchema,
	updateGarantiaSchema,
} from "../schemas/garantias.js";

// Definir rutas inline
app.get("/api/garantias", authenticate, garantiasController.listarGarantias);
app.post(
	"/api/garantias",
	authenticate,
	validar(createGarantiaSchema),
	garantiasController.crearGarantia,
);
app.patch(
	"/api/garantias/:id",
	authenticate,
	validar(updateGarantiaSchema),
	garantiasController.actualizarGarantia,
);
app.delete(
	"/api/garantias/:id",
	authenticate,
	garantiasController.eliminarGarantia,
);

describe("Garantias Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPool.query.mockResolvedValue([[], []]);
	});

	describe("GET /api/garantias", () => {
		it("debería devolver lista de garantías con paginación", async () => {
			const mockGarantias = [
				[
					1,
					"Laptop Dell",
					"Dell Inc",
					"2024-01-01",
					"2025-01-01",
					"100",
					"Standard",
					"Vigente",
					"Garantía estándar",
					"Garantía Laptop",
				],
			];
			const mockCount = [[1]];

			mockPool.query
				.mockResolvedValueOnce([mockGarantias, []])
				.mockResolvedValueOnce([mockCount, []]);

			const res = await request(app).get("/api/garantias");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body.data).toHaveLength(1);
			expect(res.body.data[0]).toHaveProperty("id", 1);
			expect(res.body.data[0]).toHaveProperty("activo", "Laptop Dell");
			expect(res.body).toHaveProperty("pagination");
			expect(res.body.pagination).toHaveProperty("page", 1);
			expect(res.body.pagination).toHaveProperty("limit", 10);
			expect(res.body.pagination).toHaveProperty("total", 1);
		});

		it("debería devolver lista vacía cuando no existen garantías", async () => {
			mockPool.query
				.mockResolvedValueOnce([[], []])
				.mockResolvedValueOnce([[[0]], []]);

			const res = await request(app).get("/api/garantias");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toEqual([]);
			expect(res.body.pagination.total).toEqual(0);
		});

		it("debería usar paginación predeterminada cuando faltan parámetros", async () => {
			const mockGarantias = [];

			mockPool.query
				.mockResolvedValueOnce([mockGarantias, []])
				.mockResolvedValueOnce([[[0]], []]);

			const res = await request(app).get("/api/garantias");

			expect(res.statusCode).toEqual(200);
			expect(res.body.pagination).toHaveProperty("page", 1);
			expect(res.body.pagination).toHaveProperty("limit", 10);
		});

		it("debería devolver 500 en error de base de datos", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/garantias");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("POST /api/garantias", () => {
		const validGarantia = {
			activo_id: 1,
			proveedor_garantia_id: 1,
			nombre_garantia: "Garantía Extendida",
			fecha_inicio: "2024-01-01",
			fecha_fin: "2025-12-31",
			costo: 150,
			condiciones: "Premium",
			estado: "Vigente",
			descripcion: "Garantía extendida premium",
		};

		it("debería crear garantía exitosamente", async () => {
			const mockActivo = [{ id: 1, nombre: "Laptop Dell" }];
			const mockProveedor = [{ id: 1 }];
			const mockInsert = { insertId: 1 };
			const mockHistorial = [{ insertId: 1 }];

			mockPool.query
				.mockResolvedValueOnce([mockActivo, []])
				.mockResolvedValueOnce([mockProveedor, []])
				.mockResolvedValueOnce([mockInsert, []])
				.mockResolvedValueOnce([mockHistorial, []]);

			const res = await request(app).post("/api/garantias").send(validGarantia);

			expect(res.statusCode).toEqual(201);
			expect(res.body.data).toHaveProperty("id", 1);
			expect(res.body.data).toHaveProperty("activo_id", 1);
			expect(res.body.data).toHaveProperty(
				"nombre_garantia",
				"Garantía Extendida",
			);
			expect(res.body).toHaveProperty(
				"message",
				"Garantía registrada correctamente",
			);
		});

		it("debería fallar con 400 cuando faltan campos obligatorios", async () => {
			const res = await request(app).post("/api/garantias").send({
				activo_id: 1,
			});

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("debería fallar con 400 cuando fecha_fin es anterior a fecha_inicio", async () => {
			const res = await request(app).post("/api/garantias").send({
				activo_id: 1,
				proveedor_garantia_id: 1,
				nombre_garantia: "Garantía",
				fecha_inicio: "2025-01-01",
				fecha_fin: "2024-01-01",
				estado: "Vigente",
			});

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty(
				"error",
				"La fecha de fin debe ser posterior a la fecha de inicio.",
			);
		});

		it("debería fallar con 400 cuando el estado es inválido", async () => {
			const res = await request(app).post("/api/garantias").send({
				activo_id: 1,
				proveedor_garantia_id: 1,
				nombre_garantia: "Garantía",
				fecha_inicio: "2024-01-01",
				fecha_fin: "2025-12-31",
				estado: "Invalido",
			});

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("DELETE /api/garantias/:id", () => {
		it("debería eliminar garantía físicamente", async () => {
			const mockGarantia = [{ id: 1 }];

			mockPool.query.mockResolvedValueOnce([mockGarantia, []]);
			mockPool.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app).delete("/api/garantias/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty(
				"message",
				"Garantía eliminada físicamente",
			);
		});

		it("debería devolver 500 en error de base de datos", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).delete("/api/garantias/1");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});
});
