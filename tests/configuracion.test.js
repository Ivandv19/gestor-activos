const request = require("supertest");
const express = require("express");

const db = {
	query: jest.fn(),
	execute: jest.fn(),
	end: jest.fn(),
};

jest.mock("../config/db", () => db);

jest.mock("../services/hashService", () => ({
	hash: jest.fn(),
	verify: jest.fn(),
}));
const hashService = require("../services/hashService");

jest.mock("../services/r2Service", () => ({
	generateKey: jest.fn(),
	uploadToR2: jest.fn(),
}));

const app = express();
app.use(express.json());

const authenticate = (req, _res, next) => {
	req.user = { id: 1, rol: "Administrador" };
	next();
};

const checkRole = (_role) => (_req, _res, next) => {
	next();
};

const configuracionController = require("../controllers/configuracionController");

app.get(
	"/api/configuracion/aplicacion",
	authenticate,
	configuracionController.getConfiguracionAplicacion,
);
app.put(
	"/api/configuracion/aplicacion",
	authenticate,
	checkRole("Administrador"),
	configuracionController.updateConfiguracionAplicacion,
);
app.get(
	"/api/configuracion/perfil",
	authenticate,
	configuracionController.getPerfilUsuario,
);
app.put(
	"/api/configuracion/perfil",
	authenticate,
	configuracionController.updatePerfilUsuario,
);

