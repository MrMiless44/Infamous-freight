import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function enforce(userId: string, level: string, reason: string) {
  return prisma.enforcementAction.create({
    data: { userId, level, reason },
  });
}
