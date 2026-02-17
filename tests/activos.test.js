const request = require('supertest');

// 1. Mock DB (Hoisting safe)
jest.mock('../config/db', () => ({
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn()
}));
const db = require('../config/db');

// 2. Mock Middlewares
jest.mock('../middleware/authenticate', () => (req, res, next) => {
    req.user = { id: 1, rol: 'Administrador' };
    next();
});
jest.mock('../middleware/checkRole', () => (role) => (req, res, next) => {
    next();
});

// 3. Mock Image Upload (Corrected)
jest.mock('../middleware/imageUpload', () => ({
    imageUploadMiddleware: (req, res, next) => next()
}));

const app = require('../app');

describe('Activos Endpoints', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/gestion-activos/activos', () => {
        it('should return list of activos', async () => {
            const mockActivos = [
                { id: 1, nombre: 'Laptop 1', tipo: 'Computo' }
            ];
            const mockCount = [{ total: 1 }];

            // query called twice: 1. data, 2. count
            db.query
                .mockResolvedValueOnce([mockActivos, []])
                .mockResolvedValueOnce([mockCount, []]);

            const res = await request(app).get('/api/gestion-activos/activos');

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('GET /api/gestion-activos/activos/:id', () => {
        it('should return asset details if found', async () => {
            const mockActivo = {
                id: 1,
                nombre: 'Laptop 1',
                tipo_id: 1,
                tipo_nombre: 'Computo'
            };
            // 1. Get Activo
            db.query.mockResolvedValueOnce([[mockActivo], []]);
            // 2. Get Garantias
            db.query.mockResolvedValueOnce([[], []]);

            const res = await request(app).get('/api/gestion-activos/activos/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body.nombre).toBe('Laptop 1');
        });

        it('should return 404 if asset not found', async () => {
            db.query.mockResolvedValueOnce([[], []]);
            const res = await request(app).get('/api/gestion-activos/activos/999');
            expect(res.statusCode).toEqual(404);
        });
    });

    describe('POST /api/gestion-activos/activos', () => {
        it('should create new asset successfully', async () => {
            const newAsset = {
                nombre: 'New Laptop',
                tipo_id: 1,
                fecha_adquisicion: '2023-01-01',
                valor_compra: 1000,
                estado: 'Disponible',
                proveedor_id: 1
            };

            // 1. Insert Activo
            db.query.mockResolvedValueOnce([{ insertId: 10 }, []]);
            // 2. Insert Historial
            db.query.mockResolvedValueOnce([{}, []]);

            const res = await request(app)
                .post('/api/gestion-activos/activos')
                .send(newAsset);

            expect(res.statusCode).toEqual(201);
            expect(res.body.id).toBe(10);
        });

        it('should fail with 400 if validation fails', async () => {
            const invalidAsset = { nombre: 'Incomplete' };
            const res = await request(app)
                .post('/api/gestion-activos/activos')
                .send(invalidAsset);
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('PATCH /api/gestion-activos/baja/:id', () => {
        it('should discharge asset successfully', async () => {
            const mockActivo = { id: 1, nombre: 'Old PC', estado: 'Disponible' };

            // 1. Check existence
            db.query.mockResolvedValueOnce([[mockActivo], []]);
            // 2. Check assignments
            db.query.mockResolvedValueOnce([[], []]); // No assignments
            // 3. Update status
            db.query.mockResolvedValueOnce([{}, []]);
            // 4. Insert Historial
            db.query.mockResolvedValueOnce([{}, []]);

            const res = await request(app).patch('/api/gestion-activos/baja/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
        });
    });

});
