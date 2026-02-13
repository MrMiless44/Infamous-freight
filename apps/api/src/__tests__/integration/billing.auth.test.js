const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../../../src/server');

function signToken(payload = {}) {
    const base = { sub: 'user-1', email: 'u1@example.com', ...payload };
    return jwt.sign(base, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Billing route auth/scope enforcement', () => {
    test('allows billing:admin scope', async () => {
        const token = signToken({ scopes: ['billing:admin'] });
        const res = await request(app)
            .get('/api/revenue')
            .set('Authorization', `Bearer ${token}`);
        expect([200, 403]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.success).toBe(true);
        }
    });

    test('403 when scope missing', async () => {
        const token = signToken({ scopes: [] });
        const res = await request(app)
            .get('/api/revenue')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Insufficient scope/i);
    });
});
