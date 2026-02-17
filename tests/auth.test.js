const request = require('supertest');
const jwt = require('jsonwebtoken');

// 1. Mock DB - Correct approach for module exporting pool.promise()
jest.mock('../config/db', () => ({
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn()
}));
const db = require('../config/db');

// 2. Mock HashService
jest.mock('../services/hashService', () => ({
    hash: jest.fn(),
    verify: jest.fn()
}));
const hashService = require('../services/hashService');

// 3. Import app
const app = require('../app');

describe('Auth Endpoints', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test_secret';
        hashService.hash.mockResolvedValue('hashed_password_123');
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                contrasena: 'hashed_password',
                rol: 'Usuario',
                foto_url: null
            };

            // Mock DB response: [rows, fields]
            db.query.mockResolvedValueOnce([[mockUser], []]);

            // Mock hash service
            hashService.verify.mockResolvedValueOnce(true);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    contrasena: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.userData.email).toBe('test@example.com');
            // Assert mock calls
            expect(db.query).toHaveBeenCalled();
            expect(hashService.verify).toHaveBeenCalledWith('password123', 'hashed_password');
        });

        it('should fail with 401 if user does not exist', async () => {
            // Mock DB empty result
            db.query.mockResolvedValueOnce([[], []]);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    contrasena: 'password123'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.error).toBe('Usuario no registrado');
        });

        it('should fail with 401 if password is incorrect', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                contrasena: 'hashed_password',
                rol: 'Usuario'
            };

            db.query.mockResolvedValueOnce([[mockUser], []]);
            hashService.verify.mockResolvedValueOnce(false);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    contrasena: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.error).toBe('Contraseña incorrecta');
        });
    });
});
