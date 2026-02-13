const { JobEventType } = require("@prisma/client");
const { prisma } = require("../db/prisma");

async function logJobEvent(input) {
  if (!prisma) return null;
  return prisma.jobEvent.create({
    data: {
      jobId: input.jobId,
      type: input.type,
      actorUserId: input.actorUserId ?? null,
      message: input.message ?? null,
    },
  });
}

async function getJobTimeline(jobId) {
  if (!prisma) return [];
  return prisma.jobEvent.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });
}

async function getLatestJobEvent(jobId) {
  if (!prisma) return null;
  return prisma.jobEvent.findFirst({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  logJobEvent,
  getJobTimeline,
  getLatestJobEvent,
  JobEventType,
};
