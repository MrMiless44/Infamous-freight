import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: [
      // Redirect legacy CJS .js route files to their TypeScript counterparts
      {
        find: /^(.*\/routes\/shipments)\.js$/,
        replacement: "$1.ts",
      },
    ],
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/services/eta-risk.service.ts",
        "src/services/rate-prediction.service.ts",
        "src/services/carrier-intelligence.service.ts",
        "src/services/ai-command.service.ts",
        "src/services/orchestration.service.ts",
        "src/middleware/error-handler.ts",
        "src/middleware/request-id.ts",
        "src/app.ts",
      ],
      reporter: ["text", "lcov", "html", "json-summary"],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
