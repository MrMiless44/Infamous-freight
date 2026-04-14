import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,mts,cts}"],
    globals: false,
  },
});
