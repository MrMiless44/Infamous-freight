const { Worker } = require("bullmq");
const config = require("../config");
const { prisma, getPrisma } = require("../db/prisma");
const { buildCommandPlan, executePlan } = require("../services/aiFreightCommandEngine");

function getRedisConnectionOptions() {
  const host = config.REDIS_HOST || process.env.REDIS_HOST || "127.0.0.1";
  const port = Number(config.REDIS_PORT || process.env.REDIS_PORT || 6379);
  const password = config.REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined;
  return { host, port, password };
}

async function executeAiCommand({ aiCommandId }) {
  const client = getPrisma?.() || prisma;
  if (!client) throw new Error("Database not initialized");

  const cmd = await client.aiCommand.findUnique({
    where: { id: aiCommandId },
    include: { toolCalls: true },
  });
  if (!cmd) throw new Error("AiCommand not found");

  await client.aiCommand.update({
    where: { id: aiCommandId },
    data: { status: "EXECUTING" },
  });

  const proposed = buildCommandPlan(cmd.command);

  await client.aiCommand.update({ where: { id: aiCommandId }, data: { proposedPlan: proposed } });

  const executionResult = executePlan(proposed, {
    carrierMetrics: {
      onTimeRate: 96,
      tenderAcceptance: 91,
      safetyScore: 95,
      priceCompetitiveness: 88,
      serviceRating: 92,
    },
    pricingInput: {
      distanceMiles: 780,
      fuelPricePerGallon: 3.82,
      seasonalityIndex: 1.04,
      marketCapacityIndex: 0.94,
      carrierDemandIndex: 1.06,
      historicalSpotRatePerMile: 2.41,
    },
  });

  const tc = await client.aiCommandToolCall.create({
    data: {
      aiCommandId,
      name: proposed.tools[0].name,
      arguments: proposed.tools[0].arguments,
      status: "executed",
      result: executionResult,
    },
  });

  const result = {
    ok: true,
    message: executionResult.summary,
    outputs: executionResult.outputs,
    toolCallId: tc.id,
  };

  await client.aiCommand.update({
    where: { id: aiCommandId },
    data: {
      status: "SUCCEEDED",
      executedAt: new Date(),
      executedPlan: proposed,
      result,
    },
  });

  return result;
}

function startAiCommandWorker() {
  const worker = new Worker(
    "ai-commands",
    async (job) => {
      const { aiCommandId } = job.data || {};
      if (!aiCommandId) throw new Error("Missing aiCommandId");
      return executeAiCommand({ aiCommandId });
    },
    { connection: getRedisConnectionOptions() },
  );

  worker.on("failed", async (job, err) => {
    try {
      const client = getPrisma?.() || prisma;
      const aiCommandId = job?.data?.aiCommandId;
      if (client && aiCommandId) {
        await client.aiCommand.update({
          where: { id: aiCommandId },
          data: { status: "FAILED", error: err?.message || "unknown error" },
        });
      }
    } catch (_error) {
      // fail open
    }
  });

  return worker;
}

module.exports = { startAiCommandWorker };
