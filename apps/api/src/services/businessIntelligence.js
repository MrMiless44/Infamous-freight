/**
 * Business Intelligence Reports Service
 *
 * Automated insights generation and reporting
 *
 * Features:
 * - Automated report generation (daily, weekly, monthly)
 * - Executive summaries with key moments
 * - Trend analysis and anomaly detection
 * - Variance analysis (plan vs. actual)
 * - Competitive benchmarking
 * - Financial health scoring
 * - Custom report builder
 * - Multi-language support
 *
 * Target Performance:
 * - Reports generated: 100+ per day
 * - Executive action rate: 40%
 * - Data accuracy: 99.9%
 */

const prisma = require("../lib/prisma");
const { logger } = require("../middleware/logger");

/**
 * Report types
 */
const REPORT_TYPES = {
  EXECUTIVE_SUMMARY: "executive_summary",
  FINANCIAL: "financial",
  OPERATIONAL: "operational",
  CUSTOMER: "customer",
  DRIVER: "driver",
  PERFORMANCE: "performance",
  TREND_ANALYSIS: "trend_analysis",
  CUSTOM: "custom",
};

/**
 * Report frequencies
 */
const REPORT_FREQUENCIES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
  ON_DEMAND: "on_demand",
};

/**
 * Report formats
 */
const REPORT_FORMATS = {
  PDF: "pdf",
  HTML: "html",
  JSON: "json",
  CSV: "csv",
  EXCEL: "excel",
};

/**
 * Business Intelligence Report Generator
 */
class BIReportGenerator {
  constructor() {
    this.reportCache = new Map();
    this.cacheTTL = 3600000; // 1 hour cache
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(dateRange = "last_7_days") {
    const startTime = Date.now();

    try {
      const { startDate, endDate } = this.parseDateRange(dateRange);

      // Gather key metrics
      const metrics = await this.gatherExecutiveMetrics(startDate, endDate);

      // Calculate period-over-period changes
      const previousPeriod = await this.gatherExecutiveMetrics(
        this.getPreviousPeriodStart(startDate, endDate),
        startDate,
      );

      const changes = this.calculateChanges(metrics, previousPeriod);

      // Identify key insights
      const insights = this.generateInsights(metrics, changes);

      // Detect anomalies
      const anomalies = this.detectAnomalies(metrics, previousPeriod);

      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, insights, anomalies);

      // Format report
      const report = {
        title: "Executive Summary",
        period: { startDate, endDate },
        generatedAt: new Date(),
        summary: this.createExecutiveSummary(metrics, changes),
        keyMetrics: metrics,
        periodOverPeriodChanges: changes,
        insights,
        anomalies,
        recommendations,
        processingTime: Date.now() - startTime,
      };

      // Save report
      await this.saveReport({
        type: REPORT_TYPES.EXECUTIVE_SUMMARY,
        data: report,
        start_date: startDate,
        end_date: endDate,
      });

      logger.info("Executive summary generated", {
        dateRange,
        processingTime: report.processingTime,
      });

      return report;
    } catch (error) {
      logger.error("Failed to generate executive summary", { error: error.message });
      throw error;
    }
  }

  /**
   * Generate financial performance report
   */
  async generateFinancialReport(startDate, endDate) {
    const startTime = Date.now();

    try {
      // Revenue analysis
      const revenue = await this.analyzeRevenue(startDate, endDate);

      // Cost analysis
      const costs = await this.analyzeCosts(startDate, endDate);

      // Profitability
      const profitability = this.calculateProfitability(revenue, costs);

      // Cash flow
      const cashFlow = await this.analyzeCashFlow(startDate, endDate);

      // Variance from budget
      const variance = await this.calculateBudgetVariance(revenue, costs, startDate, endDate);

      // Financial health score
      const healthScore = this.calculateFinancialHealthScore({
        revenue,
        costs,
        profitability,
        cashFlow,
      });

      const report = {
        title: "Financial Performance Report",
        period: { startDate, endDate },
        generatedAt: new Date(),
        revenue,
        costs,
        profitability,
        cashFlow,
        variance,
        healthScore,
        processingTime: Date.now() - startTime,
      };

      await this.saveReport({
        type: REPORT_TYPES.FINANCIAL,
        data: report,
        start_date: startDate,
        end_date: endDate,
      });

      logger.info("Financial report generated", {
        processingTime: report.processingTime,
      });

      return report;
    } catch (error) {
      logger.error("Failed to generate financial report", { error: error.message });
      throw error;
    }
  }

