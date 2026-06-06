/** Pruebas para el módulo de reportes */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// 1. Mock de BD
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

// Inline authenticate middleware
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

// Inline checkRole middleware
const checkRole = (_role) => (_req, _res, next) => {
	next();
};

// Create a minimal app with inline routes (bypassing the routes file)
const app = express();
app.use(express.json());

// Import controller directly
import * as reporteController from "../controllers/reporteController.js";

const { validar } = require("../middleware/validar");
const { generarReporteSchema } = require("../schemas/reporte");

// Define routes inline
app.get(
	"/api/reportes/tipos",
	authenticate,
	checkRole("Administrador"),
	reporteController.tiposReporte,
);
app.get(
	"/api/reportes/datos-auxiliares",
	authenticate,
	checkRole("Administrador"),
	reporteController.datosAuxiliares,
);
app.post(
	"/api/reportes/generar",
	authenticate,
	checkRole("Administrador"),
	validar(generarReporteSchema),
	reporteController.generar,
);

describe("Reporte Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPool.query.mockResolvedValue([[], []]);
	});

	describe("GET /api/reportes/tipos", () => {
		it("should return all report types when they exist", async () => {
			const mockTipos = [
				{
					id: 1,
					nombre: "Activos por estado",
					descripcion: "Agrupa activos por su estado actual.",
					activo: true,
				},
				{
					id: 2,
					nombre: "Activos asignados por usuario",
					descripcion: "Muestra cuántos activos tiene cada usuario.",
					activo: true,
				},
			];

			mockPool.query.mockResolvedValueOnce([mockTipos, []]);

			const res = await request(app).get("/api/reportes/tipos");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("tiposReporte");
			expect(res.body.data.tiposReporte).toHaveLength(2);
			expect(res.body.data.tiposReporte[0]).toHaveProperty("created_at");
			expect(res.body.data.tiposReporte[0]).toHaveProperty("updated_at");
		});

		it("should return 404 when no report types exist", async () => {
			mockPool.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/reportes/tipos");

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty(
				"error",
				"No existen tipos de reporte registrados.",
			);
		});

		it("should return 500 on database error", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/reportes/tipos");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error", "Error en la consulta.");
		});
	});

	describe("GET /api/reportes/datos-auxiliares", () => {
		it("should return all auxiliary data", async () => {
			const mockTiposActivo = [
				{ id: 1, nombre: "Hardware" },
				{ id: 2, nombre: "Software" },
			];
			const mockUsuarios = [
				{ id: 1, nombre: "Ana López" },
				{ id: 2, nombre: "Carlos Ruiz" },
			];
			const mockUbicaciones = [{ id: 1, nombre: "Oficina Central" }];
			const mockProveedores = [{ id: 1, nombre: "TecnoSoluciones" }];

			mockPool.query
				.mockResolvedValueOnce([mockTiposActivo, []])
				.mockResolvedValueOnce([mockUsuarios, []])
				.mockResolvedValueOnce([mockUbicaciones, []])
				.mockResolvedValueOnce([mockProveedores, []]);

			const res = await request(app).get("/api/reportes/datos-auxiliares");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("tiposActivo");
			expect(res.body.data).toHaveProperty("usuarios");
			expect(res.body.data).toHaveProperty("ubicaciones");
			expect(res.body.data).toHaveProperty("proveedores");
			expect(res.body.data.tiposActivo).toHaveLength(2);
			expect(res.body.data.usuarios).toHaveLength(2);
		});

		it("should return 500 on database error", async () => {
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/reportes/datos-auxiliares");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("POST /api/reportes/generar", () => {
		it("should generate report tipo 1 (Activos por estado) successfully", async () => {
			const mockTipoReporte = [
				[1, "Activos por estado", "Agrupa activos por su estado actual."],
			];
			const mockResultados = [
				{ estado: "Disponible", cantidad: 4 },
				{ estado: "Asignado", cantidad: 3 },
				{ estado: "En mantenimiento", cantidad: 2 },
			];

			mockPool.query.mockResolvedValueOnce([mockTipoReporte, []]);

			mockPool.execute.mockResolvedValueOnce([mockResultados, []]);

			const res = await request(app)
				.post("/api/reportes/generar")
				.send({ tipo_id: 1, filtros: {} });

			console.log("GEN STATUS:", res.statusCode);
			console.log("GEN BODY:", JSON.stringify(res.body, null, 2));
			console.log("GEN QUERY CALLS:", mockPool.query.mock.calls.length);
			console.log("GEN EXECUTE CALLS:", mockPool.execute.mock.calls.length);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty(
				"message",
				"Reporte generado exitosamente.",
			);
			expect(res.body.data).toHaveProperty(
				"tipo_reporte",
				"Activos por estado",
			);
			expect(res.body.data.resultados).toHaveProperty("resumen");
			expect(res.body.data.resultados).toHaveProperty("detalles");
		});

		it("should return 400 when tipo_id is missing", async () => {
			const res = await request(app)
				.post("/api/reportes/generar")
				.send({ filtros: {} });

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 400 when tipo_id is invalid", async () => {
			const mockTipoReporte = [
				{
					id: 1,
					nombre: "Activos por estado",
					descripcion: "Agrupa activos por su estado actual.",
				},
			];

			mockPool.query
				.mockResolvedValueOnce([mockTipoReporte, []])
				.mockRejectedValueOnce(new Error("Invalid report type"));

			const res = await request(app)
				.post("/api/reportes/generar")
				.send({ tipo_id: 999, filtros: {} });

			console.log("INVALID STATUS:", res.statusCode);
			console.log("INVALID BODY:", JSON.stringify(res.body, null, 2));

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty(
				"error",
				"Tipo de reporte no válido: 999",
			);
		});

		it("should return 500 on database error", async () => {
			const mockTipoReporte = [
				{
					id: 1,
					nombre: "Activos por estado",
					descripcion: "Agrupa activos por su estado actual.",
				},
			];

			mockPool.query
				.mockResolvedValueOnce([mockTipoReporte, []])
				.mockRejectedValueOnce(new Error("SQL syntax error"));

			const res = await request(app)
				.post("/api/reportes/generar")
				.send({ tipo_id: 1, filtros: {} });

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error", "Error al generar el reporte.");
		});
	});
});
