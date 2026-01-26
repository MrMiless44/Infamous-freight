import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function scoreRisk(userId: string, score: number, factors: unknown) {
  try {
    return await prisma.riskScore.create({
      data: { userId, score, factors },
    });
  } catch (error) {
    // Ensure database errors are logged and can be handled by upstream callers
    console.error("Failed to create risk score", {
      userId,
      score,
      error,
    });
    throw error;
  }
}
