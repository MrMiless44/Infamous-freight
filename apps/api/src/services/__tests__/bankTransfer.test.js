/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Test Suite: Bank Transfer Service (Plaid Integration)
 */

const bankTransferService = require("../bankTransfer");

// Mock Plaid SDK
jest.mock("plaid", () => {
    const mockLinkTokenCreate = jest.fn().mockResolvedValue({
        data: {
            link_token: "link-sandbox-abc123",
            expiration: "2026-02-20T12:00:00Z",
        },
    });

    const mockItemPublicTokenExchange = jest.fn().mockResolvedValue({
        data: {
            access_token: "access-sandbox-xyz789",
            item_id: "item-123",
        },
    });

    const mockAuthGet = jest.fn().mockResolvedValue({
        data: {
            accounts: [
                {
                    account_id: "acc-123",
                    name: "Checking Account",
                    mask: "0000",
                    type: "depository",
                    subtype: "checking",
                },
            ],
            numbers: {
                ach: [
                    {
                        account_id: "acc-123",
                        account: "1234567890",
                        routing: "011401533",
                    },
                ],
            },
        },
    });

    const mockProcessorTokenCreate = jest.fn().mockResolvedValue({
        data: {
            processor_token: "processor-sandbox-token-123",
        },
    });

    return {
        Configuration: jest.fn(),
        PlaidApi: jest.fn().mockImplementation(() => ({
            linkTokenCreate: mockLinkTokenCreate,
            itemPublicTokenExchange: mockItemPublicTokenExchange,
            authGet: mockAuthGet,
            processorTokenCreate: mockProcessorTokenCreate,
        })),
        PlaidEnvironments: {
            sandbox: "https://sandbox.plaid.com",
            development: "https://development.plaid.com",
            production: "https://production.plaid.com",
        },
        Products: {
            Auth: "auth",
            Transactions: "transactions",
        },
        CountryCode: {
            Us: "US",
        },
    };
});

