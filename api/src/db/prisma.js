const { PrismaClient } = require("@prisma/client");
const { env } = require("../config/env");

let prisma = null;

function getPrisma() {
  // Use fallback mode if no DATABASE_URL or PERSISTENCE_MODE is json
  if (env.persistenceMode === "json") return null;
  if (!env.databaseUrl) return null;

  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

async function closePrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  getPrisma,
  closePrisma,
  prisma: getPrisma(), // Legacy: return null or instance
};
