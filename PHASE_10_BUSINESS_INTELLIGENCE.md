# 📊 PHASE 10: BUSINESS INTELLIGENCE & ANALYTICS - ENTERPRISE DW

**Priority**: 🟠 MEDIUM  
**Timeline**: Month 3 (3-4 weeks, after Phase 9)  
**Effort**: 40 hours  
**Impact**: Data-driven decision making, executive dashboards  

---

## 🎯 Business Intelligence Implementation Path

### 1. Data Warehouse Setup (Week 1) ⏱️ 12 hours

#### BigQuery Integration

```javascript
// apps/api/src/services/dataWarehouseService.js

const { BigQuery } = require('@google-cloud/bigquery');

class DataWarehouseService {
  constructor() {
    this.bigquery = new BigQuery({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: process.env.GOOGLE_CLOUD_KEYFILE
    });
    
    this.dataset = this.bigquery.dataset('infamous_freight');
  }

  /**
   * Initialize data warehouse
   */
  async initialize() {
    try {
      // Create dataset
      const [dataset] = await this.bigquery.createDataset('infamous_freight', {
        location: 'US',
        description: 'Infamous Freight Analytics'
      }).catch(() => [this.dataset]); // Already exists

      // Create tables
      await this.createShipmentsTable();
      await this.createUsersTable();
      await this.createAnalyticsTable();

      logger.info('Data warehouse initialized');
    } catch (err) {
      logger.error('Data warehouse initialization error', { error: err.message });
      throw err;
    }
  }

  /**
   * Create shipments table
   */
  async createShipmentsTable() {
    const schema = [
      { name: 'id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'userId', type: 'STRING', mode: 'REQUIRED' },
      { name: 'driverId', type: 'STRING' },
      { name: 'status', type: 'STRING', mode: 'REQUIRED' },
      { name: 'origin', type: 'STRING' },
      { name: 'destination', type: 'STRING' },
      { name: 'pickupTime', type: 'TIMESTAMP' },
      { name: 'deliveryTime', type: 'TIMESTAMP' },
      { name: 'distance', type: 'FLOAT64' },
      { name: 'revenue', type: 'NUMERIC' },
      { name: 'cost', type: 'NUMERIC' },
      { name: 'profit', type: 'NUMERIC' },
      { name: 'createdAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'updatedAt', type: 'TIMESTAMP' }
    ];

    const table = this.dataset.table('shipments');
    
    try {
      await table.create({
        schema,
        location: 'US'
      });
      logger.info('Shipments table created');
    } catch (err) {
      if (err.code !== 409) throw err; // 409 = table exists
    }
  }

  /**
   * Load shipment data to warehouse
   */
  async loadShipmentData(shipment) {
    try {
      const query = `
        INSERT INTO \`${process.env.GOOGLE_CLOUD_PROJECT}.infamous_freight.shipments\`
        (id, userId, driverId, status, origin, destination, pickupTime, 
         deliveryTime, distance, revenue, cost, profit, createdAt, updatedAt)
        VALUES (
          @id, @userId, @driverId, @status, @origin, @destination, @pickupTime,
          @deliveryTime, @distance, @revenue, @cost, @profit, @createdAt, @updatedAt
        )
      `;

      const options = {
        query,
        params: {
          id: shipment.id,
          userId: shipment.userId,
          driverId: shipment.driverId,
          status: shipment.status,
          origin: shipment.origin,
          destination: shipment.destination,
          pickupTime: shipment.pickupTime?.toISOString(),
          deliveryTime: shipment.deliveryTime?.toISOString(),
          distance: shipment.distance,
          revenue: shipment.revenue?.toString(),
          cost: shipment.cost?.toString(),
          profit: (shipment.revenue - shipment.cost)?.toString(),
          createdAt: shipment.createdAt.toISOString(),
          updatedAt: shipment.updatedAt?.toISOString()
        }
      };

      await this.bigquery.query(options);
      logger.info('Shipment data loaded to warehouse', { shipmentId: shipment.id });
    } catch (err) {
      logger.error('Data warehouse load error', { error: err.message });
      throw err;
    }
  }

  /**
   * Run analytics query
   */
  async runAnalytics(query, params) {
    try {
      const options = {
        query,
        params,
        location: 'US'
      };

      const [rows] = await this.bigquery.query(options);
      return rows;
    } catch (err) {
      logger.error('Analytics query error', { error: err.message });
      throw err;
    }
  }
}

