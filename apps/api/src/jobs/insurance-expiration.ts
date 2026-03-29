import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger.js";

const { runExpirationSweep } = require("../modules/insurance/service");

const prisma = new PrismaClient();

export async function runInsuranceExpirationSweep() {
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
  });

  const results = [] as Array<{ orgId: string; name: string; summary: any }>;

  for (const org of organizations) {
    try {
      const summary = await runExpirationSweep({ orgId: org.id });
      results.push({ orgId: org.id, name: org.name, summary });
    } catch (error) {
      logger.error(
        { err: error, orgName: org.name },
        "[InsuranceExpiration] Failed for organization",
      );
    }
  }

  return results;
}

if (require.main === module) {
  runInsuranceExpirationSweep()
    .then((results) => {
      logger.info({ results }, "[InsuranceExpiration] Completed sweep");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ err: error }, "[InsuranceExpiration] Fatal error");
      process.exit(1);
    });
}
