const crypto = require("crypto");

const {
  markDeliveryProcessed,
  shouldAssignCopilot,
  verifyGithubSignature,
} = require("../src/services/githubCopilotOrchestrator");

describe("githubCopilotOrchestrator", () => {
  afterEach(() => {
    delete process.env.GITHUB_AUTOPILOT_REPO_ALLOWLIST;
  });

  it("verifies GitHub HMAC signatures using the raw body", () => {
    const body = Buffer.from(JSON.stringify({ action: "opened" }));
    const secret = "top-secret";
    const digest = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;

    expect(verifyGithubSignature(body, digest, secret)).toBe(true);
    expect(verifyGithubSignature(body, "sha256=bad", secret)).toBe(false);
  });

  it("triggers on copilot-task issue labels", () => {
    const shouldRun = shouldAssignCopilot({
      event: "issues",
      action: "labeled",
      payload: {
        repository: { name: "infamous-freight", full_name: "acme/infamous-freight" },
        issue: { labels: [{ name: "bug" }, { name: "copilot-task" }] },
      },
    });

    expect(shouldRun).toBe(true);
  });

  it("triggers on /copilot run comment commands", () => {
    const shouldRun = shouldAssignCopilot({
      event: "issue_comment",
      action: "created",
      payload: {
        repository: { name: "infamous-freight", full_name: "acme/infamous-freight" },
        comment: { body: " /copilot run" },
      },
    });

    expect(shouldRun).toBe(true);
  });

  it("respects repository allowlist", () => {
    process.env.GITHUB_AUTOPILOT_REPO_ALLOWLIST = "acme/allowed-repo";

    const shouldRun = shouldAssignCopilot({
      event: "issues",
      action: "opened",
      payload: {
        repository: { name: "infamous-freight", full_name: "acme/infamous-freight" },
        issue: { labels: [{ name: "copilot-task" }] },
      },
    });

    expect(shouldRun).toBe(false);
  });

  it("deduplicates deliveries by GitHub delivery id", () => {
    const id = "delivery-123";
    expect(markDeliveryProcessed(id)).toBe(false);
    expect(markDeliveryProcessed(id)).toBe(true);
  });
});
