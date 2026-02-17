const request = require('supertest');

// 1. Mock DB
jest.mock('../config/db', () => ({
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn()
}));
const db = require('../config/db');

// 2. Mock Middlewares
jest.mock('../middleware/authenticate', () => (req, res, next) => {
    req.user = { id: 1, rol: 'Administrador', email: 'admin@test.com' };
    next();
});
jest.mock('../middleware/checkRole', () => (role) => (req, res, next) => {
    next();
});
jest.mock('../middleware/imageUpload', () => ({
    imageUploadMiddleware: (req, res, next) => next()
}));

const app = require('../app');

describe('Asignaciones Endpoints', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/asignaciones', () => {
        it('should return list of asignaciones', async () => {
            const mockAsignaciones = [
                { id: 1, activo: 'Laptop', usuario: 'Juan' }
            ];
            const mockCount = [{ total: 1 }];

            // 1. Get assignments
            db.query.mockResolvedValueOnce([mockAsignaciones, []]);
            // 2. Get total count
            db.query.mockResolvedValueOnce([mockCount, []]);

            const res = await request(app).get('/api/asignaciones');

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('POST /api/asignaciones', () => {
        it('should create assignment successfully', async () => {
            const newAsignacion = {
                activo_id: 1,
                usuario_id: 2,
                ubicacion_id: 3,
                fecha_asignacion: '2023-01-01'
            };

            // 1. Validate existence (activo, usuario, ubicacion)
            db.query.mockResolvedValueOnce([
                [{ activo_existe: 1, usuario_existe: 1, ubicacion_existe: 1 }],
                []
            ]);
            // 2. Get Activo Name
            db.query.mockResolvedValueOnce([[{ nombre: 'Laptop' }], []]);
            // 3. Get Usuario Name
            db.query.mockResolvedValueOnce([[{ nombre: 'Juan' }], []]);
            // 4. Get Ubicacion Name
            db.query.mockResolvedValueOnce([[{ nombre: 'Oficina' }], []]);
            // 5. Insert Asignacion
            db.query.mockResolvedValueOnce([{ insertId: 50 }, []]);
            // 6. Update Activo Status
            db.query.mockResolvedValueOnce([{}, []]);
            // 7. Insert Historial
            db.query.mockResolvedValueOnce([{}, []]);

            const res = await request(app)
                .post('/api/asignaciones')
                .send(newAsignacion);

            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toBe(50);
            expect(res.body.message).toContain('creada correctamente');
        });

        it('should fail if entities do not exist', async () => {
            const newAsignacion = {
                activo_id: 99,
                usuario_id: 2,
                ubicacion_id: 3,
                fecha_asignacion: '2023-01-01'
            };

            // 1. Validate existence (activo does not exist)
            db.query.mockResolvedValueOnce([
                [{ activo_existe: 0, usuario_existe: 1, ubicacion_existe: 1 }],
                []
            ]);

            const res = await request(app)
                .post('/api/asignaciones')
                .send(newAsignacion);

            expect(res.statusCode).toEqual(404);
            expect(res.body.error).toContain('activo no existe');
        });
    });

    describe('DELETE /api/asignaciones/:id', () => {
        it('should delete assignment and free asset', async () => {
            const mockAsignacion = {
                asignacion_id: 1,
                activo_id: 10,
                activo_nombre: 'Laptop'
            };

            // 1. Get Asignacion info
            db.query.mockResolvedValueOnce([[mockAsignacion], []]);
            // 2. Update Activo state to Available
            db.query.mockResolvedValueOnce([{}, []]);
            // 3. Delete Asignacion
            db.query.mockResolvedValueOnce([{}, []]);
            // 4. Insert Historial
            db.query.mockResolvedValueOnce([{}, []]);

            const res = await request(app).delete('/api/asignaciones/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toContain('eliminada');
        });
    });

});
