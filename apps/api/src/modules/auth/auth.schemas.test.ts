import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schemas.js";

describe("auth schemas", () => {
  it("rejects register passwords shorter than 12 characters", () => {
    const result = registerSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "Short1!x",
    });

    expect(result.success).toBe(false);
  });

  it("accepts login payloads with 12 character passwords", () => {
    const result = loginSchema.safeParse({
      email: "ada@example.com",
      password: "Passw0rd!!12",
    });

    expect(result.success).toBe(true);
  });

  it("accepts login payloads with 11 character passwords", () => {
    const result = loginSchema.safeParse({
      email: "ada@example.com",
      password: "Passw0rd!!1",
    });

    expect(result.success).toBe(true);
  });
});
