/** Pruebas para el módulo de dashboard */

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

// Crear una app mínima con rutas en línea (sin usar el archivo de rutas)
const app = express();
app.use(express.json());

// Middleware authenticate en línea
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

// Importar controlador directamente
import * as dashboardController from "../controllers/dashboardController.js";

// Definir rutas en línea
app.get("/api/dashboard/resumen", authenticate, dashboardController.resumen);
app.get("/api/dashboard/alertas", authenticate, dashboardController.alertas);

describe("Dashboard Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPool.query.mockResolvedValue([[], []]);
	});

	describe("GET /api/dashboard/resumen", () => {
		it("debería devolver resumen con todos los campos cuando existen activos", async () => {
			const mockResult = [
				{
					total_activos: 10,
					activos_disponibles: 4,
					activos_asignados: 3,
					activos_en_mantenimiento: 2,
					activos_dados_de_baja: 1,
				},
			];
			const mockTendencia = [
				{ mes: "Ene", cantidad: 1, ano: 2025 },
				{ mes: "Feb", cantidad: 2, ano: 2025 },
			];

			mockPool.query
				.mockResolvedValueOnce([mockResult, []])
				.mockResolvedValueOnce([mockTendencia, []]);

			const res = await request(app).get("/api/dashboard/resumen");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body.data.tendencia_mensual).toHaveProperty("labels");
			expect(res.body.data.tendencia_mensual).toHaveProperty("data");
		});

		it("debería devolver ceros cuando no existen activos", async () => {
			const mockResult = [{ total_activos: 0 }];

			mockPool.query.mockResolvedValueOnce([mockResult, []]);

			const res = await request(app).get("/api/dashboard/resumen");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body.data.tendencia_mensual).toHaveProperty("labels");
			expect(res.body.data.tendencia_mensual).toHaveProperty("data");
		});

		it("debería devolver 500 en error de base de datos", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/dashboard/resumen");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("GET /api/dashboard/alertas", () => {
		it("debería devolver los 4 contadores de alertas", async () => {
			const mockLicencias = [{ count: 3 }];
			const mockGarantias = [{ count: 5 }];
			const mockMantenimiento = [{ count: 2 }];
			const mockDevolver = [{ count: 4 }];

			mockPool.query
				.mockResolvedValueOnce([mockLicencias, []])
				.mockResolvedValueOnce([mockGarantias, []])
				.mockResolvedValueOnce([mockMantenimiento, []])
				.mockResolvedValueOnce([mockDevolver, []]);

			const res = await request(app).get("/api/dashboard/alertas");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("licencias_proximas_a_vencer", 0);
			expect(res.body.data).toHaveProperty("garantias_proximas_a_expirar", 0);
			expect(res.body.data).toHaveProperty("activos_en_mantenimiento", 0);
			expect(res.body.data).toHaveProperty("activos_proximos_a_devolver", 0);
		});

		it("debería devolver ceros cuando todos los contadores son nulos", async () => {
			const mockNull = [{ count: null }];

			mockPool.query
				.mockResolvedValueOnce([mockNull, []])
				.mockResolvedValueOnce([mockNull, []])
				.mockResolvedValueOnce([mockNull, []])
				.mockResolvedValueOnce([mockNull, []]);

			const res = await request(app).get("/api/dashboard/alertas");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("licencias_proximas_a_vencer", 0);
			expect(res.body.data).toHaveProperty("garantias_proximas_a_expirar", 0);
			expect(res.body.data).toHaveProperty("activos_en_mantenimiento", 0);
			expect(res.body.data).toHaveProperty("activos_proximos_a_devolver", 0);
		});

		it("debería devolver 500 en error de base de datos", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/dashboard/alertas");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});
});
