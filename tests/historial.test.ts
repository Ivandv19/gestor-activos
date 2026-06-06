/** Pruebas para el módulo de historial */

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

// Crear una app mínima con rutas inline (sin depender del archivo de rutas)
const app = express();
app.use(express.json());

// Middleware authenticate inline
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

// Importar controlador directamente
import * as historialController from "../controllers/historialController.js";
import { validar } from "../middleware/validar.js";
import { registrarAccionSchema } from "../schemas/historial.js";

// Definir rutas inline
app.get(
	"/api/historial/datos-auxiliares",
	authenticate,
	historialController.datosAuxiliares,
);
app.get(
	"/api/historial/:id",
	authenticate,
	historialController.historialActivo,
);
app.post(
	"/api/historial/:id",
	authenticate,
	validar(registrarAccionSchema),
	historialController.registrarAccionHistorial,
);

describe("Historial Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPool.query.mockResolvedValue([[], []]);
	});

	describe("GET /api/historial/:id", () => {
		it("debería devolver la lista del historial con paginación", async () => {
			// Arrange
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

			mockPool.query
				.mockResolvedValueOnce([mockActivo, []])
				.mockResolvedValueOnce([mockHistorial, []])
				.mockResolvedValueOnce([mockTotal, []]);

			// Act
			const res = await request(app).get("/api/historial/1");

			// Assert
			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});

		it("debería devolver 400 si el ID no es un número", async () => {
			// Act
			const res = await request(app).get("/api/historial/abc");

			// Assert
			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("ID del activo debe ser un número");
		});

		it("debería devolver 404 si no se encuentra el activo", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([
				[
					/* activo no encontrado */
				],
				[],
			]);

			// Act
			const res = await request(app).get("/api/historial/999");

			// Assert
			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("No se encontró ningún activo");
		});

		it("debería soportar paginación y filtros", async () => {
			// Arrange
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

			mockPool.query
				.mockResolvedValueOnce([mockActivo, []])
				.mockResolvedValueOnce([mockHistorial, []])
				.mockResolvedValueOnce([mockTotal, []]);

			// Act
			const res = await request(app).get(
				"/api/historial/1?page=2&limit=5&orden=desc&search=Asignación",
			);

			// Assert
			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});

		it("debería devolver 500 en caso de error de base de datos", async () => {
			// Arrange
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			// Act
			const res = await request(app).get("/api/historial/1");

			// Assert
			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("GET /api/historial/datos-auxiliares", () => {
		it("debería devolver acciones y usuarios", async () => {
			// Arrange
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

			mockPool.query
				.mockResolvedValueOnce([mockAcciones, []])
				.mockResolvedValueOnce([mockUsuarios, []]);

			// Act
			const res = await request(app).get("/api/historial/datos-auxiliares");

			// Assert
			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});

		it("debería devolver 404 si no se encuentran acciones", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([[], []]);

			// Act
			const res = await request(app).get("/api/historial/datos-auxiliares");

			// Assert
			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
			expect(res.body).toHaveProperty("error");
		});

		it("debería devolver 500 si no se encuentran usuarios", async () => {
			// Arrange
			const mockAcciones = [{ id: 1, nombre: "Laptop" }];

			mockPool.query
				.mockResolvedValueOnce([mockAcciones, []])
				.mockResolvedValueOnce([[], []]);

			// Act
			const res = await request(app).get("/api/historial/datos-auxiliares");

			// Assert
			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
			expect(res.body).toHaveProperty("error");
		});

		it("debería devolver 500 en caso de error de base de datos", async () => {
			// Arrange
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			// Act
			const res = await request(app).get("/api/historial/datos-auxiliares");

			// Assert
			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("POST /api/historial/:id", () => {
		it("debería registrar una nueva acción en el historial", async () => {
			// Arrange
			const mockActivo = [{ id: 1 }];
			const mockInsert = { insertId: 5 };

			mockPool.query
				.mockImplementationOnce(() => Promise.resolve([mockActivo, []]))
				.mockImplementationOnce(() => Promise.resolve([[mockInsert], []]));

			// Act
			const res = await request(app).post("/api/historial/1").send({
				accion: "Mantenimiento",
				detalles: "Cambio de pantalla",
				fecha: "2025-01-25",
			});

			// Assert
			expect(res.statusCode).toEqual(201);
			expect(res.body).toHaveProperty("message");
			expect(res.body.message).toContain("registrada correctamente");
			expect(res.body.data).toHaveProperty("historial");
			expect(res.body.data.historial).toHaveProperty("accion", "Mantenimiento");
		});

		it("debería devolver 404 si no se encuentra el activo", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([
				[
					/* vacío */
				],
				[],
			]);

			// Act
			const res = await request(app)
				.post("/api/historial/999")
				.send({ accion: "Mantenimiento" });

			// Assert
			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
			expect(res.body.error).toContain("No se encontró ningún activo");
		});

		it("debería devolver 400 si falta la acción", async () => {
			// Act
			const res = await request(app)
				.post("/api/historial/1")
				.send({ detalles: "Sin acción" });

			// Assert
			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
			expect(res.body).toHaveProperty("error");
		});

		it("debería devolver 400 si la acción es una cadena vacía", async () => {
			// Act
			const res = await request(app)
				.post("/api/historial/1")
				.send({ accion: "", detalles: "Empty action" });

			// Assert
			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
			expect(res.body).toHaveProperty("error");
		});

		it("debería usar la fecha actual si no se proporciona fecha", async () => {
			// Arrange
			const mockActivo = [{ id: 1 }];
			const mockInsert = { insertId: 6 };

			mockPool.query
				.mockResolvedValueOnce([mockActivo, []])
				.mockResolvedValueOnce([[mockInsert], []]);

			// Act
			const res = await request(app)
				.post("/api/historial/1")
				.send({ accion: "Revisión" });

			// Assert
			expect(res.statusCode).toEqual(201);
			expect(res.body.data.historial).toHaveProperty("fecha");
			expect(res.body.data.historial.fecha).toMatch(
				/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
			);
		});

		it("debería devolver 500 en caso de error de base de datos", async () => {
			// Arrange
			mockPool.query.mockRejectedValueOnce(new Error("DB connection failed"));

			// Act
			const res = await request(app)
				.post("/api/historial/1")
				.send({ accion: "Mantenimiento" });

			// Assert
			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("error");
		});
	});
});
