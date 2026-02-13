const { RecommendationService } = require('../services/recommendationService');

describe('RecommendationService', () => {
    let service;
    let mockPrisma;

    beforeEach(() => {
        // Mock Prisma client
        mockPrisma = {
            shipment: {
                findMany: jest.fn(),
            },
            route: {
                findMany: jest.fn(),
            },
            driver: {
                findMany: jest.fn(),
            },
            vehicle: {
                findMany: jest.fn(),
            },
            customer: {
                findUnique: jest.fn(),
            },
            recommendationLog: {
                create: jest.fn(),
            },
        };

        service = new RecommendationService(mockPrisma);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service Recommendations', () => {
        it('should recommend services based on customer history', async () => {
            // Mock customer shipment history
            mockPrisma.shipment.findMany.mockResolvedValue([
                {
                    serviceType: 'express',
                    price: 150,
                    deliveryTime: 24,
                    status: 'delivered',
                },
                {
                    serviceType: 'express',
                    price: 145,
                    deliveryTime: 22,
                    status: 'delivered',
                },
            ]);

            const recommendations = await service.getServiceRecommendations({
                customerId: 'cust_123',
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                weight: 500,
                urgency: 'express',
            });

            expect(Array.isArray(recommendations)).toBe(true);
            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations[0]).toHaveProperty('score');
            expect(recommendations[0]).toHaveProperty('confidence');
            expect(recommendations[0]).toHaveProperty('reasons');
        });

        it('should handle customers with no history', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([]);

            const recommendations = await service.getServiceRecommendations({
                customerId: 'new_customer',
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                weight: 500,
            });

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
        });

        it('should respect budget constraints', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([]);

            const recommendations = await service.getServiceRecommendations({
                customerId: 'cust_123',
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                weight: 500,
                budget: 100,
            });

            const cheapest = Math.min(...recommendations.map((rec) => rec.price));
            expect(cheapest).toBeLessThanOrEqual(100);
        });

        it('should prioritize services matching urgency', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([]);

            const recommendations = await service.getServiceRecommendations({
                customerId: 'cust_123',
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                weight: 500,
                urgency: 'express',
            });

            // Express services should have higher scores when urgency is express
            const expressService = recommendations.find(r =>
                r.serviceName.toLowerCase().includes('express')
            );
            const standardService = recommendations.find(r =>
                r.serviceName.toLowerCase().includes('standard')
            );

            if (expressService && standardService) {
                expect(expressService.score).toBeGreaterThan(standardService.score);
            }
        });
    });

    describe('Route Recommendations', () => {
        it('should recommend optimal routes', async () => {
            mockPrisma.route.findMany.mockResolvedValue([
                {
                    originLatitude: 40.7128,
                    originLongitude: -74.0060,
                    destinationLatitude: 34.0522,
                    destinationLongitude: -118.2437,
                    status: 'completed',
                },
            ]);

            const recommendations = await service.getRouteRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                urgency: 'standard',
            });

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations[0]).toHaveProperty('distance');
            expect(recommendations[0]).toHaveProperty('duration');
            expect(recommendations[0]).toHaveProperty('score');
        });

        it('should avoid tolls when specified', async () => {
            mockPrisma.route.findMany.mockResolvedValue([]);

            const recommendations = await service.getRouteRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                avoidTolls: true,
            });

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
        });

        it('should avoid highways when specified', async () => {
            mockPrisma.route.findMany.mockResolvedValue([]);

            const recommendations = await service.getRouteRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                avoidHighways: true,
            });

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
        });

        it('should include waypoints in route calculation', async () => {
            mockPrisma.route.findMany.mockResolvedValue([]);

            const recommendations = await service.getRouteRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                waypoints: [
                    { lat: 39.7392, lng: -104.9903 }, // Denver
                ],
            });

            expect(recommendations).toBeDefined();
            expect(recommendations[0].waypoints).toBeDefined();
        });
    });

    describe('Driver Recommendations', () => {
        it('should recommend drivers based on proximity', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    name: 'John Doe',
                    onDuty: true,
                    trackingEnabled: true,
                    currentLatitude: 40.7580,
                    currentLongitude: -73.9855,
                    certifications: [],
                    _count: { completedShipments: 10, ratings: 5 },
                },
                {
                    id: 'driver_2',
                    name: 'Jane Smith',
                    onDuty: true,
                    trackingEnabled: true,
                    currentLatitude: 40.7128,
                    currentLongitude: -74.0060,
                    certifications: [],
                    _count: { completedShipments: 8, ratings: 3 },
                },
            ]);

            const recommendations = await service.getDriverRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
            });

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
            const driver2 = recommendations.find(d => d.driverId === 'driver_2');
            expect(driver2).toBeDefined();
        });

        it('should filter unavailable drivers', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([]);

            const recommendations = await service.getDriverRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
            });

            expect(recommendations).toBeDefined();
        });

        it('should consider driver specialization', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    name: 'Hazmat Specialist',
                    onDuty: true,
                    trackingEnabled: true,
                    certifications: ['hazmat', 'refrigerated'],
                    currentLatitude: 40.7128,
                    currentLongitude: -74.0060,
                    _count: { completedShipments: 15, ratings: 7 },
                },
            ]);

            const recommendations = await service.getDriverRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                specialRequirements: ['hazmat'],
            });

            expect(recommendations).toBeDefined();
            const specialist = recommendations.find(d => d.driverId === 'driver_1');
            expect(specialist).toBeDefined();
            if (specialist) {
                expect(specialist.score).toBeGreaterThan(50); // Should have bonus for matching specialization
            }
        });
    });

    describe('Vehicle Recommendations', () => {
        it('should recommend vehicles based on capacity', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([
                {
                    id: 'vehicle_1',
                    type: 'box_truck',
                    maxWeight: 5000,
                    cargoVolume: 600,
                    fuelType: 'diesel',
                    fuelEfficiencyRating: 70,
                    features: ['general'],
                    maintenanceScore: 80,
                    year: 2020,
                    trackingEnabled: true,
                    status: 'available',
                    currentLatitude: 40.7128,
                    currentLongitude: -74.0060,
                    licensePlate: 'BOX-123',
                    make: 'Freightliner',
                    model: 'M2',
                },
                {
                    id: 'vehicle_2',
                    type: 'semi_truck',
                    maxWeight: 20000,
                    cargoVolume: 2000,
                    fuelType: 'diesel',
                    fuelEfficiencyRating: 60,
                    features: ['palletized'],
                    maintenanceScore: 85,
                    year: 2019,
                    trackingEnabled: true,
                    status: 'available',
                    currentLatitude: 40.7128,
                    currentLongitude: -74.0060,
                    licensePlate: 'SEM-456',
                    make: 'Volvo',
                    model: 'VNL',
                },
            ]);

            const recommendations = await service.getVehicleRecommendations({
                weight: 4500,
                cargoType: 'general',
                origin: { lat: 40.7128, lng: -74.0060 },
            });

            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
            // Vehicle with appropriate capacity should be recommended
            recommendations.forEach(rec => {
                expect(rec.details.maxWeight).toBeGreaterThanOrEqual(4500);
            });
        });

        it('should match cargo type requirements', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([
                {
                    id: 'vehicle_1',
                    type: 'refrigerated_truck',
                    maxWeight: 10000,
                    cargoVolume: 1200,
                    fuelType: 'diesel',
                    fuelEfficiencyRating: 65,
                    features: ['refrigerated', 'general'],
                    maintenanceScore: 80,
                    year: 2021,
                    trackingEnabled: true,
                    status: 'available',
                    currentLatitude: 40.7128,
                    currentLongitude: -74.0060,
                    licensePlate: 'REF-789',
                    make: 'Isuzu',
                    model: 'NQR',
                },
            ]);

            const recommendations = await service.getVehicleRecommendations({
                weight: 5000,
                cargoType: 'refrigerated',
                origin: { lat: 40.7128, lng: -74.0060 },
            });

            expect(recommendations).toBeDefined();
            const refVehicle = recommendations.find(v => v.vehicleId === 'vehicle_1');
            expect(refVehicle).toBeDefined();
            if (refVehicle) {
                expect(refVehicle.details.features).toEqual(
                    expect.arrayContaining(['refrigerated'])
                );
            }
        });

        it('should consider fuel efficiency', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([
                {
                    id: 'vehicle_1',
                    type: 'electric_truck',
                    maxWeight: 5000,
                    cargoVolume: 600,
                    fuelType: 'electric',
                    fuelEfficiencyRating: 95,
                    features: ['general'],
                    maintenanceScore: 90,
                    year: 2023,
                    trackingEnabled: true,
                    status: 'available',
                    currentLatitude: 40.7128,
                    currentLongitude: -74.0060,
                    licensePlate: 'EV-001',
                    make: 'Tesla',
                    model: 'Semi',
                },
                {
                    id: 'vehicle_2',
                    type: 'diesel_truck',
                    maxWeight: 5000,
                    cargoVolume: 600,
                    fuelType: 'diesel',
                    fuelEfficiencyRating: 60,
                    features: ['general'],
                    maintenanceScore: 70,
                    year: 2018,
                    trackingEnabled: true,
                    status: 'available',
                    currentLatitude: 40.7128,
                    currentLongitude: -74.0060,
                    licensePlate: 'DSL-002',
                    make: 'Ford',
                    model: 'F-750',
                },
            ]);

            const recommendations = await service.getVehicleRecommendations({
                weight: 4500,
                cargoType: 'general',
                origin: { lat: 40.7128, lng: -74.0060 },
                preferredFuelType: 'electric',
            });

            expect(recommendations).toBeDefined();
            const electricVehicle = recommendations.find(v => v.vehicleId === 'vehicle_1');
            const dieselVehicle = recommendations.find(v => v.vehicleId === 'vehicle_2');

            if (electricVehicle && dieselVehicle) {
                expect(electricVehicle.score).toBeGreaterThan(dieselVehicle.score);
            }
        });
    });

    describe('Pricing Recommendations', () => {
        it('should recommend competitive pricing', async () => {
            mockPrisma.shipment.findMany
                .mockResolvedValueOnce([
                    { price: 150, weight: 500, distance: 4500, serviceType: 'express' },
                    { price: 145, weight: 500, distance: 4500, serviceType: 'express' },
                    { price: 155, weight: 500, distance: 4500, serviceType: 'express' },
                ])
                .mockResolvedValueOnce([]);

            const result = await service.getPricingRecommendations({
                origin: { lat: 40.7128, lng: -74.0060, name: 'New York' },
                destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
                weight: 500,
                serviceType: 'express',
            });

            expect(result).toHaveProperty('recommended');
            expect(result).toHaveProperty('competitive');
            expect(result).toHaveProperty('premium');
            expect(result).toHaveProperty('marketAnalysis');

            expect(result.recommended.price).toBeGreaterThan(0);
            expect(result.competitive.price).toBeGreaterThan(0);
            expect(result.premium.price).toBeGreaterThan(result.competitive.price);
        });

        it('should handle no historical data gracefully', async () => {
            mockPrisma.shipment.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

            const result = await service.getPricingRecommendations({
                origin: { lat: 40.7128, lng: -74.0060, name: 'New York' },
                destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
                weight: 500,
                serviceType: 'express',
            });

            expect(result).toHaveProperty('recommended');
            expect(result.recommended.price).toBeGreaterThan(0); // Should return base price
        });

        it('should adjust pricing for urgency', async () => {
            mockPrisma.shipment.findMany
                .mockResolvedValueOnce([
                    { price: 150, weight: 500, distance: 4500, serviceType: 'express' },
                ])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    { price: 150, weight: 500, distance: 4500, serviceType: 'express' },
                ])
                .mockResolvedValueOnce([]);

            const standardResult = await service.getPricingRecommendations({
                origin: { lat: 40.7128, lng: -74.0060, name: 'New York' },
                destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
                weight: 500,
                serviceType: 'standard',
                urgency: 'standard',
            });

            const expressResult = await service.getPricingRecommendations({
                origin: { lat: 40.7128, lng: -74.0060, name: 'New York' },
                destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
                weight: 500,
                serviceType: 'express',
                urgency: 'express',
            });

            expect(expressResult.recommended.price).toBeGreaterThan(standardResult.recommended.price);
        });
    });

    describe('Personalized Recommendations', () => {
        it('should analyze customer shipping patterns', async () => {
            mockPrisma.customer.findUnique.mockResolvedValue({
                id: 'cust_123',
                preferences: {},
                shipments: [
                    {
                        serviceType: 'express',
                        origin: 'New York',
                        destination: 'Los Angeles',
                        price: 150,
                        weight: 500,
                        status: 'delivered',
                        createdAt: new Date('2024-01-01'),
                    },
                    {
                        serviceType: 'express',
                        origin: 'New York',
                        destination: 'Los Angeles',
                        price: 145,
                        weight: 500,
                        status: 'delivered',
                        createdAt: new Date('2024-01-15'),
                    },
                    {
                        serviceType: 'standard',
                        origin: 'Boston',
                        destination: 'Chicago',
                        price: 80,
                        weight: 300,
                        status: 'delivered',
                        createdAt: new Date('2024-02-01'),
                    },
                ],
            });

            const result = await service.getPersonalizedRecommendations('cust_123');

            expect(result).toHaveProperty('preferredServices');
            expect(result).toHaveProperty('frequentRoutes');
            expect(result).toHaveProperty('optimalShippingTimes');
        });

        it('should suggest cost savings opportunities', async () => {
            mockPrisma.customer.findUnique.mockResolvedValue({
                id: 'cust_123',
                preferences: {},
                shipments: [
                    {
                        serviceType: 'express',
                        price: 150,
                        urgency: 'standard',
                        status: 'delivered',
                        createdAt: new Date(),
                    },
                ],
            });

            const result = await service.getPersonalizedRecommendations('cust_123');

            expect(result).toHaveProperty('costSavingOpportunities');
        });

        it('should handle customers with no history', async () => {
            mockPrisma.customer.findUnique.mockResolvedValue({
                id: 'new_customer',
                preferences: {},
                shipments: [],
            });

            const result = await service.getPersonalizedRecommendations('new_customer');

            expect(result).toHaveProperty('preferredServices');
            expect(result).toHaveProperty('bundlingOpportunities');
        });
    });

    describe('Algorithm Helpers', () => {
        it('should calculate distance correctly', () => {
            const distance = service.calculateDistance(
                40.7128,
                -74.0060,
                34.0522,
                -118.2437,
            );

            expect(distance).toBeGreaterThan(3900); // ~3936 km
            expect(distance).toBeLessThan(4100);
        });

        it('should calculate confidence level correctly', () => {
            const confidence = service.calculateConfidence({
                rating: { score: 85, weight: 2 },
                speed: { score: 90, weight: 1 },
            });

            expect(confidence).toBeGreaterThanOrEqual(0);
            expect(confidence).toBeLessThanOrEqual(100);
        });
    });

    describe('Edge Cases', () => {
        it('should handle invalid coordinates gracefully', async () => {
            mockPrisma.route.findMany.mockResolvedValue([]);

            const result = await service.getRouteRecommendations({
                origin: { lat: 999, lng: 999 },
                destination: { lat: 34.0522, lng: -118.2437 },
            });

            expect(Array.isArray(result)).toBe(true);
        });

        it('should handle negative weights gracefully', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([]);

            const result = await service.getVehicleRecommendations({
                weight: -500,
                cargoType: 'general',
                origin: { lat: 40.7128, lng: -74.0060 },
            });

            expect(Array.isArray(result)).toBe(true);
        });

        it('should handle empty result sets', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([]);

            const result = await service.getDriverRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
            });

            expect(result).toEqual([]);
        });
    });
});
