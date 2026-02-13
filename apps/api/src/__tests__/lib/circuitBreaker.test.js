/**
 * Circuit Breaker Tests
 * Tests for circuit breaker pattern implementation
 */

const CircuitBreaker = require('../../lib/circuitBreaker');

describe('Circuit Breaker', () => {
    let breaker;
    let mockOperation;

    beforeEach(() => {
        jest.clearAllMocks();
        mockOperation = jest.fn();
    });

    describe('Initialization', () => {
        it('should initialize with default options', () => {
            breaker = new CircuitBreaker(mockOperation);

            expect(breaker.state).toBe('CLOSED');
            expect(breaker.failureThreshold).toBe(5);
            expect(breaker.successThreshold).toBe(2);
            expect(breaker.timeout).toBe(60000);
        });

        it('should accept custom options', () => {
            breaker = new CircuitBreaker(mockOperation, {
                failureThreshold: 3,
                successThreshold: 1,
                timeout: 30000,
                requestTimeout: 5000,
            });

            expect(breaker.failureThreshold).toBe(3);
            expect(breaker.successThreshold).toBe(1);
            expect(breaker.timeout).toBe(30000);
            expect(breaker.requestTimeout).toBe(5000);
        });

        it('should set default name', () => {
            breaker = new CircuitBreaker(mockOperation);

            expect(breaker.name).toBe('CircuitBreaker');
        });

        it('should accept custom name', () => {
            breaker = new CircuitBreaker(mockOperation, { name: 'StripeAPI' });

            expect(breaker.name).toBe('StripeAPI');
        });
    });

    describe('CLOSED State', () => {
        beforeEach(() => {
            breaker = new CircuitBreaker(mockOperation);
        });

        it('should execute operation successfully', async () => {
            mockOperation.mockResolvedValue({ success: true });

            const result = await breaker.execute({ test: true });

            expect(result).toEqual({ success: true });
            expect(mockOperation).toHaveBeenCalledWith({ test: true });
        });

        it('should remain closed on success', async () => {
            mockOperation.mockResolvedValue({ success: true });

            await breaker.execute();

            expect(breaker.state).toBe('CLOSED');
        });

        it('should track failures', async () => {
            mockOperation.mockRejectedValue(new Error('API Error'));

            try {
                await breaker.execute();
            } catch (err) {
                expect(breaker.failureCount).toBe(1);
            }
        });

        it('should open after threshold failures', async () => {
            breaker = new CircuitBreaker(mockOperation, { failureThreshold: 3 });
            mockOperation.mockRejectedValue(new Error('API Error'));

            for (let i = 0; i < 3; i++) {
                try {
                    await breaker.execute();
                } catch (err) {
                    // Expected
                }
            }

            expect(breaker.state).toBe('OPEN');
        });
    });

    describe('OPEN State', () => {
        beforeEach(() => {
            breaker = new CircuitBreaker(mockOperation, {
                failureThreshold: 2,
                timeout: 1000,
            });
        });

        it('should reject requests immediately', async () => {
            mockOperation.mockRejectedValue(new Error('API Error'));

            // Trigger failures to open circuit
            for (let i = 0; i < 2; i++) {
                try {
                    await breaker.execute();
                } catch (err) {
                    // Expected
                }
            }

            // Circuit should be open
            await expect(breaker.execute()).rejects.toThrow(/Circuit breaker is OPEN/);
        });

        it('should transition to HALF_OPEN after timeout', async () => {
            mockOperation.mockRejectedValue(new Error('API Error'));

            // Open the circuit
            for (let i = 0; i < 2; i++) {
                try {
                    await breaker.execute();
                } catch (err) {
                    // Expected
                }
            }

            // Wait for timeout
            breaker.nextAttempt = Date.now() - 1000;
            mockOperation.mockResolvedValue({ success: true });

            await breaker.execute();

            expect(breaker.state).toBe('HALF_OPEN');
        });
    });

    describe('HALF_OPEN State', () => {
        beforeEach(() => {
            breaker = new CircuitBreaker(mockOperation, {
                failureThreshold: 2,
                successThreshold: 2,
                timeout: 1000,
            });
        });

        it('should close after success threshold', async () => {
            mockOperation.mockRejectedValue(new Error('API Error'));

            // Open circuit
            for (let i = 0; i < 2; i++) {
                try {
                    await breaker.execute();
                } catch (err) {
                    // Expected
                }
            }

            // Enter half-open
            breaker.nextAttempt = Date.now() - 1000;
            mockOperation.mockResolvedValue({ success: true });

            // Succeed twice to close
            await breaker.execute();
            await breaker.execute();

            expect(breaker.state).toBe('CLOSED');
        });

        it('should reopen on failure', async () => {
            mockOperation.mockRejectedValue(new Error('API Error'));

            // Open circuit
            for (let i = 0; i < 2; i++) {
                try {
                    await breaker.execute();
                } catch (err) {
                    // Expected
                }
            }

            // Enter half-open
            breaker.nextAttempt = Date.now() - 1000;

            // Fail again
            await expect(breaker.execute()).rejects.toThrow();

            expect(breaker.state).toBe('OPEN');
        });
    });

    describe('Request Timeout', () => {
        it('should timeout slow requests', async () => {
            breaker = new CircuitBreaker(mockOperation, { requestTimeout: 100 });

            mockOperation.mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 500))
            );

            await expect(breaker.execute()).rejects.toThrow(/Request timeout/);
        });

        it('should not timeout fast requests', async () => {
            breaker = new CircuitBreaker(mockOperation, { requestTimeout: 500 });

            mockOperation.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
            );

            const result = await breaker.execute();
            expect(result).toEqual({ success: true });
        });
    });

    describe('Failure Tracking', () => {
        beforeEach(() => {
            breaker = new CircuitBreaker(mockOperation);
        });

        it('should reset failure count on success', async () => {
            mockOperation
                .mockRejectedValueOnce(new Error('Error 1'))
                .mockRejectedValueOnce(new Error('Error 2'))
                .mockResolvedValue({ success: true });

            try { await breaker.execute(); } catch (e) { }
            try { await breaker.execute(); } catch (e) { }

            expect(breaker.failureCount).toBe(2);

            await breaker.execute();

            expect(breaker.failureCount).toBe(0);
        });

        it('should track last error', async () => {
            mockOperation.mockRejectedValue(new Error('Test Error'));

            try {
                await breaker.execute();
            } catch (err) {
                expect(breaker.lastError).toBeDefined();
                expect(breaker.lastError.message).toBe('Test Error');
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle synchronous errors', async () => {
            mockOperation.mockImplementation(() => {
                throw new Error('Sync Error');
            });

            breaker = new CircuitBreaker(mockOperation);

            await expect(breaker.execute()).rejects.toThrow('Sync Error');
        });

        it('should handle null results', async () => {
            mockOperation.mockResolvedValue(null);

            breaker = new CircuitBreaker(mockOperation);

            const result = await breaker.execute();
            expect(result).toBeNull();
        });

        it('should handle undefined results', async () => {
            mockOperation.mockResolvedValue(undefined);

            breaker = new CircuitBreaker(mockOperation);

            const result = await breaker.execute();
            expect(result).toBeUndefined();
        });
    });

    describe('State Transitions', () => {
        it('should follow CLOSED -> OPEN -> HALF_OPEN -> CLOSED cycle', async () => {
            breaker = new CircuitBreaker(mockOperation, {
                failureThreshold: 2,
                successThreshold: 1,
                timeout: 100,
            });

            expect(breaker.state).toBe('CLOSED');

            // Open circuit
            mockOperation.mockRejectedValue(new Error('Error'));
            for (let i = 0; i < 2; i++) {
                try { await breaker.execute(); } catch (e) { }
            }
            expect(breaker.state).toBe('OPEN');

            // Wait and enter half-open
            await new Promise(resolve => setTimeout(resolve, 150));
            mockOperation.mockResolvedValue({ success: true });
            await breaker.execute();
            expect(breaker.state).toBe('CLOSED');
        });
    });
});
