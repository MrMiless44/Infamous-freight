const { predictProfit, toNumber, roundCurrency } = require('../profitPrediction');

describe('profitPrediction service', () => {
    it('predicts profit and margin for profitable shipment', () => {
        const result = predictProfit({
            revenue: 2500,
            variableCost: 1400,
            fixedCost: 300,
            confidenceScore: 0.92,
        });

        expect(result).toEqual({
            revenue: 2500,
            totalCost: 1700,
            grossProfit: 800,
            margin: 0.32,
            profitable: true,
            confidenceScore: 0.92,
        });
    });

    it('returns non-profitable signal when costs exceed revenue', () => {
        const result = predictProfit({
            revenue: 1200,
            variableCost: 1000,
            fixedCost: 350,
        });

        expect(result.grossProfit).toBe(-150);
        expect(result.margin).toBe(-0.13);
        expect(result.profitable).toBe(false);
        expect(result.confidenceScore).toBe(0.85);
    });

    it('normalizes invalid numeric values safely', () => {
        expect(toNumber('abc', 7)).toBe(7);
        expect(roundCurrency(1.005)).toBe(1.01);

        const result = predictProfit({
            revenue: '500',
            variableCost: null,
            fixedCost: undefined,
            confidenceScore: 2,
        });

        expect(result).toMatchObject({
            revenue: 500,
            totalCost: 0,
            confidenceScore: 1,
        });
    });
});
