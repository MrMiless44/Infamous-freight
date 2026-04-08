import prismaClientPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { env } from "../config/env.js";

const { PrismaClient } = prismaClientPkg as any;

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export async function closePrisma(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}
