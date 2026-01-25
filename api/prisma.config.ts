import { defineConfig, env } from "prisma/config";
const { defineConfig } = require("prisma/config");

const schemaPath = process.env.PRISMA_SCHEMA_PATH || "prisma/schema.prisma";

module.exports = defineConfig({
  schema: schemaPath,
});
