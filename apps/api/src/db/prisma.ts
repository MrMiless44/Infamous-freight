import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Prisma runtime requires an adapter with engineType=client, while generated
// typings expose a zero-arg constructor. Cast is used to bridge that mismatch.
export const prisma = new (PrismaClient as any)({ adapter });

export async function closePrisma(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}
