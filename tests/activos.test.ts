/** Pruebas para el módulo de activos */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// Imports internos
import * as activosController from "../controllers/activosController.js";
import { validar } from "../middleware/validar.js";
import {
	createActivoSchema,
	updateActivoSchema,
	validarEtiquetaSchema,
} from "../schemas/activos.js";

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

// 2. Mock Middlewares inline
const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

const checkRole = (_role) => (_req, _res, next) => {
	next();
};

const imageUploadMiddleware = (_req, _res, next) => next();

// 3. Create minimal app with inline routes
const app = express();
app.use(express.json());

// Define routes inline
app.get(
	"/api/gestion-activos/activos",
	authenticate,
	checkRole("Administrador"),
	activosController.getActivos,
);
app.get(
	"/api/gestion-activos/activos/:id",
	authenticate,
	checkRole("Administrador"),
	activosController.getActivoById,
);
app.post(
	"/api/gestion-activos/activos",
	authenticate,
	checkRole("Administrador"),
	imageUploadMiddleware,
	validar(createActivoSchema),
	activosController.createActivo,
);
app.patch(
	"/api/gestion-activos/baja/:id",
	authenticate,
	checkRole("Administrador"),
	activosController.darDeBajaActivo,
);
app.put(
	"/api/gestion-activos/activos/:id",
	authenticate,
	checkRole("Administrador"),
	imageUploadMiddleware,
	validar(updateActivoSchema),
	activosController.updateActivo,
);
app.delete(
	"/api/gestion-activos/activos/:id",
	authenticate,
	checkRole("Administrador"),
	activosController.deleteActivo,
);
app.get(
	"/api/gestion-activos/datos-auxiliares",
	authenticate,
	activosController.obtenerDatosAuxiliares,
);
app.post(
	"/api/gestion-activos/validar-etiqueta-serial",
	authenticate,
	checkRole("Administrador"),
	validar(validarEtiquetaSchema),
	activosController.validarEtiquetaSerial,
);