describe("Configuración Endpoints", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET /api/configuracion/aplicacion", () => {
		it("should return application configuration from DB", async () => {
			const mockConfig = {
				idioma: "es",
				zona_horaria: "UTC-5",
				formato_fecha: "DD/MM/YYYY",
				formato_moneda: "USD",
			};

			db.query.mockResolvedValueOnce([[mockConfig], []]);

			const res = await request(app).get("/api/configuracion/aplicacion");

			expect(res.statusCode).toEqual(200);
			expect(res.body.idioma).toEqual("es");
			expect(res.body.zona_horaria).toEqual("UTC-5");
			expect(res.body.formato_fecha).toEqual("DD/MM/YYYY");
			expect(res.body.formato_moneda).toEqual("USD");
		});

		it("should return 404 when config not found", async () => {
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/configuracion/aplicacion");

			expect(res.statusCode).toEqual(404);
		});

		it("should return 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB error"));

			const res = await request(app).get("/api/configuracion/aplicacion");

			expect(res.statusCode).toEqual(500);
		});
	});

	describe("PUT /api/configuracion/aplicacion", () => {
		it("should update configuration successfully", async () => {
			const updateData = {
				idioma: "es",
				zona_horaria: "UTC-5",
				formato_fecha: "DD/MM/YYYY",
				formato_moneda: "USD",
			};

			db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("message");
			expect(res.body.nuevaConfiguracion.idioma).toEqual("es");
		});

		it("should return 400 when missing required fields", async () => {
			const updateData = {
				idioma: "es",
			};

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("message");
		});

		it("should return 400 when idioma is invalid", async () => {
			const updateData = {
				idioma: "de",
				zona_horaria: "UTC-5",
				formato_fecha: "DD/MM/YYYY",
				formato_moneda: "MXN",
			};

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("message");
			expect(res.body.message).toContain("Idioma no válido");
		});

		it("should return 400 when zona_horaria is invalid", async () => {
			const updateData = {
				idioma: "es",
				zona_horaria: "UTC+10",
				formato_fecha: "DD/MM/YYYY",
				formato_moneda: "MXN",
			};

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("message");
			expect(res.body.message).toContain("Zona horaria no válida");
		});

		it("should return 500 on DB error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB error"));

			const res = await request(app)
				.put("/api/configuracion/aplicacion")
				.send({
					idioma: "es",
					zona_horaria: "UTC-5",
					formato_fecha: "DD/MM/YYYY",
					formato_moneda: "USD",
				});

			expect(res.statusCode).toEqual(500);
		});
	});

	describe("GET /api/configuracion/perfil", () => {
		it("should return user profile", async () => {
			const mockUser = {
				nombre: "Juan Pérez",
				email: "juan@empresa.com",
				departamento: "Ventas",
				foto_url: "https://example.com/photo.jpg",
			};

			db.query.mockResolvedValueOnce([[mockUser], []]);

			const res = await request(app).get("/api/configuracion/perfil");

			expect(res.statusCode).toEqual(200);
			expect(res.body).toEqual(mockUser);
		});

		it("should return 400 when user ID not provided", async () => {
			const appNoAuth = express();
			appNoAuth.use(express.json());
			appNoAuth.get(
				"/api/configuracion/perfil",
				(req, _res, next) => {
					req.user = null;
					next();
				},
				configuracionController.getPerfilUsuario,
			);

			const res = await request(appNoAuth).get("/api/configuracion/perfil");

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 404 when user not found", async () => {
			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app).get("/api/configuracion/perfil");

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 500 on database error", async () => {
			db.query.mockRejectedValueOnce(new Error("DB connection failed"));

			const res = await request(app).get("/api/configuracion/perfil");

			expect(res.statusCode).toEqual(500);
			expect(res.body).toHaveProperty("message");
		});
	});

	describe("PUT /api/configuracion/perfil", () => {
		it("should update user profile successfully", async () => {
			const mockUser = { contrasena: "hashed_password" };
			const updateData = {
				nombre: "Juan Carlos",
				email: "juancarlos@empresa.com",
				departamento: "TI",
				contrasena_actual: "oldPassword123",
			};

			db.query
				.mockResolvedValueOnce([[mockUser], []])
				.mockResolvedValueOnce([{ affectedRows: 1 }]);
			hashService.verify.mockResolvedValueOnce(true);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("message");
		});

		it("should return 400 when contrasena_actual is missing", async () => {
			const updateData = {
				nombre: "Juan Carlos",
				email: "juancarlos@empresa.com",
			};

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 401 when current password is incorrect", async () => {
			const mockUser = { contrasena: "hashed_password" };
			const updateData = {
				nombre: "Juan Carlos",
				contrasena_actual: "wrongPassword",
			};

			db.query.mockResolvedValueOnce([[mockUser], []]);
			hashService.verify.mockResolvedValueOnce(false);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(401);
			expect(res.body).toHaveProperty("message");
		});

		it("should return 404 when user not found for password verification", async () => {
			const updateData = {
				nombre: "Juan Carlos",
				contrasena_actual: "password123",
			};

			db.query.mockResolvedValueOnce([[], []]);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(404);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 400 when no fields to update", async () => {
			const mockUser = { contrasena: "hashed_password" };
			const updateData = {
				contrasena_actual: "password123",
			};

			db.query.mockResolvedValueOnce([[mockUser], []]);
			hashService.verify.mockResolvedValueOnce(true);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should return 400 when email is invalid", async () => {
			const mockUser = { contrasena: "hashed_password" };
			const updateData = {
				email: "invalid-email",
				contrasena_actual: "password123",
			};

			db.query.mockResolvedValueOnce([[mockUser], []]);
			hashService.verify.mockResolvedValueOnce(true);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should update password when nueva_contrasena is provided", async () => {
			const mockUser = { contrasena: "hashed_password" };
			const updateData = {
				nombre: "Juan Carlos",
				contrasena_actual: "password123",
				nueva_contrasena: "newPassword456",
				confirmar_nueva_contrasena: "newPassword456",
			};

			db.query
				.mockResolvedValueOnce([[mockUser], []])
				.mockResolvedValueOnce([{ affectedRows: 1 }]);
			hashService.verify.mockResolvedValueOnce(true);
			hashService.hash.mockResolvedValueOnce("newHashedPassword");

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(200);
			expect(res.body).toHaveProperty("message");
			expect(hashService.hash).toHaveBeenCalledTimes(1);
		});

		it("should return 400 when passwords do not match", async () => {
			const mockUser = { contrasena: "hashed_password" };
			const updateData = {
				contrasena_actual: "password123",
				nueva_contrasena: "newPassword456",
				confirmar_nueva_contrasena: "differentPassword",
			};

			db.query.mockResolvedValueOnce([[mockUser], []]);
			hashService.verify.mockResolvedValueOnce(true);

			const res = await request(app)
				.put("/api/configuracion/perfil")
				.send(updateData);

			expect(res.statusCode).toEqual(400);
			expect(res.body).toHaveProperty("error");
		});
	});
});
