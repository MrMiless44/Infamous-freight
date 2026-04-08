import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const prisma = require("./prisma.cjs");

export default prisma;
