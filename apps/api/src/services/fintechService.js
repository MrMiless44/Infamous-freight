/**
 * Fintech Integration Service
 * Handles early payment, invoice financing, fuel card partnerships
 * Supports factor rates (2-5%) and payment scheduling
 */

const { logger } = require("../middleware/logger");
const prisma = require("../lib/prisma");

class FintechService {
    constructor() {
        this.factorRates = {
            standard: { rate: 0.035, daysToFund: 1 },    // 3.5%
            expedited: { rate: 0.045, daysToFund: 0 },   // 4.5%
            scheduled: { rate: 0.025, daysToFund: 14 },  // 2.5%
        };

        this.partnerFuelCards = [
            { name: "Pilot Flying J", discount: 0.05 },
            { name: "Love's", discount: 0.04 },
            { name: "TA/Petro", discount: 0.05 },
        ];
    }

    /**
     * Get early payment options (factor rates)
     */
    async getEarlyPaymentOptions(driverId, invoiceAmount) {
        try {
            const driver = await this.getDriverProfile(driverId);

            if (!driver) {
                throw new Error("Driver not found");
            }

            // Adjust rates based on driver rating
            const ratingMultiplier = Math.min(1.0, driver.rating / 5.0);

            const options = {
                standard: {
                    type: "standard",
                    rate: this.factorRates.standard.rate * ratingMultiplier,
                    fee: invoiceAmount * (this.factorRates.standard.rate * ratingMultiplier),
                    netAmount: invoiceAmount - (invoiceAmount * (this.factorRates.standard.rate * ratingMultiplier)),
                    daysToFund: this.factorRates.standard.daysToFund,
                    apr: ((this.factorRates.standard.rate * ratingMultiplier) * (365 / 90)).toFixed(1),
                },
                expedited: {
                    type: "expedited",
                    rate: this.factorRates.expedited.rate * ratingMultiplier,
                    fee: invoiceAmount * (this.factorRates.expedited.rate * ratingMultiplier),
                    netAmount: invoiceAmount - (invoiceAmount * (this.factorRates.expedited.rate * ratingMultiplier)),
                    daysToFund: this.factorRates.expedited.daysToFund,
                    apr: ((this.factorRates.expedited.rate * ratingMultiplier) * (365 / 1)).toFixed(1),
                },
                scheduled: {
                    type: "scheduled",
                    rate: this.factorRates.scheduled.rate * ratingMultiplier,
                    fee: invoiceAmount * (this.factorRates.scheduled.rate * ratingMultiplier),
                    netAmount: invoiceAmount - (invoiceAmount * (this.factorRates.scheduled.rate * ratingMultiplier)),
                    daysToFund: this.factorRates.scheduled.daysToFund,
                    apr: ((this.factorRates.scheduled.rate * ratingMultiplier) * (365 / 365)).toFixed(1),
                },
            };

            logger.info("Early payment options generated", {
                driverId,
                invoiceAmount,
                standardRate: options.standard.rate.toFixed(3),
            });

            return options;
        } catch (err) {
            logger.error("Early payment options failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Request early payment for invoice
     */
    async requestEarlyPayment(driverId, invoiceId, optionType = "standard") {
        try {
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
            });

            if (!invoice) {
                throw new Error("Invoice not found");
            }

            // Get payment options
            const options = await this.getEarlyPaymentOptions(driverId, invoice.amount);
            const selectedOption = options[optionType];

            if (!selectedOption) {
                throw new Error("Invalid payment option");
            }

            // Create early payment request
            const request = await prisma.earlyPaymentRequest.create({
                data: {
                    driverId,
                    invoiceId,
                    originalAmount: invoice.amount,
                    factorRate: selectedOption.rate,
                    fee: Math.round(selectedOption.fee * 100) / 100,
                    netAmount: Math.round(selectedOption.netAmount * 100) / 100,
                    optionType,
                    status: "pending",
                    fundingDate: new Date(Date.now() + selectedOption.daysToFund * 24 * 60 * 60 * 1000),
                },
            });

            logger.info("Early payment requested", {
                driverId,
                invoiceId,
                netAmount: request.netAmount,
                optionType,
            });

            return {
                requestId: request.id,
                status: request.status,
                originalAmount: request.originalAmount,
                fee: request.fee,
                netAmount: request.netAmount,
                fundingDate: request.fundingDate,
                estimatedDaysToFund: selectedOption.daysToFund,
            };
        } catch (err) {
            logger.error("Early payment request failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Approve early payment (admin)
     */
    async approveEarlyPayment(requestId) {
        try {
            const request = await prisma.earlyPaymentRequest.findUnique({
                where: { id: requestId },
            });

            if (!request) {
                throw new Error("Request not found");
            }

            // Update status
            const updated = await prisma.earlyPaymentRequest.update({
                where: { id: requestId },
                data: { status: "approved" },
            });

            logger.info("Early payment approved", {
                requestId,
                netAmount: request.netAmount,
            });

            // Trigger funding (would integrate with actual bank API)
            await this.processFunding(updated);

            return { success: true, status: "approved" };
        } catch (err) {
            logger.error("Approval failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Process actual payment transfer
     */
    async processFunding(paymentRequest) {
        try {
            // Mock: Would integrate with Stripe/ACH/PayPal
            // For now, just log and status update

            const funded = await prisma.earlyPaymentRequest.update({
                where: { id: paymentRequest.id },
                data: { status: "funded", fundedAt: new Date() },
            });

            logger.info("Payment funded", {
                requestId: paymentRequest.id,
                amount: paymentRequest.netAmount,
            });

            return funded;
        } catch (err) {
            logger.error("Funding failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Get fuel card partnerships for driver
     */
    async getFuelCardOptions(driverId) {
        try {
            const driver = await this.getDriverProfile(driverId);

            const options = this.partnerFuelCards.map(card => ({
                name: card.name,
                discount: card.discount,
                discountPercentage: (card.discount * 100).toFixed(1),
                description: `Save ${(card.discount * 100).toFixed(1)}% on fuel`,
                benefits: [
                    "Roadside assistance",
                    "Rewards points",
                    "24/7 customer support",
                ],
            }));

            logger.info("Fuel card options fetched", { driverId, count: options.length });

            return options;
        } catch (err) {
            logger.error("Fuel cards fetch failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Enroll in fuel card program
     */
    async enrollFuelCard(driverId, cardProvider) {
        try {
            const provider = this.partnerFuelCards.find(
                c => c.name.toLowerCase() === cardProvider.toLowerCase()
            );

            if (!provider) {
                throw new Error("Provider not found");
            }

            // Create enrollment
            const enrollment = await prisma.fuelCardEnrollment.create({
                data: {
                    driverId,
                    provider: provider.name,
                    status: "pending",
                    discount: provider.discount,
                },
            });

            logger.info("Fuel card enrollment requested", {
                driverId,
                provider: provider.name,
            });

            return {
                enrollmentId: enrollment.id,
                provider: provider.name,
                status: "pending_approval",
                discount: provider.discount,
            };
        } catch (err) {
            logger.error("Fuel card enrollment failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Get invoice financing options
     */
    async getInvoiceFinancingOptions(driverId, totalInvoiceAmount) {
        try {
            // Offer different terms
            const financingOptions = {
                biweekly: {
                    term: "14 days",
                    payments: 2,
                    apr: 0.18, // 18% APR
                    weeklyPayment: (totalInvoiceAmount / 2).toFixed(2),
                },
                monthly: {
                    term: "30 days",
                    payments: 1,
                    apr: 0.12, // 12% APR
                    payment: totalInvoiceAmount.toFixed(2),
                },
                extended: {
                    term: "90 days",
                    payments: 3,
                    apr: 0.24, // 24% APR
                    paymentAmount: (totalInvoiceAmount / 3).toFixed(2),
                },
            };

            return financingOptions;
        } catch (err) {
            logger.error("Invoice financing options failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Request invoice financing
     */
    async requestInvoiceFinancing(driverId, invoices, term = "biweekly") {
        try {
            const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

            const options = await this.getInvoiceFinancingOptions(driverId, totalAmount);
            const selected = options[term];

            if (!selected) {
                throw new Error("Invalid term");
            }

            // Create financing request
            const request = await prisma.invoiceFinancingRequest.create({
                data: {
                    driverId,
                    invoiceIds: JSON.stringify(invoices.map(i => i.id)),
                    totalAmount,
                    term,
                    apr: selected.apr,
                    numberOfPayments: selected.payments,
                    status: "pending",
                },
            });

            logger.info("Invoice financing requested", {
                driverId,
                invoiceCount: invoices.length,
                totalAmount,
                term,
            });

            return {
                requestId: request.id,
                totalAmount,
                term,
                numberOfPayments: selected.payments,
                apr: selected.apr,
                status: "pending_approval",
            };
        } catch (err) {
            logger.error("Invoice financing request failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Get insurance bundle offerings
     */
    async getInsuranceOptions(driverId) {
        try {
            const driver = await this.getDriverProfile(driverId);

            const insuranceOptions = {
                liability: {
                    name: "General Liability",
                    coverage: "$1M",
                    monthlyPremium: 45,
                    provider: "Progressive",
                },
                cargo: {
                    name: "Cargo Insurance",
                    coverage: "Full value",
                    monthlyPremium: 75,
                    provider: "Sentry Insurance",
                },
                physical: {
                    name: "Physical Damage",
                    coverage: "Truck + trailer",
                    monthlyPremium: 120,
                    provider: "Progressive",
                },
                comprehensive: {
                    name: "Comprehensive Bundle",
                    coverage: "All included",
                    monthlyPremium: 220,
                    savings: 40,
                    provider: "Progressive + Partners",
                },
            };

            logger.info("Insurance options fetched", { driverId });

            return insuranceOptions;
        } catch (err) {
            logger.error("Insurance options failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Enroll in insurance
     */
    async enrollInsurance(driverId, insuranceType) {
        try {
            const enrollment = await prisma.insuranceEnrollment.create({
                data: {
                    driverId,
                    type: insuranceType,
                    status: "pending",
                    startDate: new Date(),
                },
            });

            logger.info("Insurance enrollment created", {
                driverId,
                type: insuranceType,
            });

            return {
                enrollmentId: enrollment.id,
                type: insuranceType,
                status: "pending",
            };
        } catch (err) {
            logger.error("Insurance enrollment failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Get fintech dashboard summary
     */
    async getFintechDashboard(driverId) {
        try {
            const [earlyPayments, fuelCards, financing, insurance] = await Promise.all([
                prisma.earlyPaymentRequest.findMany({
                    where: { driverId },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                }),
                prisma.fuelCardEnrollment.findMany({
                    where: { driverId },
                }),
                prisma.invoiceFinancingRequest.findMany({
                    where: { driverId, status: "active" },
                }),
                prisma.insuranceEnrollment.findMany({
                    where: { driverId },
                }),
            ]);

            const totalSavings = (fuelCards.reduce((s, f) => s + (f.discount * 1000), 0) + // Mock calculation
                earlyPayments.reduce((s, p) => s + p.fee, 0)).toFixed(2);

            return {
                earlyPayments: {
                    count: earlyPayments.length,
                    recent: earlyPayments.slice(0, 3),
                },
                fuelCards: {
                    count: fuelCards.length,
                    active: fuelCards.filter(f => f.status === "active").length,
                },
                financing: {
                    active: financing.length,
                    totalAmount: financing.reduce((s, f) => s + f.totalAmount, 0),
                },
                insurance: {
                    enrolled: insurance.length,
                    types: insurance.map(i => i.type),
                },
                estimatedTotalSavings: totalSavings,
            };
        } catch (err) {
            logger.error("Fintech dashboard failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Mock driver profile fetch
     */
    async getDriverProfile(driverId) {
        return {
            id: driverId,
            name: "John Driver",
            rating: 4.8,
            verified: true,
        };
    }
}

module.exports = new FintechService();
