const request = require('supertest');

// Mock the database connection BEFORE importing app
jest.mock('../config/db', () => ({
    promise: jest.fn().mockReturnThis(),
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn()
}));

const app = require('../app');

describe('API Health Check', () => {
    it('should return 200 OK for /api/health', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ok');
        expect(res.body.message).toContain('Gestor de Activos Backend is running correctly');
    });
});