module.exports = new DataWarehouseService();
```

---

### 2. Analytics Dashboard (Week 2) ⏱️ 15 hours

#### Dashboard Metrics Service

```javascript
// apps/api/src/services/analyticsService.js

class AnalyticsService {
  /**
   * Calculate key performance indicators
   */
  async getKPIs(startDate, endDate) {
    const query = `
      SELECT
        COUNT(DISTINCT id) as totalShipments,
        COUNT(DISTINCT userId) as uniqueUsers,
        COUNT(DISTINCT driverId) as activeDrivers,
        COUNTIF(status = 'completed') as completedShipments,
        COUNTIF(status = 'pending') as pendingShipments,
        AVG(distance) as avgDistance,
        SUM(revenue) as totalRevenue,
        SUM(cost) as totalCost,
        SUM(profit) as totalProfit,
        ROUND(AVG(EXTRACT(HOUR FROM (deliveryTime - pickupTime))), 2) as avgDeliveryTime
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.infamous_freight.shipments\`
      WHERE createdAt >= @startDate AND createdAt <= @endDate
    `;

    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    return dw.runAnalytics(query, params);
  }

  /**
   * Revenue by time period
   */
  async getRevenueByPeriod(startDate, endDate, period = 'DAY') {
    const query = `
      SELECT
        FORMAT_TIMESTAMP('%Y-%m-%d', createdAt) as date,
        SUM(revenue) as revenue,
        SUM(cost) as cost,
        SUM(profit) as profit,
        COUNT(*) as shipmentCount
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.infamous_freight.shipments\`
      WHERE createdAt >= @startDate AND createdAt <= @endDate
      GROUP BY date
      ORDER BY date DESC
    `;

    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    return dw.runAnalytics(query, params);
  }

  /**
   * Driver performance rankings
   */
  async getDriverPerformance(startDate, endDate, limit = 10) {
    const query = `
      SELECT
        driverId,
        COUNT(*) as shipmentsCompleted,
        ROUND(AVG(distance), 2) as avgDistance,
        ROUND(AVG(EXTRACT(HOUR FROM (deliveryTime - pickupTime))), 2) as avgDeliveryTime,
        COUNTIF(status = 'completed') / COUNT(*) as completionRate
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.infamous_freight.shipments\`
      WHERE createdAt >= @startDate AND createdAt <= @endDate AND status = 'completed'
      GROUP BY driverId
      ORDER BY shipmentsCompleted DESC
      LIMIT @limit
    `;

    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit
    };

    return dw.runAnalytics(query, params);
  }

  /**
   * Customer insights
   */
  async getCustomerInsights(startDate, endDate, limit = 10) {
    const query = `
      SELECT
        userId,
        COUNT(*) as totalShipments,
        SUM(revenue) as customerLTV,
        AVG(revenue) as avgOrderValue,
        MAX(createdAt) as lastOrderDate
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.infamous_freight.shipments\`
      WHERE createdAt >= @startDate AND createdAt <= @endDate
      GROUP BY userId
      ORDER BY customerLTV DESC
      LIMIT @limit
    `;

    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit
    };

    return dw.runAnalytics(query, params);
  }

  /**
   * Route optimization analysis
   */
  async getRouteOptimization(startDate, endDate) {
    const query = `
      SELECT
        origin,
        destination,
        COUNT(*) as routeFrequency,
        ROUND(AVG(distance), 2) as avgDistance,
        ROUND(AVG(revenue), 2) as avgRevenue,
        ROUND(AVG(EXTRACT(HOUR FROM (deliveryTime - pickupTime))), 2) as avgDeliveryTime
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.infamous_freight.shipments\`
      WHERE createdAt >= @startDate AND createdAt <= @endDate AND status = 'completed'
      GROUP BY origin, destination
      HAVING routeFrequency > 5
      ORDER BY routeFrequency DESC
    `;

    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    return dw.runAnalytics(query, params);
  }
}

