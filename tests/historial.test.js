const request = require("supertest");
const express = require("express");

// Mock DB
jest.mock("../config/db", () => ({
	query: jest.fn(),
	execute: jest.fn(),
	end: jest.fn(),
}));

const db = require("../config/db");

// Create a minimal app with inline routes (bypassing the routes file)
const app = express();
app.use(express.json());

// Inline authenticate middleware
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

// Import controller directly
const historialController = require("../controllers/historialController");

// Define routes inline
app.get(
	"/api/historial/datos-auxiliares",
	authenticate,
	historialController.getDatosAuxiliares,
);
app.get(
	"/api/historial/:id",
	authenticate,
	historialController.getHistorialActivo,
);
app.post(
	"/api/historial/:id",
	authenticate,
	historialController.registrarAccionHistorial,
);

describe("Historial Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET /api/historial/:id", () => {
		it("should return historial list with pagination", async () => {
			const mockActivo = [{ id: 1 }];
			const mockHistorial = [
				{
					id: 1,
					accion: "Asignación",
					fecha: "2025-01-15",
					usuario_responsable: "Juan Pérez",
					detalles: "Asignado a María",
				},
				{
					id: 2,
					accion: "Devolución",
					fecha: "2025-01-20",
					usuario_responsable: "María López",
					detalles: "Devuelto al almacén",
				},
			];
			const mockTotal = [{ total: 2 }];

			db.query
				.mockResolvedValueOnce([mockActivo, []])
				.mockResolvedValueOnce([mockHistorial, []])
				.mockResolvedValueOnce([mockTotal, []]);

			const res = await request(app).get("/api/historial/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body.data).toHaveLength(2);
			expect(res.body).toHaveProperty("pagination");
			expect(res.body.pagination).toHaveProperty("page", 1);
			expect(res.body.pagination).toHaveProperty("limit", 10);
			expect(res.body.pagination).toHaveProperty("total", 2);
			expect(res.body.pagination).toHaveProperty("totalPages", 1);
		});

		it("should return 400 if ID is not a number", async () => {
			const res = await request(app).get("/api/historial/abc");

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("ID del activo debe ser un número");
		});

		it("should return 404 if activo not found", async () => {
			db.query.mockResolvedValueOnce([
				[
					/* activo no encontrado */
				],
				[],
			]);

			const res = await request(app).get("/api/historial/999");

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("No se encontró ningún activo");
		});

		it("should support pagination and filtering", async () => {
			const mockActivo = [{ id: 1 }];
			const mockHistorial = [
				{
					id: 1,
					accion: "Asignación",
					fecha: "2025-01-15",
					usuario_responsable: "Juan Pérez",
					detalles: "Detalles",
				},
			];
			const mockTotal = [{ total: 1 }];

			db.query
				.mockResolvedValueOnce([mockActivo, []])
				.mockResolvedValueOnce([mockHistorial, []])
				.mockResolvedValueOnce([mockTotal, []]);

			const res = await request(app).get(
				"/api/historial/1?page=2&limit=5&orden=desc&search=Asignación",
			);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body.pagination).toHaveProperty("page", 2);
			expect(res.body.pagination).toHaveProperty("limit", 5);
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/historial/1");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("GET /api/historial/datos-auxiliares", () => {
		it("should return acciones and usuarios", async () => {
			const mockAcciones = [
				{
					id: 1,
					nombre: "Laptop",
					fecha_registro: "2025-01-01",
					estado: "Disponible",
				},
				{
					id: 2,
					nombre: "Monitor",
					fecha_registro: "2025-01-02",
					estado: "Asignado",
				},
			];
			const mockUsuarios = [
				{ id: 1, nombre: "Ana García" },
				{ id: 2, nombre: "Carlos Ruiz" },
			];

			db.query
				.mockResolvedValueOnce([mockAcciones, []])
				.mockResolvedValueOnce([mockUsuarios, []]);

			const res = await request(app).get("/api/historial/datos-auxiliares");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("acciones");
			expect(res.body.acciones).toHaveLength(2);
			expect(res.body).toHaveProperty("usuarios");
			expect(res.body.usuarios).toHaveLength(2);
		});

		it("should return 404 if no acciones found", async () => {
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/historial/datos-auxiliares");

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
			expect(res.body).toHaveProperty("error");
		});

		it("should return 404 if no usuarios found", async () => {
			const mockAcciones = [{ id: 1, nombre: "Laptop" }];

			db.query
				.mockResolvedValueOnce([mockAcciones, []])
				.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/historial/datos-auxiliares");

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
			expect(res.body).toHaveProperty("error");
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/historial/datos-auxiliares");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("POST /api/historial/:id", () => {
		it("should register a new historial action", async () => {
			const mockActivo = [{ id: 1 }];
			const mockInsert = { insertId: 5 };

			db.query
				.mockImplementationOnce(() => Promise.resolve([mockActivo, []]))
				.mockImplementationOnce(() => Promise.resolve([[mockInsert], []]));

			const res = await request(app).post("/api/historial/1").send({
				accion: "Mantenimiento",
				detalles: "Cambio de pantalla",
				fecha: "2025-01-25",
			});

			expect(res.statusCode).toEqual(201);
			expect(res.body).toHaveProperty("message");
			expect(res.body.message).toContain("registrada correctamente");
			expect(res.body).toHaveProperty("historial");
			expect(res.body.historial).toHaveProperty("accion", "Mantenimiento");
		});

		it("should return 404 if activo not found", async () => {
			db.query.mockResolvedValueOnce([
				[
					/* empty */
				],
				[],
			]);

			const res = await request(app)
				.post("/api/historial/999")
				.send({ accion: "Mantenimiento" });

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("No se encontró ningún activo");
		});

		it("should return 400 if accion is missing", async () => {
			const mockActivo = [{ id: 1 }];

			db.query.mockResolvedValueOnce([mockActivo, []]);

			const res = await request(app)
				.post("/api/historial/1")
				.send({ detalles: "Sin acción" });

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("El campo");
		});

		it("should return 400 if accion is empty string", async () => {
			const mockActivo = [{ id: 1 }];

			db.query.mockResolvedValueOnce([mockActivo, []]);

			const res = await request(app)
				.post("/api/historial/1")
				.send({ accion: "", detalles: "Empty action" });

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("El campo");
		});

		it("should use current date if fecha not provided", async () => {
			const mockActivo = [{ id: 1 }];
			const mockInsert = { insertId: 6 };

			db.query
				.mockResolvedValueOnce([mockActivo, []])
				.mockResolvedValueOnce([[mockInsert], []]);

			const res = await request(app)
				.post("/api/historial/1")
				.send({ accion: "Revisión" });

			expect(res.statusCode).toEqual(201);
			expect(res.body.historial).toHaveProperty("fecha");
			expect(res.body.historial.fecha).toMatch(
				/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
			);
		});

		it("should return 500 on database error", async () => {
			db.query
				.mockResolvedValueOnce([[{ id: 1 }], []])
				.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app)
				.post("/api/historial/1")
				.send({ accion: "Mantenimiento" });

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});
});
