// Database seeding script
// Run with: pnpm prisma:seed

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Test User",
      role: "user",
    },
  });

  console.log("✅ Created users:", { user1, user2 });

  // Create test drivers
  const driver1 = await prisma.driver.upsert({
    where: { email: "driver1@example.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "driver1@example.com",
      phone: "+1234567890",
      status: "available",
    },
  });

  const driver2 = await prisma.driver.upsert({
    where: { email: "driver2@example.com" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "driver2@example.com",
      phone: "+0987654321",
      status: "unavailable",
    },
  });

  console.log("✅ Created drivers:", { driver1, driver2 });

  // Create test shipment
  const shipment = await prisma.shipment.create({
    data: {
      reference: "SHP-2025-001",
      trackingId: "TRACK-001",
      origin: "New York, NY",
      destination: "Los Angeles, CA",
      status: "created",
      driverId: driver1.id,
    },
  });

  console.log("✅ Created shipment:", shipment);

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