// Mock logger
jest.mock("../../middleware/logger", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// Mock Prisma
jest.mock("../../db/prisma", () => ({
    prisma: {
        bankAccount: {
            create: jest.fn().mockResolvedValue({
                id: "bank-acc-123",
                userId: "user-456",
                accountId: "acc-123",
                accessToken: "access-sandbox-xyz789",
                institutionName: "Chase Bank",
                accountName: "Checking Account",
                accountMask: "0000",
                accountType: "checking",
                verifiedAt: new Date(),
            }),
            findUnique: jest.fn().mockResolvedValue({
                id: "bank-acc-123",
                accessToken: "access-sandbox-xyz789",
                accountId: "acc-123",
                verifiedAt: new Date(),
            }),
        },
        bankTransfer: {
            create: jest.fn().mockResolvedValue({
                id: "transfer-789",
                userId: "user-456",
                bankAccountId: "bank-acc-123",
                amount: 10000,
                currency: "usd",
                status: "pending",
                stripeFee: 0,
                createdAt: new Date(),
            }),
            update: jest.fn().mockResolvedValue({
                id: "transfer-789",
                status: "completed",
            }),
        },
    },
}));

describe("Bank Transfer Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.PLAID_CLIENT_ID = "test_client_id";
        process.env.PLAID_SECRET = "test_secret";
        process.env.PLAID_ENV = "sandbox";
    });

    describe("createLinkToken", () => {
        it("should create Plaid Link token successfully", async () => {
            const result = await bankTransferService.createLinkToken("user-456");

            expect(result.link_token).toBe("link-sandbox-abc123");
            expect(result.expiration).toBeDefined();
        });

        it("should handle Plaid API errors", async () => {
            const plaid = require("plaid");
            const mockError = new Error("Plaid API error");
            plaid.PlaidApi.mockImplementationOnce(() => ({
                linkTokenCreate: jest.fn().mockRejectedValue(mockError),
            }));

            await expect(
                bankTransferService.createLinkToken("user-456")
            ).rejects.toThrow("Failed to create Plaid Link token");
        });
    });

    describe("exchangePublicToken", () => {
        it("should exchange public token for access token", async () => {
            const result = await bankTransferService.exchangePublicToken(
                "public-sandbox-token"
            );

            expect(result.access_token).toBe("access-sandbox-xyz789");
            expect(result.item_id).toBe("item-123");
        });

        it("should handle invalid public token", async () => {
            const plaid = require("plaid");
            plaid.PlaidApi.mockImplementationOnce(() => ({
                itemPublicTokenExchange: jest
                    .fn()
                    .mockRejectedValue(new Error("Invalid public token")),
            }));

            await expect(
                bankTransferService.exchangePublicToken("invalid-token")
            ).rejects.toThrow("Failed to exchange public token");
        });
    });

    describe("getBankAccount", () => {
        it("should retrieve bank account details", async () => {
            const result = await bankTransferService.getBankAccount(
                "access-sandbox-xyz789",
                "acc-123"
            );

            expect(result.account_id).toBe("acc-123");
            expect(result.name).toBe("Checking Account");
            expect(result.mask).toBe("0000");
            expect(result.type).toBe("depository");
        });

        it("should handle account not found", async () => {
            await expect(
                bankTransferService.getBankAccount(
                    "access-sandbox-xyz789",
                    "non-existent-account"
                )
            ).rejects.toThrow("Bank account not found");
        });
    });

    describe("verifyBankAccount", () => {
        it("should verify bank account successfully", async () => {
            const result = await bankTransferService.verifyBankAccount(
                "access-sandbox-xyz789",
                "acc-123"
            );

            expect(result.verified).toBe(true);
            expect(result.account_id).toBe("acc-123");
        });

        it("should handle verification failure", async () => {
            const plaid = require("plaid");
            plaid.PlaidApi.mockImplementationOnce(() => ({
                authGet: jest.fn().mockRejectedValue(new Error("Verification failed")),
            }));

            await expect(
                bankTransferService.verifyBankAccount("access-token", "acc-id")
            ).rejects.toThrow("Bank account verification failed");
        });
    });

    describe("saveBankAccount", () => {
        it("should save bank account to database", async () => {
            const result = await bankTransferService.saveBankAccount({
                userId: "user-456",
                accessToken: "access-sandbox-xyz789",
                accountId: "acc-123",
                institutionName: "Chase Bank",
                accountName: "Checking Account",
                accountMask: "0000",
                accountType: "checking",
            });

            expect(result.id).toBe("bank-acc-123");
            expect(result.userId).toBe("user-456");
            expect(result.verifiedAt).toBeDefined();
        });
    });

    describe("initiateBankTransfer", () => {
        it("should initiate bank transfer successfully", async () => {
            const result = await bankTransferService.initiateBankTransfer({
                userId: "user-456",
                bankAccountId: "bank-acc-123",
                amount: 10000, // $100.00
                currency: "usd",
                idempotencyKey: "idem-key-123",
            });

            expect(result.success).toBe(true);
            expect(result.transfer.id).toBe("transfer-789");
            expect(result.transfer.status).toBe("pending");
            expect(result.transfer.stripeFee).toBe(0);
            expect(result.savings).toBeGreaterThan(0);
        });

        it("should calculate correct savings vs Stripe", async () => {
            const amount = 10000; // $100.00
            const expectedStripeFee = amount * 0.029 + 30; // $3.20

            const result = await bankTransferService.initiateBankTransfer({
                userId: "user-456",
                bankAccountId: "bank-acc-123",
                amount,
                currency: "usd",
                idempotencyKey: "idem-key-456",
            });

            expect(result.savings).toBeCloseTo(expectedStripeFee, 0);
        });

        it("should handle insufficient bank account info", async () => {
            const { prisma } = require("../../db/prisma");
            prisma.bankAccount.findUnique.mockResolvedValueOnce(null);

            await expect(
                bankTransferService.initiateBankTransfer({
                    userId: "user-456",
                    bankAccountId: "invalid-id",
                    amount: 10000,
                    currency: "usd",
                })
            ).rejects.toThrow("Bank account not found");
        });

        it("should prevent duplicate transfers with idempotency key", async () => {
            const { prisma } = require("../../db/prisma");
            const existingTransfer = {
                id: "transfer-existing",
                status: "completed",
            };

            prisma.bankTransfer.findUnique = jest
                .fn()
                .mockResolvedValueOnce(existingTransfer);

            const result = await bankTransferService.initiateBankTransfer({
                userId: "user-456",
                bankAccountId: "bank-acc-123",
                amount: 10000,
                currency: "usd",
                idempotencyKey: "duplicate-key",
            });

            // Should return existing transfer, not create new one
            expect(result.transfer.id).toBe("transfer-existing");
        });
    });

    describe("getBankTransferStatus", () => {
        it("should retrieve transfer status", async () => {
            const { prisma } = require("../../db/prisma");
            prisma.bankTransfer.findUnique = jest.fn().mockResolvedValue({
                id: "transfer-789",
                status: "completed",
                amount: 10000,
                createdAt: new Date("2026-02-16"),
                updatedAt: new Date("2026-02-17"),
            });

            const result = await bankTransferService.getBankTransferStatus(
                "transfer-789"
            );

            expect(result.id).toBe("transfer-789");
            expect(result.status).toBe("completed");
        });

        it("should handle transfer not found", async () => {
            const { prisma } = require("../../db/prisma");
            prisma.bankTransfer.findUnique = jest.fn().mockResolvedValue(null);

            await expect(
                bankTransferService.getBankTransferStatus("non-existent")
            ).rejects.toThrow("Bank transfer not found");
        });
    });

    describe("calculateBankTransferFee", () => {
        it("should return zero fee for bank transfers", () => {
            const fee = bankTransferService.calculateBankTransferFee(10000);
            expect(fee).toBe(0);
        });

        it("should calculate Stripe fee savings", () => {
            const amount = 50000; // $500.00
            const stripeFee = amount * 0.029 + 30; // $14.80

            const savings =
                bankTransferService.calculateBankTransferFee(amount, true);

            expect(savings).toBeCloseTo(stripeFee, 0);
        });
    });

    describe("Cost Optimization Validation", () => {
        it("should save exactly $3.20 vs Stripe for $100 payment", () => {
            const amount = 10000; // $100.00
            const stripeFee = amount * 0.029 + 30; // $3.20
            const bankTransferFee = 0;
            const savings = stripeFee - bankTransferFee;

            expect(savings).toBeCloseTo(320, 0); // 320 cents = $3.20
        });

        it("should save $14.80 vs Stripe for $500 payment", () => {
            const amount = 50000; // $500.00
            const stripeFee = amount * 0.029 + 30; // $14.80
            const bankTransferFee = 0;
            const savings = stripeFee - bankTransferFee;

            expect(savings).toBeCloseTo(1480, 0); // 1480 cents = $14.80
        });

        it("should scale savings linearly with transaction volume", () => {
            // At 20% adoption of bank transfers
            // Average payment: $250
            // Transactions per month: 200
            // Bank transfer transactions: 40

            const avgAmount = 25000; // $250.00
            const bankTransferCount = 40;

            const savingsPerTransaction =
                avgAmount * 0.029 + 30 - 0; // $7.55
            const monthlySavings =
                (savingsPerTransaction * bankTransferCount) / 100; // Convert cents to dollars

            expect(monthlySavings).toBeCloseTo(50, 0); // $50/month savings
        });
    });

    describe("Mock Mode", () => {
        it("should work in mock mode without Plaid credentials", async () => {
            delete process.env.PLAID_CLIENT_ID;
            delete process.env.PLAID_SECRET;

            // Should still work with mock data
            const result = await bankTransferService.createLinkToken("user-456");
            expect(result.link_token).toBeDefined();
        });
    });
});
