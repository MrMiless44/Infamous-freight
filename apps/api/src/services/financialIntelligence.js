/**
 * Financial Intelligence Service
 * Automated invoice audits, P&L tracking, profitability analysis
 */

const { logger } = require('../middleware/logger');
const prisma = require('../db/prisma');

class FinancialIntelligenceService {
    constructor() {
        // Standard rate categories for freight
        this.standardRates = {
            'full_truckload': { min: 1.50, max: 3.50, avg: 2.25 }, // per mile
            'less_than_truckload': { min: 0.80, max: 2.00, avg: 1.30 },
            'expedited': { min: 3.00, max: 6.00, avg: 4.25 },
            'hazmat': { min: 2.50, max: 5.00, avg: 3.50 }
        };

        // Standard cost factors
        this.costFactors = {
            fuel: { perMile: 0.70, perGallon: 4.50 },
            driver: { perMile: 0.45, hourly: 28.00 },
            maintenance: { perMile: 0.15 },
            insurance: { perMile: 0.12 },
            tolls: { perMile: 0.08 },
            overhead: { dailyFixed: 150.00 }
        };
    }

    /**
     * Audit invoice for overcharges and discrepancies
     */
    async auditInvoice(invoiceData) {
        try {
            logger.info('Starting invoice audit', { invoiceId: invoiceData.id });

            const audit = {
                invoiceId: invoiceData.id,
                timestamp: new Date(),
                findings: [],
                totalOvercharge: 0,
                potentialSavings: 0,
                confidence: 0.95
            };

            // 1. Verify rate per mile
            const rateAudit = await this.auditRatePerMile(invoiceData);
            if (rateAudit.issue) {
                audit.findings.push(rateAudit);
                audit.totalOvercharge += rateAudit.amount;
            }

            // 2. Check fuel surcharges
            const fuelAudit = await this.auditFuelSurcharge(invoiceData);
            if (fuelAudit.issue) {
                audit.findings.push(fuelAudit);
                audit.totalOvercharge += fuelAudit.amount;
            }

            // 3. Verify accessorial charges
            const accessorialAudit = await this.auditAccessorialCharges(invoiceData);
            if (accessorialAudit.issues.length > 0) {
                audit.findings.push(...accessorialAudit.issues);
                audit.totalOvercharge += accessorialAudit.totalOvercharge;
            }

            // 4. Check for duplicate charges
            const duplicateAudit = await this.checkDuplicateCharges(invoiceData);
            if (duplicateAudit.found) {
                audit.findings.push(duplicateAudit);
                audit.totalOvercharge += duplicateAudit.amount;
            }

            // 5. Verify detention/layover charges
            const detentionAudit = await this.auditDetentionCharges(invoiceData);
            if (detentionAudit.issue) {
                audit.findings.push(detentionAudit);
                audit.totalOvercharge += detentionAudit.amount;
            }

            audit.potentialSavings = audit.totalOvercharge;
            audit.status = audit.findings.length === 0 ? 'CLEAN' : 'ISSUES_FOUND';

            logger.info('Invoice audit complete', {
                invoiceId: invoiceData.id,
                findings: audit.findings.length,
                overcharge: audit.totalOvercharge
            });

            return audit;
        } catch (error) {
            logger.error({ error }, 'Invoice audit error');
            throw error;
        }
    }

