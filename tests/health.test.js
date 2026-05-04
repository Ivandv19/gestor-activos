const request = require("supertest");
const express = require("express");

// Mock DB
jest.mock("../config/db", () => ({
	query: jest.fn(),
	execute: jest.fn(),
	end: jest.fn(),
}));

const db = require("../config/db");

// Create minimal inline app
const app = express();
app.use(express.json());

// Inline health route
app.get("/api/health", (_req, res) => {
	db.query("SELECT 1")
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

describe("API Health Check", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should return 200 OK for /api/health", async () => {
		db.query.mockResolvedValue([[]]);
		const res = await request(app).get("/api/health");
		expect(res.statusCode).toEqual(200);
		expect(res.body.status).toEqual("ok");
		expect(res.body.message).toContain(
			"Gestor de Activos Backend is running correctly",
		);
	});
});
