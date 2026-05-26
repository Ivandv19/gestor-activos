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
const garantiasController = require("../controllers/garantiasController");
const validate = require("../middleware/validate");
const { createGarantiaSchema, updateGarantiaSchema } = require("../schemas/garantias");

// Define routes inline
app.get("/api/garantias", authenticate, garantiasController.getGarantias);
app.post("/api/garantias", authenticate, validate(createGarantiaSchema), garantiasController.createGarantia);
app.patch(
	"/api/garantias/:id",
	authenticate,
	validate(updateGarantiaSchema),
	garantiasController.updateGarantia,
);
app.delete(
	"/api/garantias/:id",
	authenticate,
	garantiasController.deleteGarantia,
);

describe("Garantias Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET /api/garantias", () => {
		it("should return list of garantias with pagination", async () => {
			const mockGarantias = [
				{
					id: 1,
					activo: "Laptop Dell",
					proveedor_garantia: "Dell Inc",
					fecha_inicio: "2024-01-01",
					fecha_fin: "2025-01-01",
					costo: 100,
					condiciones: "Standard",
					estado: "Vigente",
					descripcion: "Garantía estándar",
					nombre_garantia: "Garantía Laptop",
				},
			];
			const mockCount = [{ total: 1 }];

			db.query
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

		it("should return empty list when no garantias exist", async () => {
			db.query
				.mockResolvedValueOnce([[], []])
				.mockResolvedValueOnce([[{ total: 0 }], []]);

			const res = await request(app).get("/api/garantias");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toEqual([]);
			expect(res.body.pagination.total).toEqual(0);
		});

		it("should use default pagination when params are missing", async () => {
			const mockGarantias = [];
			const mockCount = [[{ total: 0 }], []];

			db.query
				.mockResolvedValueOnce([mockGarantias, []])
				.mockResolvedValueOnce(mockCount);

			const res = await request(app).get("/api/garantias");

			expect(res.statusCode).toEqual(200);
			expect(res.body.pagination).toHaveProperty("page", 1);
			expect(res.body.pagination).toHaveProperty("limit", 10);
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

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

		it("should create garantia successfully", async () => {
			const mockActivo = [{ id: 1, nombre: "Laptop Dell" }];
			const mockProveedor = [{ id: 1 }];
			const mockInsert = { insertId: 1 };
			const mockHistorial = [{ insertId: 1 }];

			db.query
				.mockResolvedValueOnce([mockActivo, []])
				.mockResolvedValueOnce([mockProveedor, []])
				.mockResolvedValueOnce([mockInsert, []])
				.mockResolvedValueOnce([mockHistorial, []]);

			const res = await request(app).post("/api/garantias").send(validGarantia);

			expect(res.statusCode).toEqual(201);
			expect(res.body.data).toHaveProperty("id", 1);
			expect(res.body.data).toHaveProperty("activo_id", 1);
			expect(res.body.data).toHaveProperty("nombre_garantia", "Garantía Extendida");
			expect(res.body).toHaveProperty(
				"message",
				"Garantía registrada correctamente",
			);
		});

		it("should fail with 400 when required fields are missing", async () => {
			const res = await request(app).post("/api/garantias").send({
				activo_id: 1,
			});

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should fail with 400 when fecha_fin is before fecha_inicio", async () => {
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

		it("should fail with 400 when estado is invalid", async () => {
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
		it("should delete garantia physically", async () => {
			const mockGarantia = [{ id: 1 }];

			db.query.mockResolvedValueOnce([mockGarantia, []]);
			db.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app).delete("/api/garantias/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty(
				"message",
				"Garantía eliminada físicamente",
			);
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).delete("/api/garantias/1");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});
});
