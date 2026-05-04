const request = require("supertest");
const express = require("express");
const db = require("../config/db");

// Create a minimal app with inline routes (bypassing the routes file)
const app = express();
app.use(express.json());

// Inline authenticate middleware
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

// Inline checkRole middleware
const checkRole = (_role) => (_req, _res, next) => {
	next();
};

// Import controller directly
const reporteController = require("../controllers/reporteController");

// Define routes inline
app.get(
	"/api/reportes/tipos",
	authenticate,
	checkRole("Administrador"),
	reporteController.getTiposReporte,
);
app.get(
	"/api/reportes/datos-auxiliares",
	authenticate,
	checkRole("Administrador"),
	reporteController.getDatosAuxiliares,
);
app.post(
	"/api/reportes/generar",
	authenticate,
	checkRole("Administrador"),
	reporteController.generarReporte,
);

describe("Reporte Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		db.query.mockReset();
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

			db.query.mockResolvedValueOnce([mockTipos, []]);

			const res = await request(app).get("/api/reportes/tipos");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("success", true);
			expect(res.body).toHaveProperty("tiposReporte");
			expect(res.body.tiposReporte).toHaveLength(2);
			expect(res.body.tiposReporte[0]).toHaveProperty("id", 1);
			expect(res.body.tiposReporte[0]).toHaveProperty(
				"nombre",
				"Activos por estado",
			);
		});

		it("should return 404 when no report types exist", async () => {
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/reportes/tipos");

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty(
				"error",
				"No existen tipos de reporte registrados.",
			);
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

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

			db.query
				.mockResolvedValueOnce([mockTiposActivo, []])
				.mockResolvedValueOnce([mockUsuarios, []])
				.mockResolvedValueOnce([mockUbicaciones, []])
				.mockResolvedValueOnce([mockProveedores, []]);

			const res = await request(app).get("/api/reportes/datos-auxiliares");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("tiposActivo");
			expect(res.body).toHaveProperty("usuarios");
			expect(res.body).toHaveProperty("ubicaciones");
			expect(res.body).toHaveProperty("proveedores");
			expect(res.body.tiposActivo).toHaveLength(2);
			expect(res.body.usuarios).toHaveLength(2);
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/reportes/datos-auxiliares");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("message");
		});
	});

	describe("POST /api/reportes/generar", () => {
		it("should generate report tipo 1 (Activos por estado) successfully", async () => {
			const mockTipoReporte = [
				{
					id: 1,
					nombre: "Activos por estado",
					descripcion: "Agrupa activos por su estado actual.",
				},
			];
			const mockResultados = [
				{ estado: "Disponible", cantidad: 4 },
				{ estado: "Asignado", cantidad: 3 },
				{ estado: "En mantenimiento", cantidad: 2 },
			];

			db.query
				.mockResolvedValueOnce([mockTipoReporte, []])
				.mockResolvedValueOnce([mockResultados, []])
				.mockResolvedValueOnce([[{ nombre: "Todos" }], []])
				.mockResolvedValueOnce([[{ nombre: "Todos" }], []])
				.mockResolvedValueOnce([[{ nombre: "Todos" }], []])
				.mockResolvedValueOnce([[{ nombre: "Todos" }], []]);

			const res = await request(app)
				.post("/api/reportes/generar")
				.send({ tipo_id: 1, filtros: {} });

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("success", true);
			expect(res.body).toHaveProperty(
				"message",
				"Reporte generado exitosamente.",
			);
			expect(res.body).toHaveProperty("tipo_reporte", "Activos por estado");
			expect(res.body.resultados).toHaveProperty("resumen");
			expect(res.body.resultados).toHaveProperty("detalles");
		});

		it("should return 400 when tipo_id is missing", async () => {
			const res = await request(app)
				.post("/api/reportes/generar")
				.send({ filtros: {} });

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty(
				"error",
				"El campo 'tipo_id' es obligatorio.",
			);
		});

		it("should return 400 when tipo_id is invalid", async () => {
			const mockTipoReporte = [
				{
					id: 1,
					nombre: "Activos por estado",
					descripcion: "Agrupa activos por su estado actual.",
				},
			];

			db.query
				.mockResolvedValueOnce([mockTipoReporte, []])
				.mockRejectedValueOnce(new Error("Invalid report type"));

			const res = await request(app)
				.post("/api/reportes/generar")
				.send({ tipo_id: 999, filtros: {} });

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error", "Tipo de reporte no válido.");
		});

		it("should return 500 on database error", async () => {
			const mockTipoReporte = [
				{
					id: 1,
					nombre: "Activos por estado",
					descripcion: "Agrupa activos por su estado actual.",
				},
			];

			db.query
				.mockResolvedValueOnce([mockTipoReporte, []])
				.mockRejectedValueOnce(new Error("SQL syntax error"));

			const res = await request(app)
				.post("/api/reportes/generar")
				.send({ tipo_id: 1, filtros: {} });

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("success", false);
			expect(res.body).toHaveProperty(
				"message",
				"Error al generar el reporte.",
			);
		});
	});
});
