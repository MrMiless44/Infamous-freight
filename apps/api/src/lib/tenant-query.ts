import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma.js";

export async function withOrganizationContext<T>(
  organizationId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await (tx as unknown as PrismaClient).$executeRawUnsafe(
      `SELECT set_config('app.current_organization_id', $1, true)`,
      organizationId,
    );

    return fn(tx);
  });
}