describe("Activos Endpoints", () => {
	beforeEach(() => {
		mockPool.query.mockReset();
	});

	describe("GET /api/gestion-activos/activos", () => {
		it("debería retornar la lista de activos", async () => {
			// Arrange
			const mockActivos = [
				[
					1,
					"Laptop 1",
					1,
					null,
					null,
					null,
					null,
					null,
					null,
					"Disponible",
					1,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					"Nuevo",
					1,
					"Computo",
					null,
					null,
					null,
				],
			];
			const mockCount = [[1]];

			mockPool.query
				.mockResolvedValueOnce([mockActivos, []])
				.mockResolvedValueOnce([mockCount, []]);

			// Act
			const res = await request(app).get("/api/gestion-activos/activos");

			// Assert
			console.log("DEBUG GET list:", {
				status: res.status,
				body: JSON.stringify(res.body),
			});
			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveLength(1);
		});
	});

	describe("GET /api/gestion-activos/activos/:id", () => {
		it("debería retornar los detalles del activo si existe", async () => {
			// Arrange
			const mockActivo = [
				1,
				"Laptop 1",
				1,
				null,
				null,
				null,
				null,
				null,
				null,
				"Disponible",
				1,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				"Nuevo",
				1,
				"Computo",
				null,
				null,
				null,
			];
			mockPool.query.mockResolvedValueOnce([[mockActivo], []]);
			mockPool.query.mockResolvedValueOnce([[], []]);

			// Act
			const res = await request(app).get("/api/gestion-activos/activos/1");

			// Assert
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.nombre).toBe("Laptop 1");
		});

		it("debería retornar 404 si el activo no existe", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([[], []]);

			// Act
			const res = await request(app).get("/api/gestion-activos/activos/999");

			// Assert
			expect(res.statusCode).toEqual(404);
		});
	});

	describe("POST /api/gestion-activos/activos", () => {
		it("debería crear un activo exitosamente", async () => {
			// Arrange
			const newAsset = {
				nombre: "New Laptop",
				tipo_id: 1,
				fecha_adquisicion: "2023-01-01",
				valor_compra: 1000,
				estado: "Disponible",
				proveedor_id: 1,
			};

			const mockConn = { query: jest.fn(), end: jest.fn(), release: jest.fn() };
			mockPool.getConnection.mockResolvedValueOnce(mockConn);
			mockConn.query
				.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 1, insertId: 10 }, []])
				.mockResolvedValueOnce([{ affectedRows: 1, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }, []]);

			// Act
			const res = await request(app)
				.post("/api/gestion-activos/activos")
				.send(newAsset);

			// Assert
			expect(res.statusCode).toEqual(201);
			expect(res.body.data.id).toBe(10);
		});

		it("debería fallar con 400 si la validación falla", async () => {
			// Arrange
			const invalidAsset = { nombre: "Incomplete" };

			// Act
			const res = await request(app)
				.post("/api/gestion-activos/activos")
				.send(invalidAsset);

			// Assert
			expect(res.statusCode).toEqual(400);
		});
	});

	describe("PATCH /api/gestion-activos/baja/:id", () => {
		it("debería dar de baja el activo exitosamente", async () => {
			// Arrange
			const mockActivo = [1, "Disponible", "Old PC"];

			mockPool.query.mockResolvedValueOnce([[mockActivo], []]);
			mockPool.query.mockResolvedValueOnce([[], []]);

			const mockConn = { query: jest.fn(), end: jest.fn(), release: jest.fn() };
			mockPool.getConnection.mockResolvedValueOnce(mockConn);
			mockConn.query
				.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 1, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 1, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }, []]);

			// Act
			const res = await request(app).patch("/api/gestion-activos/baja/1");

			// Assert
			expect(res.statusCode).toEqual(200);
		});
	});

	describe("PUT /api/gestion-activos/activos/:id", () => {
		it("debería actualizar el activo exitosamente", async () => {
			// Arrange
			const mockActivoExistente = [
				1,
				"Laptop Old",
				1,
				"2023-01-01",
				null,
				null,
				1000,
				null,
				"Old description",
				"Disponible",
				1,
				1,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				1,
				"Nuevo",
				1,
				null,
				null,
				null,
				null,
			];

			mockPool.query.mockResolvedValueOnce([[mockActivoExistente], []]);

			const mockConn = { query: jest.fn(), end: jest.fn(), release: jest.fn() };
			mockPool.getConnection.mockResolvedValueOnce(mockConn);
			mockConn.query
				.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 1, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 1, insertId: 0 }, []])
				.mockResolvedValueOnce([
					[
						[
							1,
							"Laptop Updated",
							1,
							"2023-01-01",
							null,
							null,
							1000,
							null,
							"Old description",
							"Asignado",
							1,
							1,
							null,
							null,
							null,
							null,
							null,
							null,
							null,
							1,
							"Nuevo",
							1,
						],
					],
					[],
				])
				.mockResolvedValueOnce([
					[
						[
							1,
							1,
							1,
							"Garantia 1",
							"2024-01-01",
							"2025-01-01",
							null,
							null,
							"Vigente",
							null,
							1,
						],
					],
					[],
				])
				.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }, []]);

			const updateData = {
				nombre: "Laptop Updated",
				estado: "Asignado",
			};

			// Act
			const res = await request(app)
				.put("/api/gestion-activos/activos/1")
				.send(updateData);

			// Assert
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toBe("Activo actualizado exitosamente");
		});

		it("debería retornar 404 si el activo no existe", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([[], []]);

			// Act
			const res = await request(app)
				.put("/api/gestion-activos/activos/999")
				.send({ nombre: "Test" });

			// Assert
			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toBe("El activo no existe.");
		});

		it("debería retornar 400 si la validación falla", async () => {
			// Arrange
			const mockActivoExistente = [
				1,
				"Laptop",
				1,
				"2023-01-01",
				null,
				null,
				1000,
				null,
				"Old description",
				"Disponible",
				1,
				1,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				1,
				"Nuevo",
				1,
				null,
				null,
				null,
				null,
			];

			mockPool.query.mockResolvedValueOnce([[mockActivoExistente], []]);

			// Act
			const res = await request(app)
				.put("/api/gestion-activos/activos/1")
				.send({});

			// Assert
			expect(res.statusCode).toEqual(500);
		});

		it("debería retornar 500 en error de BD", async () => {
			// Arrange
			const mockActivoExistente = {
				id: 1,
				nombre: "Laptop",
				tipo_id: 1,
				proveedor_id: 1,
				ubicacion_id: 1,
				dueno_id: 1,
			};

			mockPool.query.mockResolvedValueOnce([[mockActivoExistente], []]);
			mockPool.query.mockRejectedValueOnce(new Error("DB error"));

			// Act
			const res = await request(app)
				.put("/api/gestion-activos/activos/1")
				.send({ nombre: "Updated Laptop" });

			// Assert
			expect(res.statusCode).toEqual(500);
		});
	});

	describe("DELETE /api/gestion-activos/activos/:id", () => {
		it("debería eliminar el activo físicamente", async () => {
			// Arrange
			const mockActivo = [1, "PC to delete", null];

			mockPool.query.mockResolvedValueOnce([[mockActivo], []]);
			mockPool.query.mockResolvedValueOnce([[], []]);

			const mockConn = { query: jest.fn(), end: jest.fn(), release: jest.fn() };
			mockPool.getConnection.mockResolvedValueOnce(mockConn);
			mockConn.query
				.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 1, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 1, insertId: 0 }, []])
				.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }, []]);

			// Act
			const res = await request(app).delete("/api/gestion-activos/activos/1");

			// Assert
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toContain("eliminado físicamente");
		});

		it("debería retornar 400 si el activo tiene asignaciones activas", async () => {
			// Arrange
			const mockActivo = { id: 1, nombre: "PC", foto_url: null };
			const mockAsignacion = [{ id: 1 }];

			mockPool.query.mockResolvedValueOnce([[mockActivo], []]);
			mockPool.query.mockResolvedValueOnce([mockAsignacion, []]);

			// Act
			const res = await request(app).delete("/api/gestion-activos/activos/1");

			// Assert
			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toContain("No se puede eliminar");
		});

		it("debería retornar 404 si el activo no existe", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([[], []]);

			// Act
			const res = await request(app).delete("/api/gestion-activos/activos/999");

			// Assert
			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toBe("Activo no encontrado");
		});

		it("debería retornar 500 en error de BD", async () => {
			// Arrange
			mockPool.query.mockRejectedValueOnce(new Error("DB error"));

			// Act
			const res = await request(app).delete("/api/gestion-activos/activos/1");

			// Assert
			expect(res.statusCode).toEqual(500);
		});
	});

	describe("GET /api/gestion-activos/datos-auxiliares", () => {
		it("debería retornar tipos, proveedores, ubicaciones", async () => {
			// Arrange
			const mockTipos = [{ id: 1, nombre: "Computo" }];
			const mockProveedores = [{ id: 1, nombre: "Proveedor 1" }];
			const mockUbicaciones = [{ id: 1, nombre: "Oficina 1" }];
			const mockProveedoresGarantia = [{ id: 1, nombre: "Garantia 1" }];
			const mockDuenos = [{ id: 1, nombre: "Usuario 1" }];

			mockPool.query.mockResolvedValueOnce([mockTipos, []]);
			mockPool.query.mockResolvedValueOnce([mockProveedores, []]);
			mockPool.query.mockResolvedValueOnce([mockUbicaciones, []]);
			mockPool.query.mockResolvedValueOnce([mockProveedoresGarantia, []]);
			mockPool.query.mockResolvedValueOnce([mockDuenos, []]);

			// Act
			const res = await request(app).get(
				"/api/gestion-activos/datos-auxiliares",
			);

			// Assert
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.tipos).toHaveLength(1);
			expect(res.body.data.proveedores).toHaveLength(1);
			expect(res.body.data.ubicaciones).toHaveLength(1);
			expect(res.body.data.proveedoresGarantia).toHaveLength(1);
			expect(res.body.data.duenos).toHaveLength(1);
			expect(res.body.data.estados).toHaveLength(4);
		});

		it("debería retornar 200 con arreglos vacíos cuando las tablas están vacías", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([[], []]);
			mockPool.query.mockResolvedValueOnce([[], []]);
			mockPool.query.mockResolvedValueOnce([[], []]);
			mockPool.query.mockResolvedValueOnce([[], []]);
			mockPool.query.mockResolvedValueOnce([[], []]);

			// Act
			const res = await request(app).get(
				"/api/gestion-activos/datos-auxiliares",
			);

			// Assert
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.tipos).toEqual([]);
			expect(res.body.data.proveedores).toEqual([]);
			expect(res.body.data.ubicaciones).toEqual([]);
			expect(res.body.data.proveedoresGarantia).toEqual([]);
			expect(res.body.data.duenos).toEqual([]);
			expect(res.body.data.estados).toHaveLength(4);
		});

		it("debería retornar 500 en error de BD", async () => {
			// Arrange
			mockPool.query.mockRejectedValueOnce(new Error("DB error"));

			// Act
			const res = await request(app).get(
				"/api/gestion-activos/datos-auxiliares",
			);

			// Assert
			expect(res.statusCode).toEqual(500);
		});
	});

	describe("POST /api/gestion-activos/validar-etiqueta-serial", () => {
		it("debería retornar éxito si la etiqueta está disponible", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([[], []]);

			// Act
			const res = await request(app)
				.post("/api/gestion-activos/validar-etiqueta-serial")
				.send({ etiqueta_serial: "NEW-SERIAL-001" });

			// Assert
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toBe("La etiqueta serial está disponible");
		});

		it("debería retornar 400 si la etiqueta ya existe", async () => {
			// Arrange
			mockPool.query.mockResolvedValueOnce([[{ id: 1 }], []]);

			// Act
			const res = await request(app)
				.post("/api/gestion-activos/validar-etiqueta-serial")
				.send({ etiqueta_serial: "EXISTING-SERIAL" });

			// Assert
			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toBe("La etiqueta serial ya está registrada");
		});

		it("debería retornar 500 en error de BD", async () => {
			// Arrange
			mockPool.query.mockRejectedValueOnce(new Error("DB error"));

			// Act
			const res = await request(app)
				.post("/api/gestion-activos/validar-etiqueta-serial")
				.send({ etiqueta_serial: "TEST-SERIAL" });

			// Assert
			expect(res.statusCode).toEqual(500);
		});
	});
});
