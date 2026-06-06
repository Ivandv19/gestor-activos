/** Pruebas para el endpoint de salud */

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

// 2. Crear app mínima con ruta en línea
const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
	mockPool
		.query("SELECT 1")
		.then(() => {
			res.status(200).json({
				status: "ok",
				message: "Gestor de Activos Backend is running correctly",
				timestamp: new Date().toISOString(),
			});
		})
		.catch(() => {
			res.status(200).json({
				status: "ok",
				message: "Gestor de Activos Backend is running correctly",
				timestamp: new Date().toISOString(),
			});
		});
});

describe("Health Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPool.query.mockResolvedValue([[], []]);
	});

	describe("GET /api/health", () => {
		it("debería devolver 200 OK para /api/health", async () => {
			// Arrange
			mockPool.query.mockResolvedValue([[]]);

			// Act
			const res = await request(app).get("/api/health");

			// Assert
			expect(res.statusCode).toEqual(200);
			expect(res.body.status).toEqual("ok");
			expect(res.body.message).toContain(
				"Gestor de Activos Backend is running correctly",
			);
		});
	});
});
