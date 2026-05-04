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
	req.user = { id: 1, rol: "Administrador", email: "admin@test.com" };
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
const asignacionesController = require("../controllers/asignacionesController");

// Define routes inline
app.get(
	"/api/asignaciones",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.getAsignaciones,
);
app.post(
	"/api/asignaciones",
	authenticate,
	checkRole("Administrador"),
	imageUploadMiddleware,
	asignacionesController.createAsignacion,
);
app.get(
	"/api/asignaciones/activos-disponibles",
	authenticate,
	asignacionesController.getActivosDisponibles,
);
app.get(
	"/api/asignaciones/datos-auxiliares/:id",
	authenticate,
	asignacionesController.obtenerDatosAuxiliares,
);
app.get(
	"/api/asignaciones/:id",
	authenticate,
	asignacionesController.getAsignacionPorId,
);
app.put(
	"/api/asignaciones/:id",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.updateAsignacion,
);
app.delete(
	"/api/asignaciones/:id",
	authenticate,
	checkRole("Administrador"),
	asignacionesController.deleteAsignacion,
);

describe("Asignaciones Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET /api/asignaciones", () => {
		it("should return list of asignaciones", async () => {
			const mockAsignaciones = [{ id: 1, activo: "Laptop", usuario: "Juan" }];
			const mockCount = [{ total: 1 }];

			db.query.mockResolvedValueOnce([mockAsignaciones, []]);
			db.query.mockResolvedValueOnce([mockCount, []]);

			const res = await request(app).get("/api/asignaciones");

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveLength(1);
		});
	});

	describe("POST /api/asignaciones", () => {
		it("should create assignment successfully", async () => {
			const newAsignacion = {
				activo_id: 1,
				usuario_id: 2,
				ubicacion_id: 3,
				fecha_asignacion: "2023-01-01",
			};

			db.query.mockResolvedValueOnce([
				[{ activo_existe: 1, usuario_existe: 1, ubicacion_existe: 1 }],
				[],
			]);
			db.query.mockResolvedValueOnce([[{ nombre: "Laptop" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Juan" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Oficina" }], []]);
			db.query.mockResolvedValueOnce([{ insertId: 50 }, []]);
			db.query.mockResolvedValueOnce([{}, []]);
			db.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app)
				.post("/api/asignaciones")
				.send(newAsignacion);

			expect(res.statusCode).toEqual(200);
			expect(res.body.id).toBe(50);
			expect(res.body.message).toContain("creada correctamente");
		});

		it("should fail if entities do not exist", async () => {
			const newAsignacion = {
				activo_id: 99,
				usuario_id: 2,
				ubicacion_id: 3,
				fecha_asignacion: "2023-01-01",
			};

			db.query.mockResolvedValueOnce([
				[{ activo_existe: 0, usuario_existe: 1, ubicacion_existe: 1 }],
				[],
			]);

			const res = await request(app)
				.post("/api/asignaciones")
				.send(newAsignacion);

			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toContain("activo no existe");
		});
	});

	describe("DELETE /api/asignaciones/:id", () => {
		it("should delete assignment and free asset", async () => {
			const mockAsignacion = {
				asignacion_id: 1,
				activo_id: 10,
				activo_nombre: "Laptop",
			};

			db.query.mockResolvedValueOnce([[mockAsignacion], []]);
			db.query.mockResolvedValueOnce([{}, []]);
			db.query.mockResolvedValueOnce([{}, []]);
			db.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app).delete("/api/asignaciones/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toContain("eliminada");
		});
	});

	describe("GET /api/asignaciones/:id", () => {
		it("should return asignacion details if found", async () => {
			const mockAsignacion = [
				{
					id: 1,
					activo_id: 10,
					activo_nombre: "Laptop Dell",
					activo_foto: "laptop.jpg",
					usuario_id: 5,
					usuario_nombre: "Juan Pérez",
					ubicacion_id: 3,
					ubicacion_nombre: "Oficina Central",
					fecha_asignacion: "2023-05-15",
					fecha_devolucion: null,
					comentarios: "Asignado para trabajo remoto",
				},
			];

			db.query.mockResolvedValueOnce([mockAsignacion, []]);

			const res = await request(app).get("/api/asignaciones/1");

			expect(res.statusCode).toEqual(200);
			expect(res.body.asignacion.id).toBe(1);
			expect(res.body.message).toContain("obtenida correctamente");
		});

		it("should fail with 404 if asignacion not found", async () => {
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/asignaciones/999");

			expect(res.statusCode).toEqual(404);
			expect(res.body.mensaje).toContain("no existe");
		});

		it("should fail with 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection error"));

			const res = await request(app).get("/api/asignaciones/1");

			expect(res.statusCode).toEqual(500);
			expect(res.body.mensaje).toContain("Error al obtener");
		});
	});

	describe("PUT /api/asignaciones/:id", () => {
		it("should update asignacion successfully", async () => {
			const updateData = {
				fecha_devolucion: "2023-12-01",
				usuario_id: 10,
				ubicacion_id: 5,
			};

			db.query.mockResolvedValueOnce([
				[
					{
						id: 1,
						activo_id: 10,
						usuario_id: 5,
						ubicacion_id: 3,
						fecha_devolucion: null,
					},
				],
				[],
			]);
			db.query.mockResolvedValueOnce([[{ nombre: "Laptop" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Juan" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Oficina" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Maria" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Sala B" }], []]);
			db.query.mockResolvedValueOnce([{}, []]);
			db.query.mockResolvedValueOnce([{}, []]);

			const res = await request(app)
				.put("/api/asignaciones/1")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toContain("actualizada correctamente");
		});

		it("should fail with 404 if asignacion not found", async () => {
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app)
				.put("/api/asignaciones/999")
				.send({ fecha_devolucion: "2023-12-01" });

			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toContain("no existe");
		});

		it("should fail with 400 if validation fails (invalid fecha)", async () => {
			db.query.mockResolvedValueOnce([
				[
					{
						id: 1,
						activo_id: 10,
						usuario_id: 5,
						ubicacion_id: 3,
						fecha_devolucion: null,
					},
				],
				[],
			]);
			db.query.mockResolvedValueOnce([[{ nombre: "Laptop" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Juan" }], []]);
			db.query.mockResolvedValueOnce([[{ nombre: "Oficina" }], []]);

			const res = await request(app)
				.put("/api/asignaciones/1")
				.send({ fecha_devolucion: "invalid-date" });

			expect(res.statusCode).toEqual(400);
			expect(res.body.mensaje).toContain("inválido");
		});

		it("should fail with 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection error"));

			const res = await request(app)
				.put("/api/asignaciones/1")
				.send({ fecha_devolucion: "2023-12-01" });

			expect(res.statusCode).toEqual(500);
			expect(res.body.mensaje).toContain("Error al actualizar");
		});
	});

	describe("GET /api/asignaciones/activos-disponibles", () => {
		it("should return list of disponibles activos", async () => {
			const mockActivos = [
				{
					id: 1,
					activo: "Laptop HP",
					tipo_activo: "Equipo de cómputo",
					estado_activo: "Disponible",
					proveedor: "HP Inc",
					ubicacion: "Almacén",
					foto_url: "laptop.jpg",
				},
			];
			const mockCount = [{ total: 1 }];

			db.query.mockResolvedValueOnce([mockActivos, []]);
			db.query.mockResolvedValueOnce([mockCount, []]);

			const res = await request(app).get(
				"/api/asignaciones/activos-disponibles",
			);

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveLength(1);
			expect(res.body.pagination.total).toBe(1);
		});

		it("should return empty list if none available", async () => {
			const mockCount = [{ total: 0 }];

			db.query.mockResolvedValueOnce([[], []]);
			db.query.mockResolvedValueOnce([mockCount, []]);

			const res = await request(app).get(
				"/api/asignaciones/activos-disponibles",
			);

			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveLength(0);
		});

		it("should fail with 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection error"));

			const res = await request(app).get(
				"/api/asignaciones/activos-disponibles",
			);

			expect(res.statusCode).toEqual(500);
			expect(res.body.error).toContain("Error al obtener");
		});
	});

	describe("GET /api/asignaciones/datos-auxiliares/:id", () => {
		it("should return tipos, usuarios, ubicaciones", async () => {
			const mockUsuarios = [{ id: 1, nombre: "Juan" }];
			const mockTipos = [{ id: 1, nombre: "Laptop" }];
			const mockProveedores = [{ id: 1, nombre: "Dell" }];
			const mockUbicaciones = [{ id: 1, nombre: "Oficina" }];
			const mockActivo = [{ nombre: "Laptop Dell", foto_url: "dell.jpg" }];

			db.query.mockResolvedValueOnce([mockUsuarios, []]);
			db.query.mockResolvedValueOnce([mockTipos, []]);
			db.query.mockResolvedValueOnce([mockProveedores, []]);
			db.query.mockResolvedValueOnce([mockUbicaciones, []]);
			db.query.mockResolvedValueOnce([mockActivo, []]);

			const res = await request(app).get(
				"/api/asignaciones/datos-auxiliares/1",
			);

			expect(res.statusCode).toEqual(200);
			expect(res.body.usuarios).toHaveLength(1);
			expect(res.body.tiposActivos).toHaveLength(1);
			expect(res.body.proveedores).toHaveLength(1);
			expect(res.body.ubicaciones).toHaveLength(1);
			expect(res.body.nombre).toBe("Laptop Dell");
		});

		it("should fail with 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection error"));

			const res = await request(app).get(
				"/api/asignaciones/datos-auxiliares/1",
			);

			expect(res.statusCode).toEqual(500);
			expect(res.body.error).toContain("Error");
		});
	});
});
