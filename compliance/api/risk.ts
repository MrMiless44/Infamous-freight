import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function scoreRisk(userId: string, score: number, factors: unknown) {
  return prisma.riskScore.create({
    data: { userId, score, factors },
  });
}