    /**
     * Calculate real-time P&L for a shipment
     */
    async calculateShipmentPL(shipmentId) {
        try {
            // Fetch shipment data
            const shipment = await prisma.shipment.findUnique({
                where: { id: shipmentId },
                include: {
                    route: true,
                    driver: true,
                    organization: true
                }
            });

            if (!shipment) {
                throw new Error('Shipment not found');
            }

            const pl = {
                shipmentId,
                timestamp: new Date(),
                revenue: {},
                costs: {},
                profit: {},
                margins: {},
                metrics: {}
            };

            // Calculate revenue
            pl.revenue = {
                baseRate: shipment.rate || 0,
                fuelSurcharge: shipment.fuelSurcharge || 0,
                accessorialCharges: shipment.accessorialCharges || 0,
                total: (shipment.rate || 0) + (shipment.fuelSurcharge || 0) + (shipment.accessorialCharges || 0)
            };

            // Calculate costs
            const distance = shipment.distance || 0;
            pl.costs = {
                fuel: distance * this.costFactors.fuel.perMile,
                driver: distance * this.costFactors.driver.perMile,
                maintenance: distance * this.costFactors.maintenance.perMile,
                insurance: distance * this.costFactors.insurance.perMile,
                tolls: distance * this.costFactors.tolls.perMile,
                overhead: this.costFactors.overhead.dailyFixed,
                total: 0
            };

            pl.costs.total = Object.entries(pl.costs)
                .filter(([key]) => key !== 'total')
                .reduce((sum, [, value]) => sum + value, 0);

            // Calculate profit
            pl.profit = {
                gross: pl.revenue.total - pl.costs.total,
                net: pl.revenue.total - pl.costs.total, // Simplified
                margin: ((pl.revenue.total - pl.costs.total) / pl.revenue.total) * 100
            };

            // Calculate key metrics
            pl.metrics = {
                profitPerMile: distance > 0 ? pl.profit.gross / distance : 0,
                revenuePerMile: distance > 0 ? pl.revenue.total / distance : 0,
                costPerMile: distance > 0 ? pl.costs.total / distance : 0,
                roi: pl.costs.total > 0 ? (pl.profit.gross / pl.costs.total) * 100 : 0,
                breakEvenMiles: pl.metrics?.revenuePerMile > pl.metrics?.costPerMile
                    ? pl.costs.total / (pl.metrics.revenuePerMile - pl.metrics.costPerMile)
                    : 0
            };

            logger.info('P&L calculated', {
                shipmentId,
                profit: pl.profit.gross,
                margin: pl.profit.margin
            });

            return pl;
        } catch (error) {
            logger.error({ error }, 'P&L calculation error');
            throw error;
        }
    }

    /**
     * Calculate profit per mile for load scoring
     */
    async calculateProfitPerMile(loadData) {
        const { fare, distance, estimatedTime, loadType } = loadData;

        // Estimate costs
        const fuelCost = distance * this.costFactors.fuel.perMile;
        const driverCost = distance * this.costFactors.driver.perMile;
        const maintenanceCost = distance * this.costFactors.maintenance.perMile;
        const insuranceCost = distance * this.costFactors.insurance.perMile;
        const tollsCost = distance * this.costFactors.tolls.perMile;

        const totalCost = fuelCost + driverCost + maintenanceCost + insuranceCost + tollsCost;
        const profit = revenue - totalCost;
        const profitPerMile = distance > 0 ? profit / distance : 0;

        return {
            revenue,
            totalCost,
            profit,
            profitPerMile,
            margin: revenue > 0 ? (profit / revenue) * 100 : 0,
            breakdownCosts: {
                fuel: fuelCost,
                driver: driverCost,
                maintenance: maintenanceCost,
                insurance: insuranceCost,
                tolls: tollsCost
            }
        };
    }

    /**
     * Generate financial forecast
     */
    async generateForecast(organizationId, periodDays = 30) {
        try {
            // Fetch historical data
            const historicalShipments = await prisma.shipment.findMany({
                where: {
                    organizationId,
                    createdAt: {
                        gte: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
                    }
                }
            });

            // Calculate averages
            const totalRevenue = historicalShipments.reduce((sum, s) => sum + (s.rate || 0), 0);
            const avgRevenuePerDay = totalRevenue / periodDays;
            const avgShipmentsPerDay = historicalShipments.length / periodDays;

            // Forecast next period
            const forecast = {
                period: `${periodDays} days`,
                projectedRevenue: avgRevenuePerDay * periodDays,
                projectedShipments: Math.round(avgShipmentsPerDay * periodDays),
                avgRevenuePerShipment: avgRevenuePerDay / avgShipmentsPerDay,
                confidence: 0.75,
                trend: this.calculateTrend(historicalShipments)
            };

            return forecast;
        } catch (error) {
            logger.error({ error }, 'Forecast generation error');
            throw error;
        }
    }

    // ========== Private Helper Methods ==========

