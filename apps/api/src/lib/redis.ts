import IORedis from "ioredis";
import { env } from "../config/env.js";

const RedisCtor: any = IORedis;

export const redis = new RedisCtor(env.REDIS_URL, {
  maxRetriesPerRequest: null
});
