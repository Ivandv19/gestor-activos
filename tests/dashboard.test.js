const request = require("supertest");
const express = require("express");

// Mock DB
const db = {
	query: jest.fn(),
	execute: jest.fn(),
	end: jest.fn(),
};

jest.mock("../config/db", () => db);

// Create a minimal app with inline routes (bypassing the routes file)
const app = express();
app.use(express.json());

// Inline authenticate middleware
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

// Import controller directly
const dashboardController = require("../controllers/dashboardController");

// Define routes inline
app.get("/api/dashboard/resumen", authenticate, dashboardController.getResumen);
app.get("/api/dashboard/alertas", authenticate, dashboardController.getAlertas);

describe("Dashboard Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET /api/dashboard/resumen", () => {
		it("should return resumen with all fields when activos exist", async () => {
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

			db.query
				.mockResolvedValueOnce([mockResult, []])
				.mockResolvedValueOnce([mockTendencia, []]);

			const res = await request(app).get("/api/dashboard/resumen");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("total_activos", 10);
			expect(res.body).toHaveProperty("activos_disponibles", 4);
			expect(res.body).toHaveProperty("activos_asignados", 3);
			expect(res.body).toHaveProperty("activos_en_mantenimiento", 2);
			expect(res.body).toHaveProperty("activos_dados_de_baja", 1);
			expect(res.body).toHaveProperty("tendencia_mensual");
			expect(res.body.tendencia_mensual).toHaveProperty("labels");
			expect(res.body.tendencia_mensual).toHaveProperty("data");
			expect(res.body).toHaveProperty("ano_tendencia", 2025);
		});

		it("should return zeros when no activos exist", async () => {
			const mockResult = [{ total_activos: 0 }];

			db.query.mockResolvedValueOnce([mockResult, []]);

			const res = await request(app).get("/api/dashboard/resumen");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("total_activos", 0);
			expect(res.body).toHaveProperty("activos_disponibles", 0);
			expect(res.body).toHaveProperty("activos_asignados", 0);
			expect(res.body).toHaveProperty("activos_en_mantenimiento", 0);
			expect(res.body).toHaveProperty("activos_dados_de_baja", 0);
			expect(res.body).toHaveProperty("tendencia_mensual");
			expect(res.body.tendencia_mensual.labels).toEqual([]);
			expect(res.body.tendencia_mensual.data).toEqual([]);
			expect(res.body).toHaveProperty("ano_tendencia");
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/dashboard/resumen");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("GET /api/dashboard/alertas", () => {
		it("should return all 4 alert counters", async () => {
			const mockLicencias = [{ count: 3 }];
			const mockGarantias = [{ count: 5 }];
			const mockMantenimiento = [{ count: 2 }];
			const mockDevolver = [{ count: 4 }];

			db.query
				.mockResolvedValueOnce([mockLicencias, []])
				.mockResolvedValueOnce([mockGarantias, []])
				.mockResolvedValueOnce([mockMantenimiento, []])
				.mockResolvedValueOnce([mockDevolver, []]);

			const res = await request(app).get("/api/dashboard/alertas");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("licencias_proximas_a_vencer", 3);
			expect(res.body).toHaveProperty("garantias_proximas_a_expirar", 5);
			expect(res.body).toHaveProperty("activos_en_mantenimiento", 2);
			expect(res.body).toHaveProperty("activos_proximos_a_devolver", 4);
		});

		it("should return zeros when all counts are null", async () => {
			const mockNull = [{ count: null }];

			db.query
				.mockResolvedValueOnce([mockNull, []])
				.mockResolvedValueOnce([mockNull, []])
				.mockResolvedValueOnce([mockNull, []])
				.mockResolvedValueOnce([mockNull, []]);

			const res = await request(app).get("/api/dashboard/alertas");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("licencias_proximas_a_vencer", 0);
			expect(res.body).toHaveProperty("garantias_proximas_a_expirar", 0);
			expect(res.body).toHaveProperty("activos_en_mantenimiento", 0);
			expect(res.body).toHaveProperty("activos_proximos_a_devolver", 0);
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/dashboard/alertas");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});
});