module.exports = new AnalyticsService();
```

---

### 3. Dashboard API Endpoints (Week 2) ⏱️ 10 hours

```javascript
// apps/api/src/routes/dashboards.js

const router = require('express').Router();
const { authenticate, requireScope, limiters } = require('../middleware/security');
const { handleValidationErrors, validateString } = require('../middleware/validation');
const analytics = require('../services/analyticsService');
const { HTTP_STATUS, ApiResponse } = require('@infamous-freight/shared');

// Get KPIs
router.get('/dashboards/kpi',
  limiters.general,
  authenticate,
  requireScope('dashboard:view'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = new Date(endDate || Date.now());

      const kpis = await analytics.getKPIs(start, end);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({ success: true, data: kpis[0] })
      );
    } catch (err) {
      next(err);
    }
  }
);

// Get revenue trend
router.get('/dashboards/revenue-trend',
  limiters.general,
  authenticate,
  requireScope('dashboard:view'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = new Date(endDate || Date.now());

      const data = await analytics.getRevenueByPeriod(start, end);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({ success: true, data })
      );
    } catch (err) {
      next(err);
    }
  }
);

// Get driver performance
router.get('/dashboards/drivers',
  limiters.general,
  authenticate,
  requireScope('dashboard:view'),
  async (req, res, next) => {
    try {
      const { startDate, endDate, limit } = req.query;
      
      const start = new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = new Date(endDate || Date.now());

      const data = await analytics.getDriverPerformance(start, end, parseInt(limit) || 10);

      res.status(HTTP_STATUS.OK).json(
        new ApiResponse({ success: true, data })
      );
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
```

---

### 4. Real-Time Analytics Dashboard (Week 3-4) ⏱️ 13 hours

```typescript
// apps/web/pages/dashboard/analytics.tsx

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy charting components
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { 
  loading: () => <p>Loading chart...</p> 
});
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { 
  loading: () => <p>Loading chart...</p> 
});

export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, revRes, drivRes] = await Promise.all([
          fetch('/api/dashboards/kpi').then(r => r.json()),
          fetch('/api/dashboards/revenue-trend').then(r => r.json()),
          fetch('/api/dashboards/drivers').then(r => r.json())
        ]);

        setKpis(kpiRes.data);
        setRevenue(revRes.data);
        setDrivers(drivRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Revenue" value={`$${kpis.totalRevenue}`} />
        <KPICard label="Profit Margin" value={`${((kpis.totalProfit / kpis.totalRevenue) * 100).toFixed(1)}%`} />
        <KPICard label="Avg Delivery Time" value={`${kpis.avgDeliveryTime}h`} />
        <KPICard label="Completed Shipments" value={kpis.completedShipments} />
      </div>

      {/* Revenue Chart */}
      <ChartCard title="Revenue Trend">
        <LineChart data={revenue}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
          <Line type="monotone" dataKey="profit" stroke="#82ca9d" />
        </LineChart>
      </ChartCard>

      {/* Driver Performance */}
      <ChartCard title="Top Drivers">
        <BarChart data={drivers}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="driverId" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="shipmentsCompleted" fill="#8884d8" />
        </BarChart>
      </ChartCard>
    </div>
  );
}
```

---

## ✅ BUSINESS INTELLIGENCE CHECKLIST

### Data Warehouse
- [ ] BigQuery project created
- [ ] Historical data migrated
- [ ] Real-time data pipeline working
- [ ] Data quality validated
- [ ] Backup strategy in place

### Analytics Engine
- [ ] KPI calculations working
- [ ] Revenue reports accurate
- [ ] Driver performance rankings working
- [ ] Customer insights queries optimized

### Dashboard
- [ ] KPI cards displaying correctly
- [ ] Charts rendering data
- [ ] Real-time updates working
- [ ] Performance < 2s load time
- [ ] Mobile responsive

### Reporting
- [ ] Daily automated reports
- [ ] Email delivery working
- [ ] Executive dashboard access
- [ ] PDF export functional

---

## 🎯 SUCCESS METRICS

**Phase 10 Complete When:**
```
✅ Dashboard loads in < 2 seconds
✅ 95%+ data accuracy
✅ Real-time updates working
✅ Executive team using for decisions
✅ Monthly insights drives 10% improvement
✅ Ready for Phase 11
```

