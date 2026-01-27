/**
 * Feature Flags Tests
 * 
 * Comprehensive test suite for feature flag system.
 * Tests dynamic feature toggles for gradual rollouts, A/B testing, and kill switches.
 * 
 * Coverage:
 * - Feature flag evaluation
 * - User-based rollouts
 * - Percentage-based rollouts
 * - Override mechanisms
 * - Edge cases
 */

const { FeatureFlags } = require('../src/services/feature-flags');

describe('Feature Flags System', () => {
    let featureFlags;

    beforeEach(() => {
        featureFlags = new FeatureFlags();
    });

    afterEach(() => {
        featureFlags.reset();
    });

    describe('Basic Flag Operations', () => {
        test('should return false for undefined feature flag', () => {
            const isEnabled = featureFlags.isEnabled('nonexistent-feature', { userId: 'user123' });
            expect(isEnabled).toBe(false);
        });

        test('should enable feature for all users when flag is true', () => {
            featureFlags.set('new-dashboard', { enabled: true });

            expect(featureFlags.isEnabled('new-dashboard', { userId: 'user1' })).toBe(true);
            expect(featureFlags.isEnabled('new-dashboard', { userId: 'user2' })).toBe(true);
            expect(featureFlags.isEnabled('new-dashboard', { userId: 'user999' })).toBe(true);
        });

        test('should disable feature for all users when flag is false', () => {
            featureFlags.set('beta-feature', { enabled: false });

            expect(featureFlags.isEnabled('beta-feature', { userId: 'user1' })).toBe(false);
            expect(featureFlags.isEnabled('beta-feature', { userId: 'user2' })).toBe(false);
        });

        test('should allow updating feature flag state', () => {
            featureFlags.set('toggle-feature', { enabled: false });
            expect(featureFlags.isEnabled('toggle-feature', { userId: 'user1' })).toBe(false);

            featureFlags.set('toggle-feature', { enabled: true });
            expect(featureFlags.isEnabled('toggle-feature', { userId: 'user1' })).toBe(true);
        });

        test('should support multiple independent feature flags', () => {
            featureFlags.set('feature-a', { enabled: true });
            featureFlags.set('feature-b', { enabled: false });
            featureFlags.set('feature-c', { enabled: true });

            expect(featureFlags.isEnabled('feature-a', { userId: 'user1' })).toBe(true);
            expect(featureFlags.isEnabled('feature-b', { userId: 'user1' })).toBe(false);
            expect(featureFlags.isEnabled('feature-c', { userId: 'user1' })).toBe(true);
        });
    });

    describe('User-Based Rollouts', () => {
        test('should enable feature for specific whitelisted users', () => {
            featureFlags.set('vip-feature', {
                enabled: false,
                whitelist: ['user123', 'user456']
            });

            expect(featureFlags.isEnabled('vip-feature', { userId: 'user123' })).toBe(true);
            expect(featureFlags.isEnabled('vip-feature', { userId: 'user456' })).toBe(true);
            expect(featureFlags.isEnabled('vip-feature', { userId: 'user789' })).toBe(false);
        });

        test('should disable feature for blacklisted users even if globally enabled', () => {
            featureFlags.set('problematic-feature', {
                enabled: true,
                blacklist: ['user999']
            });

            expect(featureFlags.isEnabled('problematic-feature', { userId: 'user123' })).toBe(true);
            expect(featureFlags.isEnabled('problematic-feature', { userId: 'user999' })).toBe(false);
        });

        test('should prioritize whitelist over enabled=false', () => {
            featureFlags.set('beta-access', {
                enabled: false,
                whitelist: ['beta-tester-1', 'beta-tester-2']
            });

            expect(featureFlags.isEnabled('beta-access', { userId: 'beta-tester-1' })).toBe(true);
            expect(featureFlags.isEnabled('beta-access', { userId: 'regular-user' })).toBe(false);
        });

        test('should prioritize blacklist over whitelist', () => {
            featureFlags.set('conflicting-lists', {
                enabled: true,
                whitelist: ['user123'],
                blacklist: ['user123']
            });

            // Blacklist should take precedence
            expect(featureFlags.isEnabled('conflicting-lists', { userId: 'user123' })).toBe(false);
        });
    });

    describe('Percentage-Based Rollouts', () => {
        test('should enable feature for 0% of users', () => {
            featureFlags.set('zero-percent', {
                enabled: false,
                rolloutPercentage: 0
            });

            const userIds = Array.from({ length: 100 }, (_, i) => `user${i}`);
            const enabledCount = userIds.filter(userId =>
                featureFlags.isEnabled('zero-percent', { userId })
            ).length;

            expect(enabledCount).toBe(0);
        });

        test('should enable feature for 100% of users', () => {
            featureFlags.set('hundred-percent', {
                enabled: true,
                rolloutPercentage: 100
            });

            const userIds = Array.from({ length: 100 }, (_, i) => `user${i}`);
            const enabledCount = userIds.filter(userId =>
                featureFlags.isEnabled('hundred-percent', { userId })
            ).length;

            expect(enabledCount).toBe(100);
        });

        test('should enable feature for approximately 50% of users', () => {
            featureFlags.set('fifty-percent', {
                enabled: false,
                rolloutPercentage: 50
            });

            const userIds = Array.from({ length: 1000 }, (_, i) => `user${i}`);
            const enabledCount = userIds.filter(userId =>
                featureFlags.isEnabled('fifty-percent', { userId })
            ).length;

            // Allow 5% variance (475-525 out of 1000)
            expect(enabledCount).toBeGreaterThan(475);
            expect(enabledCount).toBeLessThan(525);
        });

        test('should enable feature for approximately 10% of users', () => {
            featureFlags.set('ten-percent', {
                enabled: false,
                rolloutPercentage: 10
            });

            const userIds = Array.from({ length: 1000 }, (_, i) => `user${i}`);
            const enabledCount = userIds.filter(userId =>
                featureFlags.isEnabled('ten-percent', { userId })
            ).length;

            // Allow 3% variance (70-130 out of 1000)
            expect(enabledCount).toBeGreaterThan(70);
            expect(enabledCount).toBeLessThan(130);
        });

        test('should be deterministic for same user ID', () => {
            featureFlags.set('consistent-rollout', {
                enabled: false,
                rolloutPercentage: 50
            });

            const result1 = featureFlags.isEnabled('consistent-rollout', { userId: 'user123' });
            const result2 = featureFlags.isEnabled('consistent-rollout', { userId: 'user123' });
            const result3 = featureFlags.isEnabled('consistent-rollout', { userId: 'user123' });

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        test('should combine percentage rollout with whitelist', () => {
            featureFlags.set('combined-rollout', {
                enabled: false,
                rolloutPercentage: 10,
                whitelist: ['vip-user']
            });

            // VIP user should always be enabled regardless of percentage
            expect(featureFlags.isEnabled('combined-rollout', { userId: 'vip-user' })).toBe(true);

            // Other users subject to 10% rollout
            const regularUsers = Array.from({ length: 100 }, (_, i) => `user${i}`);
            const enabledCount = regularUsers.filter(userId =>
                featureFlags.isEnabled('combined-rollout', { userId })
            ).length;

            expect(enabledCount).toBeGreaterThan(5);
            expect(enabledCount).toBeLessThan(20);
        });
    });

    describe('Environment-Based Flags', () => {
        test('should enable feature only in development environment', () => {
            featureFlags.set('dev-only-feature', {
                enabled: false,
                environments: ['development']
            });

            const devContext = { userId: 'user1', environment: 'development' };
            const prodContext = { userId: 'user1', environment: 'production' };

            expect(featureFlags.isEnabled('dev-only-feature', devContext)).toBe(true);
            expect(featureFlags.isEnabled('dev-only-feature', prodContext)).toBe(false);
        });

        test('should enable feature in multiple environments', () => {
            featureFlags.set('staging-prod-feature', {
                enabled: false,
                environments: ['staging', 'production']
            });

            expect(featureFlags.isEnabled('staging-prod-feature', {
                userId: 'user1',
                environment: 'development'
            })).toBe(false);

            expect(featureFlags.isEnabled('staging-prod-feature', {
                userId: 'user1',
                environment: 'staging'
            })).toBe(true);

            expect(featureFlags.isEnabled('staging-prod-feature', {
                userId: 'user1',
                environment: 'production'
            })).toBe(true);
        });
    });

    describe('Time-Based Flags', () => {
        test('should enable feature after start date', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

            featureFlags.set('scheduled-feature', {
                enabled: false,
                startDate: yesterday
            });

            expect(featureFlags.isEnabled('scheduled-feature', { userId: 'user1' })).toBe(true);
        });

        test('should disable feature before start date', () => {
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

            featureFlags.set('future-feature', {
                enabled: false,
                startDate: tomorrow
            });

            expect(featureFlags.isEnabled('future-feature', { userId: 'user1' })).toBe(false);
        });

        test('should disable feature after end date', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

            featureFlags.set('expired-feature', {
                enabled: true,
                endDate: yesterday
            });

            expect(featureFlags.isEnabled('expired-feature', { userId: 'user1' })).toBe(false);
        });

        test('should enable feature within date range', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

            featureFlags.set('time-limited-feature', {
                enabled: false,
                startDate: yesterday,
                endDate: tomorrow
            });

            expect(featureFlags.isEnabled('time-limited-feature', { userId: 'user1' })).toBe(true);
        });
    });

    describe('Custom Rule Evaluation', () => {
        test('should evaluate custom function rules', () => {
            featureFlags.set('premium-only', {
                enabled: false,
                customRule: (context) => context.userPlan === 'premium'
            });

            expect(featureFlags.isEnabled('premium-only', {
                userId: 'user1',
                userPlan: 'free'
            })).toBe(false);

            expect(featureFlags.isEnabled('premium-only', {
                userId: 'user1',
                userPlan: 'premium'
            })).toBe(true);
        });

        test('should evaluate complex custom rules', () => {
            featureFlags.set('enterprise-beta', {
                enabled: false,
                customRule: (context) => {
                    return context.userPlan === 'enterprise' &&
                        context.accountAge > 365 &&
                        context.companySize > 100;
                }
            });

            expect(featureFlags.isEnabled('enterprise-beta', {
                userId: 'user1',
                userPlan: 'enterprise',
                accountAge: 400,
                companySize: 150
            })).toBe(true);

            expect(featureFlags.isEnabled('enterprise-beta', {
                userId: 'user2',
                userPlan: 'enterprise',
                accountAge: 200, // Too new
                companySize: 150
            })).toBe(false);
        });
    });

    describe('A/B Testing Variants', () => {
        test('should assign users to A/B test variants', () => {
            featureFlags.set('button-color-test', {
                enabled: false,
                variants: {
                    control: 50,
                    variant_a: 25,
                    variant_b: 25
                }
            });

            const userIds = Array.from({ length: 1000 }, (_, i) => `user${i}`);
            const variantCounts = { control: 0, variant_a: 0, variant_b: 0 };

            userIds.forEach(userId => {
                const variant = featureFlags.getVariant('button-color-test', { userId });
                if (variant) variantCounts[variant]++;
            });

            // Each variant should be within reasonable range
            expect(variantCounts.control).toBeGreaterThan(450);
            expect(variantCounts.control).toBeLessThan(550);
            expect(variantCounts.variant_a).toBeGreaterThan(200);
            expect(variantCounts.variant_a).toBeLessThan(300);
            expect(variantCounts.variant_b).toBeGreaterThan(200);
            expect(variantCounts.variant_b).toBeLessThan(300);
        });

        test('should consistently assign same variant to same user', () => {
            featureFlags.set('pricing-test', {
                enabled: false,
                variants: {
                    price_10: 50,
                    price_15: 50
                }
            });

            const variant1 = featureFlags.getVariant('pricing-test', { userId: 'user123' });
            const variant2 = featureFlags.getVariant('pricing-test', { userId: 'user123' });
            const variant3 = featureFlags.getVariant('pricing-test', { userId: 'user123' });

            expect(variant1).toBe(variant2);
            expect(variant2).toBe(variant3);
        });
    });

    describe('Kill Switch', () => {
        test('should immediately disable feature with kill switch', () => {
            featureFlags.set('problematic-feature', {
                enabled: true,
                whitelist: ['user1', 'user2'],
                rolloutPercentage: 100
            });

            // Feature is initially enabled for everyone
            expect(featureFlags.isEnabled('problematic-feature', { userId: 'user1' })).toBe(true);
            expect(featureFlags.isEnabled('problematic-feature', { userId: 'user999' })).toBe(true);

            // Activate kill switch
            featureFlags.set('problematic-feature', { killSwitch: true });

            // Now disabled for everyone, ignoring all other rules
            expect(featureFlags.isEnabled('problematic-feature', { userId: 'user1' })).toBe(false);
            expect(featureFlags.isEnabled('problematic-feature', { userId: 'user999' })).toBe(false);
        });

        test('should override all other settings with kill switch', () => {
            featureFlags.set('critical-feature', {
                enabled: true,
                whitelist: ['admin'],
                environments: ['production'],
                rolloutPercentage: 100,
                killSwitch: true
            });

            expect(featureFlags.isEnabled('critical-feature', {
                userId: 'admin',
                environment: 'production'
            })).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing userId gracefully', () => {
            featureFlags.set('require-user', {
                enabled: true,
                whitelist: ['user1']
            });

            // Should return false or default when userId is missing
            expect(featureFlags.isEnabled('require-user', {})).toBe(false);
            expect(featureFlags.isEnabled('require-user', { userId: null })).toBe(false);
            expect(featureFlags.isEnabled('require-user', { userId: undefined })).toBe(false);
        });

        test('should handle extremely long user IDs', () => {
            const longUserId = 'user' + 'x'.repeat(10000);

            featureFlags.set('test-feature', {
                enabled: false,
                rolloutPercentage: 50
            });

            const result = featureFlags.isEnabled('test-feature', { userId: longUserId });
            expect(typeof result).toBe('boolean');
        });

        test('should handle special characters in feature names', () => {
            featureFlags.set('feature:with-special_chars.and/slashes', {
                enabled: true
            });

            expect(featureFlags.isEnabled('feature:with-special_chars.and/slashes', {
                userId: 'user1'
            })).toBe(true);
        });

        test('should handle empty whitelist array', () => {
            featureFlags.set('empty-whitelist', {
                enabled: false,
                whitelist: []
            });

            expect(featureFlags.isEnabled('empty-whitelist', { userId: 'user1' })).toBe(false);
        });

        test('should handle null/undefined values in configuration', () => {
            featureFlags.set('null-config', {
                enabled: true,
                whitelist: null,
                blacklist: undefined,
                rolloutPercentage: null
            });

            // Should still work with null/undefined optional fields
            expect(featureFlags.isEnabled('null-config', { userId: 'user1' })).toBe(true);
        });
    });

    describe('Performance', () => {
        test('should evaluate feature flags quickly for high volume', () => {
            featureFlags.set('perf-test', {
                enabled: false,
                rolloutPercentage: 50,
                whitelist: ['vip1', 'vip2'],
                blacklist: ['banned1']
            });

            const startTime = Date.now();

            // Evaluate 10,000 times
            for (let i = 0; i < 10000; i++) {
                featureFlags.isEnabled('perf-test', { userId: `user${i}` });
            }

            const duration = Date.now() - startTime;

            // Should complete 10,000 evaluations in under 1 second (0.1ms per check)
            expect(duration).toBeLessThan(1000);
        });

        test('should cache feature flag lookups', () => {
            featureFlags.set('cached-feature', { enabled: true });

            const startTime = Date.now();

            // Evaluate same feature 1,000 times
            for (let i = 0; i < 1000; i++) {
                featureFlags.isEnabled('cached-feature', { userId: 'user1' });
            }

            const duration = Date.now() - startTime;

            // Cached lookups should be very fast (<100ms for 1,000)
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Integration', () => {
        test('should work with real-world scenario: gradual feature rollout', () => {
            // Day 1: Enable for internal team only
            featureFlags.set('new-shipment-view', {
                enabled: false,
                whitelist: ['internal-user-1', 'internal-user-2']
            });

            expect(featureFlags.isEnabled('new-shipment-view', { userId: 'internal-user-1' })).toBe(true);
            expect(featureFlags.isEnabled('new-shipment-view', { userId: 'regular-user' })).toBe(false);

            // Day 3: Expand to 10% of users
            featureFlags.set('new-shipment-view', {
                enabled: false,
                whitelist: ['internal-user-1', 'internal-user-2'],
                rolloutPercentage: 10
            });

            const users = Array.from({ length: 100 }, (_, i) => `user${i}`);
            const enabledCount = users.filter(userId =>
                featureFlags.isEnabled('new-shipment-view', { userId })
            ).length;
            expect(enabledCount).toBeGreaterThan(5);

            // Day 7: Full rollout
            featureFlags.set('new-shipment-view', { enabled: true });
            expect(featureFlags.isEnabled('new-shipment-view', { userId: 'any-user' })).toBe(true);
        });

        test('should work with emergency rollback scenario', () => {
            // Feature is fully rolled out
            featureFlags.set('payment-processing-v2', { enabled: true });
            expect(featureFlags.isEnabled('payment-processing-v2', { userId: 'user1' })).toBe(true);

            // Critical bug discovered - activate kill switch
            featureFlags.set('payment-processing-v2', { killSwitch: true });
            expect(featureFlags.isEnabled('payment-processing-v2', { userId: 'user1' })).toBe(false);

            // Fix deployed - remove kill switch, do gradual rollout
            featureFlags.set('payment-processing-v2', {
                killSwitch: false,
                enabled: false,
                rolloutPercentage: 20
            });

            const users = Array.from({ length: 100 }, (_, i) => `user${i}`);
            const enabledCount = users.filter(userId =>
                featureFlags.isEnabled('payment-processing-v2', { userId })
            ).length;
            expect(enabledCount).toBeGreaterThan(10);
            expect(enabledCount).toBeLessThan(30);
        });
    });
});

module.exports = { FeatureFlags };