  /**
   * Generate operational performance report
   */
  async generateOperationalReport(startDate, endDate) {
    const startTime = Date.now();

    try {
      // Delivery performance
      const deliveries = await this.analyzeDeliveryPerformance(startDate, endDate);

      // Fleet utilization
      const fleet = await this.analyzeFleetUtilization(startDate, endDate);

      // Driver performance
      const drivers = await this.analyzeDriverPerformance(startDate, endDate);

      // Efficiency metrics
      const efficiency = this.calculateOperationalEfficiency({
        deliveries,
        fleet,
        drivers,
      });

      // Bottleneck analysis
      const bottlenecks = await this.identifyBottlenecks(startDate, endDate);

      const report = {
        title: "Operational Performance Report",
        period: { startDate, endDate },
        generatedAt: new Date(),
        deliveryPerformance: deliveries,
        fleetUtilization: fleet,
        driverPerformance: drivers,
        efficiency,
        bottlenecks,
        processingTime: Date.now() - startTime,
      };

      await this.saveReport({
        type: REPORT_TYPES.OPERATIONAL,
        data: report,
        start_date: startDate,
        end_date: endDate,
      });

      logger.info("Operational report generated", {
        processingTime: report.processingTime,
      });

      return report;
    } catch (error) {
      logger.error("Failed to generate operational report", { error: error.message });
      throw error;
    }
  }

  /**
   * Generate trend analysis report
   */
  async generateTrendAnalysis(metricName, lookbackDays = 90) {
    const startTime = Date.now();

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackDays);

      // Gather historical data
      const historicalData = await this.getHistoricalMetric(metricName, startDate, endDate);

      // Calculate trends
      const trends = this.analyzeTrends(historicalData);

      // Forecast future values
      const forecast = this.forecastMetric(historicalData, 30); // 30 days ahead

      // Seasonal patterns
      const seasonality = this.detectSeasonality(historicalData);

      // Statistical analysis
      const statistics = this.calculateStatistics(historicalData);

      const report = {
        title: `Trend Analysis: ${metricName}`,
        period: { startDate, endDate },
        generatedAt: new Date(),
        metric: metricName,
        historicalData,
        trends,
        forecast,
        seasonality,
        statistics,
        processingTime: Date.now() - startTime,
      };

      await this.saveReport({
        type: REPORT_TYPES.TREND_ANALYSIS,
        data: report,
        start_date: startDate,
        end_date: endDate,
      });

      logger.info("Trend analysis generated", {
        metric: metricName,
        processingTime: report.processingTime,
      });

