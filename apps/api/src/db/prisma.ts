import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharedPrismaModule = require("./prisma.js");

export const prisma =
  sharedPrismaModule.prisma ??
  (typeof sharedPrismaModule.getPrisma === "function"
    ? sharedPrismaModule.getPrisma()
    : undefined);

export async function closePrisma(): Promise<void> {
  if (typeof sharedPrismaModule.closePrisma === "function") {
    await sharedPrismaModule.closePrisma();
    return;
  }

  if (prisma && typeof prisma.$disconnect === "function") {
    await prisma.$disconnect();
  }
}
