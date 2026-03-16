/**
 * Environment Variable Validation Template
 *
 * This file provides a template for validating required environment variables
 * at application startup using Zod for type-safe schema validation.
 *
 * Usage:
 * 1. Copy this file to validateEnv.ts
 * 2. Uncomment the code below
 * 3. Customize the schema for your application's needs
 * 4. Import and call validateEnv() at the top of your server.ts/index.ts
 *
 * Benefits:
 * - Fails fast on startup if required variables are missing
 * - Provides clear error messages about what's missing
 * - Type-safe access to environment variables throughout the app
 * - Documents required configuration in code
 */

/*
import { z } from 'zod';

// Define the schema for your environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Server configuration
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url({
    message: "DATABASE_URL must be a valid PostgreSQL connection string"
  }),

  // Redis (optional but recommended for production)
  REDIS_URL: z.string().url().optional(),

  // Authentication
  JWT_SECRET: z.string().min(32, {
    message: "JWT_SECRET must be at least 32 characters for security"
  }),
  JWT_EXPIRY: z.string().default('24h'),

  // Email service (at least one required)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),

  AWS_SES_ACCESS_KEY: z.string().optional(),
  AWS_SES_SECRET_KEY: z.string().optional(),
  AWS_SES_REGION: z.string().default('us-east-1'),
  AWS_SES_FROM_EMAIL: z.string().email().optional(),

  // External services
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Feature flags
  ENABLE_MARKETPLACE: z.string().default('false').transform(v => v === 'true'),
  ENABLE_AI_FEATURES: z.string().default('false').transform(v => v === 'true'),
})
.refine(
  // At least one email service must be configured
  data => data.SENDGRID_API_KEY || (data.AWS_SES_ACCESS_KEY && data.AWS_SES_SECRET_KEY),
  {
    message: "Either SendGrid (SENDGRID_API_KEY) or AWS SES (AWS_SES_ACCESS_KEY + AWS_SES_SECRET_KEY) must be configured",
    path: ['SENDGRID_API_KEY', 'AWS_SES_ACCESS_KEY']
  }
)
.refine(
  // In production, Redis should be configured
  data => data.NODE_ENV !== 'production' || data.REDIS_URL,
  {
    message: "REDIS_URL is required in production environment",
    path: ['REDIS_URL']
  }
);

// Export the validated and typed environment
export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  // Only validate once to avoid performance overhead
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    console.log('✅ Environment validation passed');
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Environment validation failed:\n');

      error.errors.forEach(err => {
        const path = err.path.join('.');
        console.error(`  • ${path}: ${err.message}`);
      });

      console.error('\nPlease check your .env file and ensure all required variables are set.\n');
    } else {
      console.error('❌ Unexpected error during environment validation:', error);
    }

    process.exit(1);
  }
}

// Usage in server.ts:
//
// import { validateEnv } from './config/validateEnv';
//
// // First thing on startup
// const env = validateEnv();
//
// // Now you can use env with type safety
// app.listen(env.PORT, () => {
//   console.log(`Server running on ${env.HOST}:${env.PORT}`);
// });
*/

export {}; // Make this a module