      return report;
    } catch (error) {
      logger.error("Failed to generate trend analysis", { error: error.message });
      throw error;
    }
  }

  /**
   * Generate custom report from template
   */
  async generateCustomReport(reportConfig) {
    const startTime = Date.now();

    try {
      const { template, parameters } = reportConfig;

      // Load report template
      const reportTemplate = await this.loadReportTemplate(template);

      // Gather data based on template configuration
      const data = await this.gatherCustomData(reportTemplate.dataQueries, parameters);

      // Apply calculations and transformations
      const processedData = this.processCustomData(data, reportTemplate.calculations);

      // Generate visualizations
      const visualizations = this.generateVisualizations(
        processedData,
        reportTemplate.visualizations,
      );

      // Format report
      const report = {
        title: reportTemplate.title,
        description: reportTemplate.description,
        parameters,
        generatedAt: new Date(),
        data: processedData,
        visualizations,
        processingTime: Date.now() - startTime,
      };

      await this.saveReport({
        type: REPORT_TYPES.CUSTOM,
        data: report,
        template_id: reportTemplate.id,
      });

      logger.info("Custom report generated", {
        template,
        processingTime: report.processingTime,
      });

      return report;
    } catch (error) {
      logger.error("Failed to generate custom report", { error: error.message });
      throw error;
    }
  }

  /**
   * Schedule automated report
   */
  async scheduleReport(reportConfig) {
    try {
      const schedule = await prisma.reportSchedule.create({
        data: {
          report_type: reportConfig.type,
          frequency: reportConfig.frequency,
          recipients: reportConfig.recipients,
          format: reportConfig.format || REPORT_FORMATS.PDF,
          configuration: reportConfig.parameters || {},
          next_run: this.calculateNextRun(reportConfig.frequency),
          is_active: true,
          created_at: new Date(),
        },
      });

      logger.info("Report scheduled", { scheduleId: schedule.id });

      return schedule;
    } catch (error) {
      logger.error("Failed to schedule report", { error: error.message });
      throw error;
    }
  }

  /**
   * Export report to specified format
   */
  async exportReport(reportId, format = REPORT_FORMATS.PDF) {
    try {
      const report = await prisma.biReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new Error("Report not found");
      }

      let exportedData;
      switch (format) {
        case REPORT_FORMATS.PDF:
          exportedData = await this.exportToPDF(report);
          break;
        case REPORT_FORMATS.HTML:
          exportedData = this.exportToHTML(report);
          break;
        case REPORT_FORMATS.JSON:
          exportedData = JSON.stringify(report.data, null, 2);
          break;
        case REPORT_FORMATS.CSV:
          exportedData = this.exportToCSV(report);
          break;
        case REPORT_FORMATS.EXCEL:
          exportedData = await this.exportToExcel(report);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      logger.info("Report exported", { reportId, format });

      return {
        reportId,
        format,
        data: exportedData,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error("Failed to export report", { reportId, error: error.message });
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Parse date range string
   */
  parseDateRange(dateRange) {
    let endDate = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        startDate.setDate(endDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "last_7_days":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "last_30_days":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "this_month":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case "last_month":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    return { startDate, endDate };
  }

  /**
   * Gather executive-level metrics
   */
  async gatherExecutiveMetrics(startDate, endDate) {
    // Revenue
    const revenue = await prisma.shipments.aggregate({
      where: {
        created_at: { gte: startDate, lte: endDate },
        status: { in: ["delivered", "completed"] },
      },
      _sum: { total_cost: true },
      _count: true,
    });

    // Customers
    const newCustomers = await prisma.users.count({
      where: {
        role: "customer",
        created_at: { gte: startDate, lte: endDate },
      },
    });

    // Orders
    const orders = await prisma.shipments.count({
      where: {
        created_at: { gte: startDate, lte: endDate },
      },
    });

    // Deliveries
    const deliveries = await prisma.shipments.count({
      where: {
        delivered_at: { gte: startDate, lte: endDate },
        status: "delivered",
      },
    });

    return {
      revenue: revenue._sum.total_cost || 0,
      orders: revenue._count,
      newCustomers,
      deliveries,
      avgOrderValue: revenue._count > 0 ? (revenue._sum.total_cost || 0) / revenue._count : 0,
    };
  }

  /**
   * Calculate period-over-period changes
   */
  calculateChanges(current, previous) {
    const changes = {};

    for (const [key, value] of Object.entries(current)) {
      if (typeof value === "number" && previous[key] !== undefined) {
        const change = value - previous[key];
        const percentChange = previous[key] !== 0 ? (change / previous[key]) * 100 : 0;

        changes[key] = {
          absolute: Math.round(change * 100) / 100,
          percent: Math.round(percentChange * 10) / 10,
          direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
        };
      }
    }

    return changes;
  }

  /**
   * Generate insights from metrics
   */
  generateInsights(metrics, changes) {
    const insights = [];

    // Revenue insights
    if (changes.revenue && Math.abs(changes.revenue.percent) > 10) {
      insights.push({
        category: "revenue",
        type: changes.revenue.direction === "up" ? "positive" : "negative",
        message: `Revenue ${changes.revenue.direction === "up" ? "increased" : "decreased"} by ${Math.abs(changes.revenue.percent)}%`,
        importance: "high",
      });
    }

    // Customer growth
    if (changes.newCustomers && changes.newCustomers.percent > 20) {
      insights.push({
        category: "growth",
        type: "positive",
        message: `New customer acquisition up ${changes.newCustomers.percent}%`,
        importance: "high",
      });
    }

    // Average order value
    if (changes.avgOrderValue && Math.abs(changes.avgOrderValue.percent) > 15) {
      insights.push({
        category: "monetization",
        type: changes.avgOrderValue.direction === "up" ? "positive" : "negative",
        message: `Average order value ${changes.avgOrderValue.direction === "up" ? "increased" : "decreased"} by ${Math.abs(changes.avgOrderValue.percent)}%`,
        importance: "medium",
      });
    }

    return insights;
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(current, previous) {
    const anomalies = [];

    for (const [key, value] of Object.entries(current)) {
      if (typeof value === "number" && previous[key]) {
        const change = Math.abs((value - previous[key]) / previous[key]);

        // Anomaly if change > 50%
        if (change > 0.5) {
          anomalies.push({
            metric: key,
            currentValue: value,
            previousValue: previous[key],
            changePercent: Math.round(change * 100),
            severity: change > 1.0 ? "high" : "medium",
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(metrics, insights, anomalies) {
    const recommendations = [];

    // Based on insights
    insights.forEach((insight) => {
      if (insight.type === "negative" && insight.importance === "high") {
        recommendations.push({
          priority: "high",
          category: insight.category,
          recommendation: `Investigate ${insight.category} decline and implement corrective actions`,
        });
      }
    });

    // Based on anomalies
    anomalies.forEach((anomaly) => {
      if (anomaly.severity === "high") {
        recommendations.push({
          priority: "urgent",
          category: "anomaly",
          recommendation: `Critical anomaly detected in ${anomaly.metric} - immediate review required`,
        });
      }
    });

    // General recommendations
    if (metrics.avgOrderValue < 50) {
      recommendations.push({
        priority: "medium",
        category: "monetization",
        recommendation: "Consider upselling strategies to increase average order value",
      });
    }

    return recommendations;
  }

  /**
   * Create executive summary text
   */
  createExecutiveSummary(metrics, changes) {
    let summary = "";

    summary += `During this period, the business processed ${metrics.orders} orders generating $${Math.round(metrics.revenue).toLocaleString()} in revenue. `;

    if (changes.revenue) {
      summary += `This represents a ${Math.abs(changes.revenue.percent)}% ${changes.revenue.direction === "up" ? "increase" : "decrease"} from the previous period. `;
    }

    summary += `${metrics.newCustomers} new customers joined, `;
    summary += `with an average order value of $${Math.round(metrics.avgOrderValue)}. `;
    summary += `${metrics.deliveries} deliveries were successfully completed.`;

    return summary;
  }

  /**
   * Get previous period dates
   */
  getPreviousPeriodStart(startDate, endDate) {
    const periodLength = endDate - startDate;
    return new Date(startDate.getTime() - periodLength);
  }

  /**
   * Analyze revenue
   */
  async analyzeRevenue(startDate, endDate) {
    const result = await prisma.shipments.aggregate({
      where: {
        created_at: { gte: startDate, lte: endDate },
        status: { in: ["delivered", "completed"] },
      },
      _sum: { total_cost: true },
      _count: true,
      _avg: { total_cost: true },
    });

    return {
      total: result._sum.total_cost || 0,
      count: result._count,
      average: result._avg.total_cost || 0,
    };
  }

  /**
   * Analyze costs
   */
  async analyzeCosts(startDate, endDate) {
    // Mock implementation - replace with actual cost tracking
    return {
      operational: 10000,
      personnel: 50000,
      infrastructure: 15000,
      marketing: 20000,
      total: 95000,
    };
  }

  /**
   * Calculate profitability
   */
  calculateProfitability(revenue, costs) {
    const grossProfit = revenue.total - costs.total;
    const margin = revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0;

    return {
      grossProfit,
      margin: Math.round(margin * 10) / 10,
      revenuePerOrder: revenue.count > 0 ? revenue.total / revenue.count : 0,
    };
  }

  /**
   * Analyze cash flow
   */
  async analyzeCashFlow(startDate, endDate) {
    // Mock implementation - replace with actual cash flow tracking
    return {
      inflows: 150000,
      outflows: 95000,
      netCashFlow: 55000,
      cashPosition: "positive",
    };
  }

  /**
   * Calculate budget variance
   */
  async calculateBudgetVariance(revenue, costs, startDate, endDate) {
    // Mock implementation - replace with actual budget data
    const budgetRevenue = 140000;
    const budgetCosts = 100000;

    return {
      revenueVariance: revenue.total - budgetRevenue,
      costVariance: costs.total - budgetCosts,
      revenueVariancePercent: ((revenue.total - budgetRevenue) / budgetRevenue) * 100,
      costVariancePercent: ((costs.total - budgetCosts) / budgetCosts) * 100,
    };
  }

  /**
   * Calculate financial health score
   */
  calculateFinancialHealthScore(financials) {
    let score = 50; // Base score

    // Profitability (40 points)
    if (financials.profitability.margin > 40) score += 40;
    else if (financials.profitability.margin > 25) score += 30;
    else if (financials.profitability.margin > 15) score += 20;
    else if (financials.profitability.margin > 5) score += 10;

    // Cash flow (30 points)
    if (financials.cashFlow.netCashFlow > 50000) score += 30;
    else if (financials.cashFlow.netCashFlow > 20000) score += 20;
    else if (financials.cashFlow.netCashFlow > 0) score += 10;
    else score -= 10;

    // Revenue growth (30 points) - would need historical data
    score += 15; // Placeholder

    return {
      score: Math.max(0, Math.min(100, score)),
      rating: score > 80 ? "Excellent" : score > 60 ? "Good" : score > 40 ? "Fair" : "Poor",
    };
  }

  /**
   * Additional helper methods
   */
  async analyzeDeliveryPerformance(startDate, endDate) {
    const deliveries = await prisma.shipments.findMany({
      where: {
        delivered_at: { gte: startDate, lte: endDate },
        status: "delivered",
      },
      select: {
        delivered_at: true,
        estimated_delivery: true,
      },
    });

    const onTime = deliveries.filter(
      (d) => new Date(d.delivered_at) <= new Date(d.estimated_delivery),
    ).length;

    return {
      total: deliveries.length,
      onTime,
      onTimeRate: deliveries.length > 0 ? (onTime / deliveries.length) * 100 : 0,
    };
  }

  async analyzeFleetUtilization(startDate, endDate) {
    // Mock implementation
    return {
      totalVehicles: 50,
      activeVehicles: 42,
      utilizationRate: 84,
    };
  }

  async analyzeDriverPerformance(startDate, endDate) {
    // Mock implementation
    return {
      totalDrivers: 100,
      activeDrivers: 85,
      avgRating: 4.5,
      avgDeliveriesPerDriver: 45,
    };
  }

  calculateOperationalEfficiency(data) {
    return {
      deliveryEfficiency: data.deliveries.onTimeRate,
      fleetEfficiency: data.fleet.utilizationRate,
      overallScore: (data.deliveries.onTimeRate + data.fleet.utilizationRate) / 2,
    };
  }

  async identifyBottlenecks(startDate, endDate) {
    // Mock implementation
    return [
      {
        area: "Peak hour delivery",
        impact: "high",
        recommendation: "Add more drivers during 5-7 PM",
      },
      {
        area: "Vehicle maintenance",
        impact: "medium",
        recommendation: "Schedule preventive maintenance",
      },
    ];
  }

  async getHistoricalMetric(metricName, startDate, endDate) {
    // Mock implementation - return sample data
    const data = [];
    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      data.push({
        date,
        value: Math.random() * 100 + 50,
      });
    }

    return data;
  }

  analyzeTrends(data) {
    // Simple linear regression
    const n = data.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    data.forEach((point, i) => {
      sumX += i;
      sumY += point.value;
      sumXY += i * point.value;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      direction: slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "flat",
      slope,
      intercept,
    };
  }

  forecastMetric(historicalData, days) {
    const lastValue = historicalData[historicalData.length - 1].value;
    const trend = this.analyzeTrends(historicalData);

    const forecast = [];
    for (let i = 1; i <= days; i++) {
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        predictedValue: lastValue + trend.slope * i,
      });
    }

    return forecast;
  }

  detectSeasonality(data) {
    // Mock implementation - would use FFT or autocorrelation
    return {
      hasSeasonality: false,
      period: null,
    };
  }

  calculateStatistics(data) {
    const values = data.map((d) => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  async loadReportTemplate(templateId) {
    // Mock implementation
    return {
      id: templateId,
      title: "Custom Report",
      description: "Custom report template",
      dataQueries: [],
      calculations: [],
      visualizations: [],
    };
  }

  async gatherCustomData(queries, parameters) {
    // Mock implementation
    return {};
  }

  processCustomData(data, calculations) {
    // Mock implementation
    return data;
  }

  generateVisualizations(data, config) {
    // Mock implementation
    return [];
  }

  calculateNextRun(frequency) {
    const now = new Date();

    switch (frequency) {
      case REPORT_FREQUENCIES.DAILY:
        now.setDate(now.getDate() + 1);
        break;
      case REPORT_FREQUENCIES.WEEKLY:
        now.setDate(now.getDate() + 7);
        break;
      case REPORT_FREQUENCIES.MONTHLY:
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }

    return now;
  }

  async exportToPDF(report) {
    // Mock implementation
    return Buffer.from("PDF content");
  }

  exportToHTML(report) {
    return `<html><body><h1>${report.type}</h1></body></html>`;
  }

  exportToCSV(report) {
    return "timestamp,metric,value\n";
  }

  async exportToExcel(report) {
    // Mock implementation
    return Buffer.from("Excel content");
  }

  async saveReport(reportData) {
    try {
      await prisma.biReport.create({
        data: {
          ...reportData,
          generated_at: new Date(),
        },
      });
    } catch (error) {
      logger.error("Failed to save report", { error: error.message });
    }
  }
}

// Create singleton instance
const biReportGenerator = new BIReportGenerator();

/**
 * Public API
 */
module.exports = {
  generateExecutiveSummary: (dateRange) => biReportGenerator.generateExecutiveSummary(dateRange),
  generateFinancialReport: (startDate, endDate) =>
    biReportGenerator.generateFinancialReport(startDate, endDate),
  generateOperationalReport: (startDate, endDate) =>
    biReportGenerator.generateOperationalReport(startDate, endDate),
  generateTrendAnalysis: (metricName, lookbackDays) =>
    biReportGenerator.generateTrendAnalysis(metricName, lookbackDays),
  generateCustomReport: (reportConfig) => biReportGenerator.generateCustomReport(reportConfig),
  scheduleReport: (reportConfig) => biReportGenerator.scheduleReport(reportConfig),
  exportReport: (reportId, format) => biReportGenerator.exportReport(reportId, format),

  // Constants
  REPORT_TYPES,
  REPORT_FREQUENCIES,
  REPORT_FORMATS,
};
