/**
 * Profit Prediction Service
 * Estimates gross profit and margin based on shipment economics.
 */

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function roundCurrency(value) {
    const sign = value < 0 ? -1 : 1;
    const absValue = Math.abs(value);
    return sign * (Math.round((absValue + Number.EPSILON) * 100) / 100);
}

function predictProfit(input = {}) {
    const revenue = toNumber(input.revenue);
    const variableCost = toNumber(input.variableCost);
    const fixedCost = toNumber(input.fixedCost);
    const confidenceScore = Math.max(0, Math.min(1, toNumber(input.confidenceScore, 0.85)));

    const totalCost = variableCost + fixedCost;
    const grossProfit = revenue - totalCost;

    const roundedRevenue = roundCurrency(revenue);
    const roundedTotalCost = roundCurrency(totalCost);
    const roundedGrossProfit = roundCurrency(grossProfit);
    const margin = roundedRevenue > 0 ? roundedGrossProfit / roundedRevenue : 0;
    const roundedMargin = roundCurrency(margin);
    const roundedConfidenceScore = roundCurrency(confidenceScore);

    return {
        revenue: roundedRevenue,
        totalCost: roundedTotalCost,
        grossProfit: roundedGrossProfit,
        margin: roundedMargin,
        profitable: roundedGrossProfit >= 0,
        confidenceScore: roundedConfidenceScore,
    };
}

module.exports = {
    predictProfit,
    toNumber,
    roundCurrency,
};
