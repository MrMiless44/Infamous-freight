import "dotenv/config";

import { z } from "zod";

const requiredString = (name: string) =>
  z
    .string()
    .min(1, `${name} is required`)
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, `${name} is required`);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  API_PORT: z.string().default("3000"),

  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),
  PERSISTENCE_MODE: z.enum(["auto", "json"]).default("auto"),

  JWT_SECRET: requiredString("JWT_SECRET"),
  JWT_EXPIRY: z.string().default("7d"),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),

  AVATAR_STORAGE: z.enum(["local", "s3"]).default("local"),
  AVATAR_UPLOAD_DIR: z.string().default("apps/api/public/uploads"),
  AVATAR_MAX_FILE_SIZE_MB: z.string().default("5"),
  AVATAR_MAX_DIMENSIONS: z.string().default("2048x2048"),
  AVATAR_ALLOWED_TYPES: z.string().default("image/jpeg,image/png,image/webp"),
  AVATAR_DATA_STORE: z.string().default("apps/api/data/avatars.json"),
  RATE_LIMIT_AVATAR_WINDOW_MS: z.string().default("15"),
  RATE_LIMIT_AVATAR_MAX: z.string().default("20"),

  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),

  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  AI_PROVIDER: z.enum(["stub", "openai", "anthropic"]).default("stub"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-latest"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().optional(),
  STRIPE_CANCEL_URL: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  port: parseInt(parsedEnv.PORT, 10),
  apiPort: parseInt(parsedEnv.API_PORT, 10),

  databaseUrl: parsedEnv.DATABASE_URL,
  redisUrl: parsedEnv.REDIS_URL,
  persistenceMode: parsedEnv.PERSISTENCE_MODE,

  jwtSecret: parsedEnv.JWT_SECRET,
  jwtExpiry: parsedEnv.JWT_EXPIRY,
  jwtPublicKey: parsedEnv.JWT_PUBLIC_KEY,
  jwtPrivateKey: parsedEnv.JWT_PRIVATE_KEY,

  sentryDsn: parsedEnv.SENTRY_DSN,
  webhookSecret: parsedEnv.WEBHOOK_SECRET,

  avatarStorage: parsedEnv.AVATAR_STORAGE,
  avatarUploadDir: parsedEnv.AVATAR_UPLOAD_DIR,
  avatarMaxFileSizeMB: parseInt(parsedEnv.AVATAR_MAX_FILE_SIZE_MB, 10),
  avatarMaxDimensions: parsedEnv.AVATAR_MAX_DIMENSIONS,
  avatarAllowedTypes: parsedEnv.AVATAR_ALLOWED_TYPES.split(","),
  avatarDataStore: parsedEnv.AVATAR_DATA_STORE,
  rateLimitAvatarWindowMs: parseInt(parsedEnv.RATE_LIMIT_AVATAR_WINDOW_MS, 10) * 60 * 1000,
  rateLimitAvatarMax: parseInt(parsedEnv.RATE_LIMIT_AVATAR_MAX, 10),

  s3Bucket: parsedEnv.S3_BUCKET,
  s3Region: parsedEnv.S3_REGION,
  s3Endpoint: parsedEnv.S3_ENDPOINT,
  s3AccessKeyId: parsedEnv.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: parsedEnv.S3_SECRET_ACCESS_KEY,
  s3PublicBaseUrl: parsedEnv.S3_PUBLIC_BASE_URL,

  corsOrigins: parsedEnv.CORS_ORIGINS.split(","),
  logLevel: parsedEnv.LOG_LEVEL,

  aiProvider: parsedEnv.AI_PROVIDER,
  openaiApiKey: parsedEnv.OPENAI_API_KEY,
  openaiModel: parsedEnv.OPENAI_MODEL,
  anthropicApiKey: parsedEnv.ANTHROPIC_API_KEY,
  anthropicModel: parsedEnv.ANTHROPIC_MODEL,

  STRIPE_SECRET_KEY: parsedEnv.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: parsedEnv.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_STARTER: parsedEnv.STRIPE_PRICE_STARTER,
  STRIPE_PRICE_PRO: parsedEnv.STRIPE_PRICE_PRO,
  STRIPE_PRICE_ENTERPRISE: parsedEnv.STRIPE_PRICE_ENTERPRISE,
  STRIPE_SUCCESS_URL: parsedEnv.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: parsedEnv.STRIPE_CANCEL_URL,
};

export default env;
