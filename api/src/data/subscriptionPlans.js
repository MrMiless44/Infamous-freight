/**
 * Subscription Plans Configuration
 * Define all available pricing tiers
 */

const SUBSCRIPTION_PLANS = {
    FREE: {
        id: 'plan_free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: null,
        description: 'Perfect for getting started',
        features: {
            shipments: 5,
            users: 1,
            storage: '1GB',
            support: 'community',
            api: false,
            analytics: false,
        },
    },
    STARTER: {
        id: 'price_starter_monthly',
        name: 'Starter',
        price: 29,
        currency: 'USD',
        interval: 'month',
        description: 'For small teams',
        features: {
            shipments: 100,
            users: 3,
            storage: '50GB',
            support: 'email',
            api: true,
            apiRequests: '10k/month',
            analytics: false,
        },
    },
    PROFESSIONAL: {
        id: 'price_professional_monthly',
        name: 'Professional',
        price: 99,
        currency: 'USD',
        interval: 'month',
        description: 'For growing businesses',
        features: {
            shipments: 1000,
            users: 10,
            storage: '500GB',
            support: 'priority-email',
            api: true,
            apiRequests: '100k/month',
            analytics: true,
            webhooks: true,
        },
    },
    ENTERPRISE: {
        id: 'price_enterprise_monthly',
        name: 'Enterprise',
        price: 499,
        currency: 'USD',
        interval: 'month',
        description: 'For large organizations',
        features: {
            shipments: 'unlimited',
            users: 'unlimited',
            storage: '10TB',
            support: '24/7-phone',
            api: true,
            apiRequests: '1M/month',
            analytics: true,
            webhooks: true,
            sso: true,
            sla: '99.9%',
            dedicated: true,
        },
    },
};

module.exports = SUBSCRIPTION_PLANS;
