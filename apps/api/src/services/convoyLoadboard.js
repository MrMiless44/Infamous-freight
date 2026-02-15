/**
 * Convoy Loadboard Integration Service
 * Real-time load board with Convoy's API
 */

const axios = require('axios');
const logger = require('../middleware/logger');

const CONVOY_API_URL = 'https://api.convoy.com/v2';

class ConvoyService {
    constructor() {
        this.client = null;
        this.loads = [];
        this.isInitialized = false;
    }

    async initialize() {
        try {
            if (process.env.CONVOY_API_KEY) {
                this.client = axios.create({
                    baseURL: CONVOY_API_URL,
                    headers: {
                        'Authorization': `Bearer ${process.env.CONVOY_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                });
                this.isInitialized = true;
                logger.info('Convoy service initialized');
            } else {
                logger.warn('Convoy API key not configured');
                this.isInitialized = true;
            }
        } catch (error) {
            logger.error('Convoy initialization failed', { error: error.message });
        }
    }

    async searchLoads(filters = {}) {
        try {
            if (!this.isInitialized || !this.client) {
                return this.getMockLoads(filters);
            }

            const params = {
                origin_city: filters.pickupCity,
                origin_state: filters.pickupState,
                destination_city: filters.dropoffCity,
                destination_state: filters.dropoffState,
                limit: filters.pageSize || 50,
            };

            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await this.client.get('/shipments', { params });
            const loads = (response.data.data || []).map(load => this.mapConvoyLoadToInternal(load));

            logger.info('Convoy loads fetched', { count: loads.length });
            return loads;
        } catch (error) {
            logger.error('Convoy search failed', { error: error.message });
            return this.getMockLoads(filters);
        }
    }

    async getLoad(convoyLoadId) {
        try {
            if (!this.isInitialized || !this.client) {
                return null;
            }

            const response = await this.client.get(`/shipments/${convoyLoadId}`);
            return this.mapConvoyLoadToInternal(response.data.data);
        } catch (error) {
            logger.error('Convoy get load failed', { error: error.message });
            return null;
        }
    }

    async bidOnLoad(convoyLoadId, driverInfo) {
        try {
            if (!this.isInitialized || !this.client) {
                logger.info('Mock bid placed on Convoy', { loadId: convoyLoadId });
                return { success: true, bidId: `convoy-bid-${Date.now()}` };
            }

            const response = await this.client.post(`/shipments/${convoyLoadId}/quote`, {
                company_name: driverInfo.companyName,
                carrier_id: driverInfo.carrierId,
                mc_number: driverInfo.mcNumber,
                phone: driverInfo.phone,
                email: driverInfo.email,
            });

            logger.info('Bid placed on Convoy load', { loadId: convoyLoadId });
            return response.data;
        } catch (error) {
            logger.error('Convoy bid failed', { error: error.message });
            throw error;
        }
    }

    mapConvoyLoadToInternal(load) {
        return {
            id: `CONVOY-${load.id}`,
            source: 'convoy',
            externalId: load.id,
            pickupCity: load.origin.city,
            pickupState: load.origin.state,
            pickupZip: load.origin.postal_code,
            pickupDate: load.pickup_date,
            dropoffCity: load.destination.city,
            dropoffState: load.destination.state,
            dropoffZip: load.destination.postal_code,
            miles: load.miles,
            weight: load.weight_lbs,
            length: load.trailer_length,
            commodity: load.commodity,
            rate: load.rate,
            rateType: 'per_mile',
            equipmentType: load.equipment_type,
            postedTime: new Date(load.posted_at),
            postedAgo: Math.floor((Date.now() - new Date(load.posted_at)) / 1000 / 60),
            loads: load.shipments?.length || 1,
            shipper: {
                name: load.shipper_name,
                phone: load.shipper_phone,
            },
            pickup: {
                city: load.origin.city,
                state: load.origin.state,
                zip: load.origin.postal_code,
                date: load.pickup_date,
            },
            dropoff: {
                city: load.destination.city,
                state: load.destination.state,
                zip: load.destination.postal_code,
            },
            details: {
                hazmat: load.hazmat || false,
                temperature: load.temperature_control,
                comments: load.special_instructions,
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

        if (load.hazmat || load.temperature_control) score += 10;

        const minutesOld = (Date.now() - new Date(load.posted_at)) / 1000 / 60;
        if (minutesOld < 5) score += 5;

        return Math.min(score, 100);
    }

    getMockLoads(filters = {}) {
        return [
            {
                id: 'CONVOY-mock-001',
                origin: {
                    city: 'Chicago',
                    state: 'IL',
                    postal_code: '60601',
                },
                destination: {
                    city: 'Milwaukee',
                    state: 'WI',
                    postal_code: '53201',
                },
                miles: 92,
                weight_lbs: 38000,
                trailer_length: 53,
                rate: 1.18,
                equipment_type: 'Dry Van',
                posted_at: new Date(Date.now() - 10 * 60 * 1000),
                shipments: [{ id: 1 }],
                shipper_name: 'Convoy Demo',
                shipper_phone: '312-555-0100',
                hazmat: false,
                temperature_control: null,
                special_instructions: 'Standard load',
            },
        ];
    }

    getStats() {
        return {
            count: this.loads.length,
            avgRate: this.loads.reduce((sum, load) => sum + load.rate, 0) / (this.loads.length || 1),
        };
    }
}

module.exports = new ConvoyService();
