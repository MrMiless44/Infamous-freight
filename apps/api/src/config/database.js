const { getPrisma } = require("../db/prisma");

const prisma =
	getPrisma() ||
	{
		$queryRaw: async () => {
			throw new Error("Database not configured");
		},
		$disconnect: async () => undefined,
	};

module.exports = { prisma };
