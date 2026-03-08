import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  JWT_PUBLIC_KEY: z.string().min(1)
});

export const env = envSchema.parse(process.env);