    async auditRatePerMile(invoiceData) {
        const { distance, rate, loadType = 'full_truckload' } = invoiceData;
        const ratePerMile = distance > 0 ? rate / distance : 0;
        const standard = this.standardRates[loadType] || this.standardRates.full_truckload;

        if (ratePerMile > standard.max) {
            return {
                type: 'RATE_OVERCHARGE',
                issue: true,
                severity: 'HIGH',
                message: `Rate per mile ($${ratePerMile.toFixed(2)}) exceeds standard maximum ($${standard.max})`,
                amount: (ratePerMile - standard.max) * distance,
                recommendation: `Negotiate rate down to $${standard.avg}/mile`
            };
        }

        return { issue: false };
    }

    async auditFuelSurcharge(invoiceData) {
        const { distance, fuelSurcharge } = invoiceData;
        const expectedFuelCost = distance * this.costFactors.fuel.perMile;
        const acceptableRange = expectedFuelCost * 1.15; // 15% markup is acceptable

        if (fuelSurcharge > acceptableRange) {
            return {
                type: 'FUEL_OVERCHARGE',
                issue: true,
                severity: 'MEDIUM',
                message: `Fuel surcharge ($${fuelSurcharge}) exceeds acceptable range ($${acceptableRange.toFixed(2)})`,
                amount: fuelSurcharge - acceptableRange,
                recommendation: 'Request fuel surcharge breakdown'
            };
        }

        return { issue: false };
    }

    async auditAccessorialCharges(invoiceData) {
        const { accessorialCharges = [] } = invoiceData;
        const issues = [];
        let totalOvercharge = 0;

        // Check for unreasonable accessorial charges
        for (const charge of accessorialCharges) {
            if (charge.amount > 500 && !charge.description) {
                issues.push({
                    type: 'UNDOCUMENTED_CHARGE',
                    severity: 'HIGH',
                    message: `Large accessorial charge ($${charge.amount}) without description`,
                    amount: charge.amount * 0.3, // Estimate 30% overcharge
                    recommendation: 'Request detailed justification'
                });
                totalOvercharge += charge.amount * 0.3;
            }
        }

        return { issues, totalOvercharge };
    }

    async checkDuplicateCharges(invoiceData) {
        const { lineItems = [] } = invoiceData;
        const seen = new Set();
        let duplicateAmount = 0;

        for (const item of lineItems) {
            const key = `${item.description}-${item.amount}`;
            if (seen.has(key)) {
                duplicateAmount += item.amount;
            }
            seen.add(key);
        }

        if (duplicateAmount > 0) {
            return {
                type: 'DUPLICATE_CHARGES',
                found: true,
                severity: 'HIGH',
                message: `Found duplicate charges totaling $${duplicateAmount}`,
                amount: duplicateAmount,
                recommendation: 'Request credit for duplicate charges'
            };
        }

        return { found: false };
    }

    async auditDetentionCharges(invoiceData) {
        const { detentionHours, detentionCharge } = invoiceData;
        const standardRate = 50; // $50/hour standard detention rate

        if (detentionHours && detentionCharge) {
            const expectedCharge = detentionHours * standardRate;
            if (detentionCharge > expectedCharge * 1.2) {
                return {
                    type: 'DETENTION_OVERCHARGE',
                    issue: true,
                    severity: 'MEDIUM',
                    message: `Detention charge ($${detentionCharge}) exceeds standard ($${expectedCharge})`,
                    amount: detentionCharge - expectedCharge,
                    recommendation: `Standard detention rate is $${standardRate}/hour`
                };
            }
        }

        return { issue: false };
    }

    calculateTrend(shipments) {
        if (shipments.length < 7) return 'STABLE';

        // Simple trend analysis: compare first half to second half
        const midpoint = Math.floor(shipments.length / 2);
        const firstHalf = shipments.slice(0, midpoint);
        const secondHalf = shipments.slice(midpoint);

        const firstAvg = firstHalf.reduce((sum, s) => sum + (s.rate || 0), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + (s.rate || 0), 0) / secondHalf.length;

        const change = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (change > 5) return 'GROWING';
        if (change < -5) return 'DECLINING';
        return 'STABLE';
    }
}

// Export singleton instance
module.exports = new FinancialIntelligenceService();
