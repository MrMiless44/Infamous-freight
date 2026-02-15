/**
 * TruckStop Loadboard Integration Service
 * Access to TruckStop load board with 40000+ loads
 */

const axios = require('axios');
const logger = require('../middleware/logger');

const TRUCKSTOP_API_URL = 'https://api.truckstop.com/v1';
const TRUCKSTOP_POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes

class TruckStopService {
    constructor() {
        this.client = null;
        this.accessToken = null;
        this.loads = [];
        this.isInitialized = false;
    }

    async initialize() {
        try {
            if (process.env.TRUCKSTOP_API_KEY) {
                this.client = axios.create({
                    baseURL: TRUCKSTOP_API_URL,
                    headers: {
                        'Authorization': `Bearer ${process.env.TRUCKSTOP_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                });
                this.isInitialized = true;
                logger.info('TruckStop service initialized');
                this.startPolling();
            } else {
                logger.warn('TruckStop API key not configured');
                this.isInitialized = true;
            }
        } catch (error) {
            logger.error('TruckStop initialization failed', { error: error.message });
        }
    }

    async searchLoads(filters = {}) {
        try {
            if (!this.isInitialized || !this.client) {
                return this.getMockLoads(filters);
            }

            const params = {
                pickupCity: filters.pickupCity,
                pickupState: filters.pickupState,
                destinationCity: filters.dropoffCity,
                destinationState: filters.dropoffState,
                weight: filters.weight,
                equipmentType: filters.equipmentType,
                limit: filters.pageSize || 50,
            };

            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await this.client.get('/loads/search', { params });
            const loads = response.data.loads.map(load => this.mapTruckStopLoadToInternal(load));

            logger.info('TruckStop loads fetched', { count: loads.length });
            return loads;
        } catch (error) {
            logger.error('TruckStop search failed', { error: error.message });
            return this.getMockLoads(filters);
        }
    }

    async getLoad(truckstopLoadId) {
        try {
            if (!this.isInitialized || !this.client) {
                return null;
            }

            const response = await this.client.get(`/loads/${truckstopLoadId}`);
            return this.mapTruckStopLoadToInternal(response.data);
        } catch (error) {
            logger.error('TruckStop get load failed', { error: error.message });
            return null;
        }
    }

    async bidOnLoad(truckstopLoadId, driverInfo) {
        try {
            if (!this.isInitialized || !this.client) {
                logger.info('Mock bid placed on TruckStop', { loadId: truckstopLoadId });
                return { success: true, bidId: `ts-bid-${Date.now()}` };
            }

            const response = await this.client.post(`/loads/${truckstopLoadId}/bid`, {
                companyName: driverInfo.companyName,
                mcNumber: driverInfo.mcNumber,
                phone: driverInfo.phone,
                email: driverInfo.email,
                comments: driverInfo.notes,
            });

            logger.info('Bid placed on TruckStop load', { loadId: truckstopLoadId });
            return response.data;
        } catch (error) {
            logger.error('TruckStop bid failed', { error: error.message });
            throw error;
        }
    }

    mapTruckStopLoadToInternal(load) {
        return {
            id: `TS-${load.id}`,
            source: 'truckstop',
            externalId: load.id,
            pickupCity: load.pickupCity,
            pickupState: load.pickupState,
            pickupZip: load.pickupZip,
            pickupDate: load.pickupDate,
            dropoffCity: load.destinationCity,
            dropoffState: load.destinationState,
            dropoffZip: load.destinationZip,
            miles: load.miles,
            weight: load.weight,
            length: load.trailerLength,
            commodity: load.commodity,
            rate: load.rate,
            rateType: 'per_mile',
            equipmentType: load.equipmentType,
            postedTime: new Date(load.postedTime),
            postedAgo: Math.floor((Date.now() - new Date(load.postedTime)) / 1000 / 60),
            loads: load.loads || 1,
            shipper: {
                name: load.shipperName,
                phone: load.shipperPhone,
            },
            pickup: {
                city: load.pickupCity,
                state: load.pickupState,
                zip: load.pickupZip,
                date: load.pickupDate,
            },
            dropoff: {
                city: load.destinationCity,
                state: load.destinationState,
                zip: load.destinationZip,
            },
            details: {
                hazmat: load.hazmat || false,
                temperature: load.temperature,
                comments: load.comments,
            },
            score: this.calculateLoadScore(load),
        };
    }

    calculateLoadScore(load) {
        let score = 50;

        if (load.rate > 2.0) score += 20;
        else if (load.rate > 1.5) score += 15;
        else if (load.rate > 1.2) score += 10;

        if (load.miles > 500) score += 15;
        else if (load.miles > 200) score += 10;

        if (load.hazmat || load.temperature) score += 10;

        const minutesOld = (Date.now() - new Date(load.postedTime)) / 1000 / 60;
        if (minutesOld < 5) score += 5;

        return Math.min(score, 100);
    }

    getMockLoads(filters = {}) {
        return [
            {
                id: 'TS-mock-001',
                pickupCity: 'Memphis',
                pickupState: 'TN',
                pickupZip: '38101',
                destinationCity: 'Atlanta',
                destinationState: 'GA',
                destinationZip: '30301',
                miles: 380,
                weight: 45000,
                trailerLength: 53,
                rate: 1.35,
                equipmentType: 'Dry Van',
                postedTime: new Date(Date.now() - 20 * 60 * 1000),
                loads: 3,
                shipperName: 'Southern Freight',
                shipperPhone: '901-555-0100',
                hazmat: false,
                temperature: null,
                comments: 'Standard freight',
            },
        ];
    }

    startPolling() {
        setInterval(() => {
            this.syncLoads();
        }, TRUCKSTOP_POLLING_INTERVAL);
    }

    async syncLoads() {
        try {
            logger.info('Syncing loads from TruckStop...');
            const loads = await this.searchLoads({
                pageSize: 100,
            });
            this.loads = loads;
            logger.info('TruckStop sync complete', { loadCount: loads.length });
        } catch (error) {
            logger.error('TruckStop sync failed', { error: error.message });
        }
    }

    getStats() {
        return {
            count: this.loads.length,
            avgRate: this.loads.reduce((sum, load) => sum + load.rate, 0) / (this.loads.length || 1),
        };
    }
}

module.exports = new TruckStopService();
