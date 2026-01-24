-- CreateTable
CREATE TABLE "copilot_progress" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "performancePeriodId" TEXT,
    "overallProgressScore" DECIMAL(5,2) NOT NULL,
    "goalsCompleted" INTEGER NOT NULL DEFAULT 0,
    "goalsTotal" INTEGER NOT NULL DEFAULT 0,
    "improvementRate" DECIMAL(5,2) NOT NULL,
    "consistencyScore" DECIMAL(5,2) NOT NULL,
    "activeRecommendations" INTEGER NOT NULL DEFAULT 0,
    "completedRecommendations" INTEGER NOT NULL DEFAULT 0,
    "progressDetails" TEXT,
    "milestones" TEXT,
    "engagementScore" DECIMAL(5,2) NOT NULL,
    "lastInteraction" TIMESTAMP(3),
    "confidenceLevel" DECIMAL(5,2) NOT NULL,
    "effectivenessScore" DECIMAL(5,2) NOT NULL,
    "coachingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copilot_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "copilot_progress_driverId_idx" ON "copilot_progress"("driverId");

-- CreateIndex
CREATE INDEX "copilot_progress_overallProgressScore_idx" ON "copilot_progress"("overallProgressScore");

-- CreateIndex
CREATE INDEX "copilot_progress_updatedAt_idx" ON "copilot_progress"("updatedAt");

-- AddForeignKey
ALTER TABLE "copilot_progress" ADD CONSTRAINT "copilot_progress_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_progress" ADD CONSTRAINT "copilot_progress_performancePeriodId_fkey" FOREIGN KEY ("performancePeriodId") REFERENCES "driver_performance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
