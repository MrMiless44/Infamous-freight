/**
 * JWT Scope Middleware Tests
 * 
 * Comprehensive test suite for JWT authentication and scope-based authorization.
 * Tests the security.js middleware including authenticate() and requireScope().
 * 
 * Coverage:
 * - JWT token validation
 * - Scope enforcement
 * - Error handling
 * - Edge cases
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticate, requireScope } = require('../src/middleware/security');

// Test JWT secret (matches what's used in security.js)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('JWT Scope Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    /**
     * Helper function to generate valid JWT tokens
     */
    const generateToken = (payload) => {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    };

    describe('authenticate() middleware', () => {
        beforeEach(() => {
            app.get('/protected', authenticate, (req, res) => {
                res.json({ success: true, user: req.user });
            });
        });

        test('should accept valid JWT token in Authorization header', async () => {
            const token = generateToken({ sub: 'user123', email: 'test@example.com' });

            const response = await request(app)
                .get('/protected')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user.sub).toBe('user123');
            expect(response.body.user.email).toBe('test@example.com');
        });

        test('should reject request without Authorization header', async () => {
            const response = await request(app).get('/protected');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('No token provided');
        });

        test('should reject malformed Authorization header (missing Bearer)', async () => {
            const token = generateToken({ sub: 'user123' });

            const response = await request(app)
                .get('/protected')
                .set('Authorization', token); // Missing 'Bearer ' prefix

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('No token provided');
        });

        test('should reject invalid JWT token', async () => {
            const response = await request(app)
                .get('/protected')
                .set('Authorization', 'Bearer invalid.token.here');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid token');
        });

        test('should reject expired JWT token', async () => {
            const expiredToken = jwt.sign(
                { sub: 'user123', email: 'test@example.com' },
                process.env.JWT_SECRET,
                { expiresIn: '-1h' } // Already expired
            );

            const response = await request(app)
                .get('/protected')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid token');
        });

        test('should reject JWT signed with wrong secret', async () => {
            const wrongToken = jwt.sign(
                { sub: 'user123' },
                'wrong-secret',
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .get('/protected')
                .set('Authorization', `Bearer ${wrongToken}`);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid token');
        });

        test('should attach decoded user to req.user', async () => {
            const token = generateToken({
                sub: 'user123',
                email: 'test@example.com',
                role: 'admin',
                scopes: ['read:shipments', 'write:shipments']
            });

            const response = await request(app)
                .get('/protected')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.user).toMatchObject({
                sub: 'user123',
                email: 'test@example.com',
                role: 'admin',
                scopes: ['read:shipments', 'write:shipments']
            });
        });
    });

    describe('requireScope() middleware', () => {
        beforeEach(() => {
            // Route that requires 'read:shipments' scope
            app.get(
                '/shipments',
                authenticate,
                requireScope('read:shipments'),
                (req, res) => {
                    res.json({ success: true, data: [] });
                }
            );

            // Route that requires 'write:shipments' scope
            app.post(
                '/shipments',
                authenticate,
                requireScope('write:shipments'),
                (req, res) => {
                    res.json({ success: true, id: 'shipment123' });
                }
            );

            // Route that requires 'admin' scope
            app.delete(
                '/users/:id',
                authenticate,
                requireScope('admin'),
                (req, res) => {
                    res.json({ success: true, deleted: true });
                }
            );
        });

        test('should allow access when user has required scope', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['read:shipments', 'write:shipments']
            });

            const response = await request(app)
                .get('/shipments')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should deny access when user lacks required scope', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['read:shipments'] // Missing 'write:shipments'
            });

            const response = await request(app)
                .post('/shipments')
                .set('Authorization', `Bearer ${token}`)
                .send({ origin: 'NYC', destination: 'LA' });

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('Insufficient permissions');
        });

        test('should deny access when user has no scopes', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: [] // No scopes
            });

            const response = await request(app)
                .get('/shipments')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
        });

        test('should deny access when scopes field is missing', async () => {
            const token = generateToken({
                sub: 'user123'
                // No scopes field at all
            });

            const response = await request(app)
                .get('/shipments')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
        });

        test('should allow access when user has multiple scopes including required', async () => {
            const token = generateToken({
                sub: 'admin123',
                scopes: ['read:shipments', 'write:shipments', 'admin', 'billing:read']
            });

            const response = await request(app)
                .delete('/users/user456')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should handle case-sensitive scope matching', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['Read:Shipments'] // Wrong case
            });

            const response = await request(app)
                .get('/shipments')
                .set('Authorization', `Bearer ${token}`);

            // Should fail because scopes are case-sensitive
            expect(response.status).toBe(403);
        });

        test('should work with AI command scope', async () => {
            app.post(
                '/ai/command',
                authenticate,
                requireScope('ai:command'),
                (req, res) => {
                    res.json({ success: true, result: 'Command processed' });
                }
            );

            const token = generateToken({
                sub: 'user123',
                scopes: ['ai:command', 'read:shipments']
            });

            const response = await request(app)
                .post('/ai/command')
                .set('Authorization', `Bearer ${token}`)
                .send({ command: 'analyze shipment' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should work with voice ingest scope', async () => {
            app.post(
                '/voice/ingest',
                authenticate,
                requireScope('voice:ingest'),
                (req, res) => {
                    res.json({ success: true, transcription: 'Test audio' });
                }
            );

            const token = generateToken({
                sub: 'driver123',
                scopes: ['voice:ingest', 'voice:command']
            });

            const response = await request(app)
                .post('/voice/ingest')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        test('should work with billing scope', async () => {
            app.post(
                '/billing/charge',
                authenticate,
                requireScope('billing:write'),
                (req, res) => {
                    res.json({ success: true, chargeId: 'ch_123' });
                }
            );

            const token = generateToken({
                sub: 'admin123',
                scopes: ['billing:read', 'billing:write']
            });

            const response = await request(app)
                .post('/billing/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 1000 });

            expect(response.status).toBe(200);
        });
    });

    describe('Integration: authenticate + requireScope', () => {
        test('should enforce both authentication and scope in correct order', async () => {
            app.get(
                '/admin/users',
                authenticate,
                requireScope('admin'),
                (req, res) => {
                    res.json({ users: [] });
                }
            );

            // Test 1: No token (fails at authenticate)
            const noTokenResponse = await request(app).get('/admin/users');
            expect(noTokenResponse.status).toBe(401);

            // Test 2: Valid token but wrong scope (passes authenticate, fails at requireScope)
            const wrongScopeToken = generateToken({
                sub: 'user123',
                scopes: ['read:shipments']
            });
            const wrongScopeResponse = await request(app)
                .get('/admin/users')
                .set('Authorization', `Bearer ${wrongScopeToken}`);
            expect(wrongScopeResponse.status).toBe(403);

            // Test 3: Valid token with correct scope (passes both)
            const validToken = generateToken({
                sub: 'admin123',
                scopes: ['admin']
            });
            const validResponse = await request(app)
                .get('/admin/users')
                .set('Authorization', `Bearer ${validToken}`);
            expect(validResponse.status).toBe(200);
        });

        test('should allow chaining multiple scope requirements', async () => {
            // Hypothetical route requiring multiple scopes
            app.post(
                '/admin/billing',
                authenticate,
                requireScope('admin'),
                requireScope('billing:write'),
                (req, res) => {
                    res.json({ success: true });
                }
            );

            // User with only admin scope
            const adminOnlyToken = generateToken({
                sub: 'admin123',
                scopes: ['admin']
            });
            const adminOnlyResponse = await request(app)
                .post('/admin/billing')
                .set('Authorization', `Bearer ${adminOnlyToken}`);
            expect(adminOnlyResponse.status).toBe(403);

            // User with both required scopes
            const bothScopesToken = generateToken({
                sub: 'superadmin123',
                scopes: ['admin', 'billing:write']
            });
            const bothScopesResponse = await request(app)
                .post('/admin/billing')
                .set('Authorization', `Bearer ${bothScopesToken}`);
            expect(bothScopesResponse.status).toBe(200);
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            app.get(
                '/test',
                authenticate,
                requireScope('test:scope'),
                (req, res) => {
                    res.json({ success: true });
                }
            );
        });

        test('should handle empty string token', async () => {
            const response = await request(app)
                .get('/test')
                .set('Authorization', 'Bearer ');

            expect(response.status).toBe(401);
        });

        test('should handle malformed JWT (not 3 parts)', async () => {
            const response = await request(app)
                .get('/test')
                .set('Authorization', 'Bearer invalid.token');

            expect(response.status).toBe(401);
        });

        test('should handle JWT with null payload', async () => {
            // This should fail during signing or be caught during verification
            const response = await request(app)
                .get('/test')
                .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.bnVsbA.invalid');

            expect(response.status).toBe(401);
        });

        test('should handle scopes as non-array type', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: 'read:shipments' // String instead of array
            });

            const response = await request(app)
                .get('/test')
                .set('Authorization', `Bearer ${token}`);

            // Should fail because scopes should be an array
            expect(response.status).toBe(403);
        });

        test('should handle very long scope names', async () => {
            const longScope = 'a'.repeat(500);
            const token = generateToken({
                sub: 'user123',
                scopes: [longScope]
            });

            app.get(
                '/long-scope',
                authenticate,
                requireScope(longScope),
                (req, res) => res.json({ success: true })
            );

            const response = await request(app)
                .get('/long-scope')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        test('should handle special characters in scope names', async () => {
            const specialScope = 'scope:with-dash_and.dot/slash';
            const token = generateToken({
                sub: 'user123',
                scopes: [specialScope]
            });

            app.get(
                '/special-scope',
                authenticate,
                requireScope(specialScope),
                (req, res) => res.json({ success: true })
            );

            const response = await request(app)
                .get('/special-scope')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        test('should handle token with additional custom claims', async () => {
            const token = generateToken({
                sub: 'user123',
                email: 'test@example.com',
                scopes: ['test:scope'],
                customField: 'customValue',
                roles: ['driver', 'user'],
                metadata: { plan: 'premium' }
            });

            const response = await request(app)
                .get('/test')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Performance', () => {
        test('should handle high volume of sequential requests efficiently', async () => {
            app.get(
                '/perf-test',
                authenticate,
                requireScope('test:scope'),
                (req, res) => res.json({ ok: true })
            );

            const token = generateToken({
                sub: 'user123',
                scopes: ['test:scope']
            });

            const startTime = Date.now();
            const requests = [];

            // Send 100 sequential requests
            for (let i = 0; i < 100; i++) {
                requests.push(
                    request(app)
                        .get('/perf-test')
                        .set('Authorization', `Bearer ${token}`)
                );
            }

            await Promise.all(requests);
            const duration = Date.now() - startTime;

            // Should complete 100 requests in under 5 seconds (50ms per request)
            expect(duration).toBeLessThan(5000);
        });

        test('should handle concurrent requests without race conditions', async () => {
            let requestCount = 0;
            app.get(
                '/concurrent-test',
                authenticate,
                requireScope('test:scope'),
                (req, res) => {
                    requestCount++;
                    res.json({ count: requestCount });
                }
            );

            const token = generateToken({
                sub: 'user123',
                scopes: ['test:scope']
            });

            // Send 50 concurrent requests
            const requests = Array(50).fill(null).map(() =>
                request(app)
                    .get('/concurrent-test')
                    .set('Authorization', `Bearer ${token}`)
            );

            const responses = await Promise.all(requests);

            // All should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Final count should be exactly 50
            expect(requestCount).toBe(50);
        });
    });

    describe('Security', () => {
        test('should not leak sensitive information in error messages', async () => {
            app.get('/secure', authenticate, (req, res) => {
                res.json({ data: 'sensitive' });
            });

            const response = await request(app)
                .get('/secure')
                .set('Authorization', 'Bearer invalid.token.here');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid token');
            // Should not contain JWT secret, internal paths, or stack traces
            expect(JSON.stringify(response.body)).not.toContain(process.env.JWT_SECRET);
        });

        test('should not allow scope injection via token manipulation', async () => {
            // Create a token with limited scopes
            const limitedToken = generateToken({
                sub: 'user123',
                scopes: ['read:shipments']
            });

            // Try to access admin endpoint
            app.delete(
                '/admin/delete',
                authenticate,
                requireScope('admin'),
                (req, res) => res.json({ deleted: true })
            );

            const response = await request(app)
                .delete('/admin/delete')
                .set('Authorization', `Bearer ${limitedToken}`);

            // Should be denied
            expect(response.status).toBe(403);
        });

        test('should prevent JWT algorithm confusion attack (alg: none)', async () => {
            // Manually craft a token with "alg": "none"
            const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({ sub: 'hacker', scopes: ['admin'] })).toString('base64url');
            const maliciousToken = `${header}.${payload}.`;

            app.get('/protected', authenticate, (req, res) => {
                res.json({ success: true });
            });

            const response = await request(app)
                .get('/protected')
                .set('Authorization', `Bearer ${maliciousToken}`);

            // Should reject the malicious token
            expect(response.status).toBe(401);
        });
    });
});

// Export for use in integration tests
module.exports = {
    generateToken: (payload) => {
        return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    }
};
