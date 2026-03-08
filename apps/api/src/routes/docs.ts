import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));

const specPath = join(__dirname, "../../openapi.yaml");
const spec = yaml.load(readFileSync(specPath, "utf8")) as object;

const router = Router();

router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(spec, { customSiteTitle: "Infamous Freight API Docs" }));

export default router;
