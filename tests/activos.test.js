const request = require("supertest");
const express = require("express");

// 1. Mock DB
const db = {
	query: jest.fn(),
	execute: jest.fn(),
	end: jest.fn(),
};

jest.mock("../config/db", () => db);

// 2. Mock Middlewares inline
const authenticate = (req, res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

const checkRole = (role) => (req, res, next) => {
	next();
};

const imageUploadMiddleware = (req, res, next) => next();

// 3. Create minimal app with inline routes
const app = express();
app.use(express.json());

// Import controller directly
const activosController = require("../controllers/activosController");

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
	activosController.validarEtiquetaSerial,
);

describe("Activos Endpoints", () => {
	beforeEach(() => {
		db.query.mockReset();
	});

	describe("GET /api/gestion-activos/activos", () => {
		it("should return list of activos", async () => {
			const mockActivos = [{ id: 1, nombre: "Laptop 1", tipo: "Computo" }];
			const mockCount = [{ total: 1 }];

			db.query
				.mockResolvedValueOnce([mockActivos, []])
				.mockResolvedValueOnce([mockCount, []]);

			const res = await request(app).get("/api/gestion-activos/activos");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveLength(1);
		});
	});

	describe("GET /api/gestion-activos/activos/:id", () => {
		it("should return asset details if found", async () => {
			const mockActivo = {
				id: 1,
				nombre: "Laptop 1",
				tipo_id: 1,
				tipo_nombre: "Computo",
			};
			db.query.mockResolvedValueOnce([[mockActivo], []]);
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/gestion-activos/activos/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body.nombre).toBe("Laptop 1");
		});

		it("should return 404 if asset not found", async () => {
			db.query.mockResolvedValueOnce([[], []]);
			const res = await request(app).get("/api/gestion-activos/activos/999");
			expect(res.statusCode).toEqual(404);
		});
	});

	describe("POST /api/gestion-activos/activos", () => {
		it("should create new asset successfully", async () => {
			const newAsset = {
				nombre: "New Laptop",
				tipo_id: 1,
				fecha_adquisicion: "2023-01-01",
				valor_compra: 1000,
				estado: "Disponible",
				proveedor_id: 1,
			};

			db.query.mockResolvedValueOnce([{ insertId: 10 }, []]);
			db.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app)
				.post("/api/gestion-activos/activos")
				.send(newAsset);

			expect(res.statusCode).toEqual(201);
			expect(res.body.id).toBe(10);
		});

		it("should fail with 400 if validation fails", async () => {
			const invalidAsset = { nombre: "Incomplete" };
			const res = await request(app)
				.post("/api/gestion-activos/activos")
				.send(invalidAsset);
			expect(res.statusCode).toEqual(400);
		});
	});

	describe("PATCH /api/gestion-activos/baja/:id", () => {
		it("should discharge asset successfully", async () => {
			const mockActivo = { id: 1, nombre: "Old PC", estado: "Disponible" };

			db.query.mockResolvedValueOnce([[mockActivo], []]);
			db.query.mockResolvedValueOnce([[], []]);
			db.query.mockResolvedValueOnce([{}, []]);
			db.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app).patch("/api/gestion-activos/baja/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body.success).toBe(true);
		});
	});

	describe("PUT /api/gestion-activos/activos/:id", () => {
		it("should update activo successfully", async () => {
			const mockActivoExistente = {
				id: 1,
				nombre: "Laptop Old",
				tipo_id: 1,
				proveedor_id: 1,
				ubicacion_id: 1,
				dueno_id: 1,
				estado: "Disponible",
				valor_compra: 1000,
				fecha_adquisicion: "2023-01-01",
				descripcion: "Old description",
			};

			db.query.mockResolvedValueOnce([[mockActivoExistente], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Tipo 1" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Proveedor 1" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Ubicacion 1" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Dueno 1" }], []]);
			db.query.mockResolvedValueOnce([{}, []]);
			db.query.mockResolvedValueOnce([[], []]);
			db.query.mockResolvedValueOnce([{}, []]);
			db.query.mockResolvedValueOnce([[mockActivoExistente], []]);
			db.query.mockResolvedValueOnce([[], []]);

			const updateData = {
				nombre: "Laptop Updated",
				estado: "Asignado",
			};

			const res = await request(app)
				.put("/api/gestion-activos/activos/1")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toBe("Activo actualizado exitosamente");
		});

		it("should return 404 if activo not found", async () => {
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app)
				.put("/api/gestion-activos/activos/999")
				.send({ nombre: "Test" });

			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toBe("El activo no existe.");
		});

		it("should return 400 if validation fails", async () => {
			const mockActivoExistente = {
				id: 1,
				nombre: "Laptop",
				tipo_id: 1,
				proveedor_id: 1,
				ubicacion_id: 1,
				dueno_id: 1,
				estado: "Disponible",
				valor_compra: 1000,
				fecha_adquisicion: "2023-01-01",
				descripcion: "Old description",
			};

			db.query
				.mockResolvedValueOnce([[mockActivoExistente], []])
				.mockResolvedValueOnce([[{ nombre: "Tipo 1" }], []])
				.mockResolvedValueOnce([[{ nombre: "Proveedor 1" }], []])
				.mockResolvedValueOnce([[{ nombre: "Ubicacion 1" }], []])
				.mockResolvedValueOnce([[{ nombre: "Dueno 1" }], []]);

			const res = await request(app)
				.put("/api/gestion-activos/activos/1")
				.send({});

			expect(res.statusCode).toEqual(400);
		});

		it("should return 500 on DB error", async () => {
			const mockActivoExistente = {
				id: 1,
				nombre: "Laptop",
				tipo_id: 1,
				proveedor_id: 1,
				ubicacion_id: 1,
				dueno_id: 1,
			};

			db.query.mockResolvedValueOnce([[mockActivoExistente], []]);
			db.query.mockRejectedValueOnce(new Error("DB error"));

			const res = await request(app)
				.put("/api/gestion-activos/activos/1")
				.send({ nombre: "Updated Laptop" });

			expect(res.statusCode).toEqual(500);
		});
	});

	describe("DELETE /api/gestion-activos/activos/:id", () => {
		it("should delete activo successfully", async () => {
			const mockActivo = { id: 1, nombre: "PC to delete" };

			db.query.mockResolvedValueOnce([[], []]);
			db.query.mockResolvedValueOnce([[], []]);
			db.query.mockResolvedValueOnce([[mockActivo], []]);
			db.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app).delete("/api/gestion-activos/activos/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toBe("Activo eliminado exitosamente");
		});

		it("should return 404 if activo not found", async () => {
			db.query.mockResolvedValueOnce([[], []]);
			db.query.mockResolvedValueOnce([[], []]);
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).delete("/api/gestion-activos/activos/999");

			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toBe("Activo no encontrado");
		});

		it("should return 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB error"));

			const res = await request(app).delete("/api/gestion-activos/activos/1");

			expect(res.statusCode).toEqual(500);
		});
	});

	describe("GET /api/gestion-activos/datos-auxiliares", () => {
		it("should return tipos, proveedores, ubicaciones", async () => {
			const mockTipos = [{ id: 1, nombre: "Computo" }];
			const mockProveedores = [{ id: 1, nombre: "Proveedor 1" }];
			const mockUbicaciones = [{ id: 1, nombre: "Oficina 1" }];
			const mockProveedoresGarantia = [{ id: 1, nombre: "Garantia 1" }];
			const mockDuenos = [{ id: 1, nombre: "Usuario 1" }];

			db.query.mockResolvedValueOnce([mockTipos, []]);
			db.query.mockResolvedValueOnce([mockProveedores, []]);
			db.query.mockResolvedValueOnce([mockUbicaciones, []]);
			db.query.mockResolvedValueOnce([mockProveedoresGarantia, []]);
			db.query.mockResolvedValueOnce([mockDuenos, []]);

			const res = await request(app).get("/api/gestion-activos/datos-auxiliares");

			expect(res.statusCode).toEqual(200);
			expect(res.body.tipos).toHaveLength(1);
			expect(res.body.proveedores).toHaveLength(1);
			expect(res.body.ubicaciones).toHaveLength(1);
			expect(res.body.proveedoresGarantia).toHaveLength(1);
			expect(res.body.duenos).toHaveLength(1);
			expect(res.body.estados).toHaveLength(4);
		});

		it("should return 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB error"));

			const res = await request(app).get("/api/gestion-activos/datos-auxiliares");

			expect(res.statusCode).toEqual(500);
		});
	});

	describe("POST /api/gestion-activos/validar-etiqueta-serial", () => {
		it("should return success if etiqueta is available", async () => {
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app)
				.post("/api/gestion-activos/validar-etiqueta-serial")
				.send({ etiqueta_serial: "NEW-SERIAL-001" });

			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toBe("La etiqueta serial está disponible");
		});

		it("should return 400 if etiqueta already exists", async () => {
			db.query.mockResolvedValueOnce([[{ id: 1 }], []]);

			const res = await request(app)
				.post("/api/gestion-activos/validar-etiqueta-serial")
				.send({ etiqueta_serial: "EXISTING-SERIAL" });

			expect(res.statusCode).toEqual(400);
			expect(res.body.error).toBe("La etiqueta serial ya está registrada");
		});

		it("should return 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB error"));

			const res = await request(app)
				.post("/api/gestion-activos/validar-etiqueta-serial")
				.send({ etiqueta_serial: "TEST-SERIAL" });

			expect(res.statusCode).toEqual(500);
		});
	});
});
