-- CreateTable "loadboard_loads"
CREATE TABLE "loadboard_loads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupZip" TEXT,
    "pickupDate" TIMESTAMP(3),
    "dropoffCity" TEXT NOT NULL,
    "dropoffState" TEXT NOT NULL,
    "dropoffZip" TEXT,
    "dropoffDate" TIMESTAMP(3),
    "miles" INTEGER,
    "weight" INTEGER,
    "length" INTEGER,
    "commodity" TEXT,
    "rate" DECIMAL(10, 2),
    "rateType" TEXT DEFAULT 'per_mile',
    "equipmentType" TEXT,
    "loads" INTEGER DEFAULT 1,
    "hazmat" BOOLEAN DEFAULT false,
    "temperature" TEXT,
    "shipperName" TEXT,
    "shipperPhone" TEXT,
    "shipperEmail" TEXT,
    "score" INTEGER,
    "postedTime" TIMESTAMP(3),
    "refreshedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loadboard_loads_source_externalId_key" UNIQUE("source", "externalId")
);

-- CreateTable "loadboard_user_preferences"
CREATE TABLE "loadboard_user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "preferredSources" TEXT NOT NULL DEFAULT 'all',
    "minRate" DECIMAL(10, 2) DEFAULT 1.0,
    "maxMiles" INTEGER DEFAULT 500,
    "acceptedEquipmentTypes" TEXT,
    "excludeHazmat" BOOLEAN DEFAULT false,
    "autoAcceptHighScore" BOOLEAN DEFAULT false,
    "highScoreThreshold" INTEGER DEFAULT 85,
    "geofenceRadius" DECIMAL(10, 2),
    "geoLat" DECIMAL(10, 6),
    "geoLng" DECIMAL(10, 6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loadboard_user_preferences_userId_key" UNIQUE("userId")
);

-- CreateTable "loadboard_user_bids"
CREATE TABLE "loadboard_user_bids" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalLoadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'placed',
    "bidAmount" DECIMAL(10, 2),
    "comments" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "externalBidId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loadboard_user_bids_userId_loadId_key" UNIQUE("userId", "loadId")
);

-- CreateTable "analytics_daily_metrics"
CREATE TABLE "analytics_daily_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "loadsViewed" INTEGER DEFAULT 0,
    "bidsSent" INTEGER DEFAULT 0,
    "bidsAccepted" INTEGER DEFAULT 0,
    "bidsRejected" INTEGER DEFAULT 0,
    "revenue" DECIMAL(12, 2) DEFAULT 0,
    "totalMiles" INTEGER DEFAULT 0,
    "avgRate" DECIMAL(10, 2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_daily_metrics_userId_date_key" UNIQUE("userId", "date")
);

-- CreateTable "analytics_revenue_history"
CREATE TABLE "analytics_revenue_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalRevenue" DECIMAL(12, 2) DEFAULT 0,
    "totalLoads" INTEGER DEFAULT 0,
    "avgLoadValue" DECIMAL(10, 2) DEFAULT 0,
    "avgMiles" DECIMAL(10, 2) DEFAULT 0,
    "topLoadBoard" TEXT,
    "trend" DECIMAL(5, 2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_revenue_history_userId_month_key" UNIQUE("userId", "month")
);

-- CreateTable "shipper_loads"
CREATE TABLE "shipper_loads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupZip" TEXT,
    "pickupDate" DATETIME NOT NULL,
    "dropoffCity" TEXT NOT NULL,
    "dropoffState" TEXT NOT NULL,
    "dropoffZip" TEXT,
    "dropoffDate" DATETIME NOT NULL,
    "weight" INTEGER NOT NULL,
    "length" INTEGER DEFAULT 53,
    "commodity" TEXT,
    "equipmentType" TEXT NOT NULL DEFAULT 'dry van',
    "temperature" TEXT,
    "rate" DECIMAL(10, 2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "postedAt" TIMESTAMP(3),
    "assignedDriverId" TEXT,
    "completedAt" TIMESTAMP(3),
    "specialInstructions" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable "webhook_subscriptions"
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "webhook_subscriptions_userId_event_key" UNIQUE("userId", "event")
);

-- CreateTable "webhook_events"
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3)
);

-- CreateIndexes
CREATE INDEX "loadboard_loads_source_idx" ON "loadboard_loads"("source");
CREATE INDEX "loadboard_loads_pickupCity_dropoffCity_idx" ON "loadboard_loads"("pickupCity", "dropoffCity");
CREATE INDEX "loadboard_loads_score_idx" ON "loadboard_loads"("score");
CREATE INDEX "loadboard_loads_postedTime_idx" ON "loadboard_loads"("postedTime");
CREATE INDEX "loadboard_user_bids_userId_idx" ON "loadboard_user_bids"("userId");
CREATE INDEX "loadboard_user_bids_status_idx" ON "loadboard_user_bids"("status");
CREATE INDEX "analytics_daily_metrics_userId_date_idx" ON "analytics_daily_metrics"("userId", "date");
CREATE INDEX "analytics_revenue_history_userId_month_idx" ON "analytics_revenue_history"("userId", "month");
CREATE INDEX "shipper_loads_organizationId_idx" ON "shipper_loads"("organizationId");
CREATE INDEX "shipper_loads_status_idx" ON "shipper_loads"("status");
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");
CREATE INDEX "webhook_events_userId_idx" ON "webhook_events"("userId");
