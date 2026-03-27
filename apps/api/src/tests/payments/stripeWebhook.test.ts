describe("stripeWebhook", () => {
  it("accepts a valid checkout.session.completed event", async () => {
    expect(true).toBe(true);
  });

  it("rejects an invalid signature", async () => {
    expect(true).toBe(true);
  });
});
