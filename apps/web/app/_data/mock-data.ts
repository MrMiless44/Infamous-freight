// Status types
export type LoadStatus = 'draft' | 'posted' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
export type PaymentStatus = 'pending' | 'invoiced' | 'paid' | 'overdue';
export type DocumentType = 'bol' | 'pod' | 'invoice' | 'insurance' | 'permit' | 'contract';
export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'shipper' | 'carrier';
export type EquipmentType = 'dry_van' | 'reefer' | 'flatbed' | 'step_deck' | 'tanker' | 'intermodal' | 'box_truck' | 'ltl';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone: string;
  company?: string;
  status: 'active' | 'inactive';
  lastActive: string;
}

export interface Load {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  shipper: { name: string; contact: string; };
  origin: { city: string; state: string; zip: string; address: string; };
  destination: { city: string; state: string; zip: string; address: string; };
  pickupDate: string;
  pickupWindow: string;
  deliveryDate: string;
  deliveryWindow: string;
  equipmentType: EquipmentType;
  weight: number;
  commodity: string;
  rate: number;
  distance: number;
  driver?: { id: string; name: string; };
  carrier?: { id: string; name: string; };
  bolNumber?: string;
  podStatus: 'pending' | 'uploaded' | 'verified' | 'missing';
  eta?: string;
  delayReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  loadId: string;
  trackingNumber: string;
  status: LoadStatus;
  origin: { city: string; state: string; };
  destination: { city: string; state: string; };
  currentLocation?: { city: string; state: string; lat: number; lng: number; };
  eta: string;
  progress: number;
  milestones: { label: string; time: string; completed: boolean; }[];
  carrier: string;
  driver: string;
  lastUpdate: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'available' | 'on_route' | 'off_duty' | 'resting';
  currentLoad?: string;
  truck: string;
  license: string;
  cdlExpiry: string;
  rating: number;
  completedLoads: number;
  onTimeRate: number;
  earnings: { thisWeek: number; thisMonth: number; };
  location?: { city: string; state: string; };
}

export interface Carrier {
  id: string;
  name: string;
  mcNumber: string;
  dotNumber: string;
  contact: string;
  phone: string;
  email: string;
  fleetSize: number;
  rating: number;
  onTimeRate: number;
  activeLoads: number;
  totalLoads: number;
  status: 'active' | 'suspended' | 'pending';
  insuranceExpiry: string;
  safetyScore: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  loadId: string;
  loadNumber: string;
  customer: string;
  amount: number;
  status: PaymentStatus;
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  loadId?: string;
  carrier?: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt?: string;
  status: 'valid' | 'expired' | 'pending_review';
  fileSize: string;
}

export interface Notification {
  id: string;
  type: 'shipment' | 'system' | 'delay' | 'document' | 'payment' | 'message';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Message {
  id: string;
  from: { name: string; role: UserRole; };
  to: { name: string; role: UserRole; };
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  thread: number;
}

export interface Vehicle {
  id: string;
  unitNumber: string;
  type: EquipmentType;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  status: 'active' | 'maintenance' | 'out_of_service';
  mileage: number;
  nextService: string;
  driver?: string;
  location?: { city: string; state: string; };
}

// Now create 15+ sample loads
export const loads: Load[] = [
  {
    id: 'LD-2024-001',
    loadNumber: 'LD-2024-001',
    status: 'in_transit',
    shipper: { name: 'Midwest Steel Corp', contact: 'James Wilson' },
    origin: { city: 'Chicago', state: 'IL', zip: '60601', address: '4200 S Ashland Ave' },
    destination: { city: 'Houston', state: 'TX', zip: '77001', address: '8900 Port of Houston Blvd' },
    pickupDate: '2024-03-28',
    pickupWindow: '08:00 - 12:00',
    deliveryDate: '2024-03-30',
    deliveryWindow: '06:00 - 14:00',
    equipmentType: 'flatbed',
    weight: 42000,
    commodity: 'Steel Coils',
    rate: 4850,
    distance: 1092,
    driver: { id: 'DRV-001', name: 'Marcus Johnson' },
    carrier: { id: 'CAR-001', name: 'Great Plains Logistics' },
    bolNumber: 'BOL-28934',
    podStatus: 'pending',
    eta: '2024-03-30 10:30',
    createdAt: '2024-03-25',
    updatedAt: '2024-03-28',
  },
  {
    id: 'LD-2024-002',
    loadNumber: 'LD-2024-002',
    status: 'delivered',
    shipper: { name: 'FreshFarm Foods', contact: 'Sarah Chen' },
    origin: { city: 'Salinas', state: 'CA', zip: '93901', address: '120 Harvest Ln' },
    destination: { city: 'Phoenix', state: 'AZ', zip: '85001', address: '3400 Distribution Pkwy' },
    pickupDate: '2024-03-26',
    pickupWindow: '04:00 - 06:00',
    deliveryDate: '2024-03-27',
    deliveryWindow: '02:00 - 08:00',
    equipmentType: 'reefer',
    weight: 38500,
    commodity: 'Fresh Produce',
    rate: 3200,
    distance: 663,
    driver: { id: 'DRV-003', name: 'Elena Rodriguez' },
    carrier: { id: 'CAR-002', name: 'Western Cold Chain' },
    bolNumber: 'BOL-28901',
    podStatus: 'verified',
    createdAt: '2024-03-24',
    updatedAt: '2024-03-27',
  },
  {
    id: 'LD-2024-003',
    loadNumber: 'LD-2024-003',
    status: 'assigned',
    shipper: { name: 'TechParts Global', contact: 'David Park' },
    origin: { city: 'San Jose', state: 'CA', zip: '95110', address: '800 Component Way' },
    destination: { city: 'Portland', state: 'OR', zip: '97201', address: '1500 NW Warehouse Ave' },
    pickupDate: '2024-03-29',
    pickupWindow: '10:00 - 14:00',
    deliveryDate: '2024-03-31',
    deliveryWindow: '08:00 - 16:00',
    equipmentType: 'dry_van',
    weight: 24000,
    commodity: 'Electronic Components',
    rate: 2750,
    distance: 636,
    driver: { id: 'DRV-005', name: 'Tommy Nguyen' },
    carrier: { id: 'CAR-003', name: 'Pacific Northwest Express' },
    bolNumber: 'BOL-28945',
    podStatus: 'pending',
    createdAt: '2024-03-26',
    updatedAt: '2024-03-28',
  },
  {
    id: 'LD-2024-004',
    loadNumber: 'LD-2024-004',
    status: 'delayed',
    shipper: { name: 'Gulf Petroleum', contact: 'Robert Martinez' },
    origin: { city: 'Baton Rouge', state: 'LA', zip: '70801', address: '6700 Refinery Rd' },
    destination: { city: 'Atlanta', state: 'GA', zip: '30301', address: '2200 Industrial Blvd' },
    pickupDate: '2024-03-27',
    pickupWindow: '06:00 - 10:00',
    deliveryDate: '2024-03-29',
    deliveryWindow: '08:00 - 16:00',
    equipmentType: 'tanker',
    weight: 45000,
    commodity: 'Industrial Lubricants',
    rate: 5100,
    distance: 529,
    driver: { id: 'DRV-002', name: 'Terrance Williams' },
    carrier: { id: 'CAR-004', name: 'Southern Tanker Lines' },
    bolNumber: 'BOL-28912',
    podStatus: 'pending',
    eta: '2024-03-30 08:00',
    delayReason: 'Weather delay - severe storms on I-20 corridor',
    createdAt: '2024-03-25',
    updatedAt: '2024-03-28',
  },
  {
    id: 'LD-2024-005',
    loadNumber: 'LD-2024-005',
    status: 'posted',
    shipper: { name: 'Cascade Lumber', contact: 'Mike Thompson' },
    origin: { city: 'Seattle', state: 'WA', zip: '98101', address: '4500 Harbor Island Dr' },
    destination: { city: 'Denver', state: 'CO', zip: '80201', address: '7800 Stapleton Dr' },
    pickupDate: '2024-03-30',
    pickupWindow: '07:00 - 11:00',
    deliveryDate: '2024-04-01',
    deliveryWindow: '08:00 - 17:00',
    equipmentType: 'flatbed',
    weight: 48000,
    commodity: 'Dimensional Lumber',
    rate: 4200,
    distance: 1321,
    podStatus: 'pending',
    createdAt: '2024-03-27',
    updatedAt: '2024-03-27',
  },
  {
    id: 'LD-2024-006',
    loadNumber: 'LD-2024-006',
    status: 'picked_up',
    shipper: { name: 'AutoNova Parts', contact: 'Linda Chang' },
    origin: { city: 'Detroit', state: 'MI', zip: '48201', address: '1200 Assembly Line Blvd' },
    destination: { city: 'Nashville', state: 'TN', zip: '37201', address: '900 Commerce St' },
    pickupDate: '2024-03-28',
    pickupWindow: '09:00 - 13:00',
    deliveryDate: '2024-03-29',
    deliveryWindow: '08:00 - 17:00',
    equipmentType: 'dry_van',
    weight: 31000,
    commodity: 'Auto Parts & Assemblies',
    rate: 2400,
    distance: 533,
    driver: { id: 'DRV-006', name: 'Chris Palmer' },
    carrier: { id: 'CAR-005', name: 'Great Lakes Transport' },
    bolNumber: 'BOL-28950',
    podStatus: 'pending',
    eta: '2024-03-29 14:00',
    createdAt: '2024-03-26',
    updatedAt: '2024-03-28',
  },
  {
    id: 'LD-2024-007',
    loadNumber: 'LD-2024-007',
    status: 'draft',
    shipper: { name: 'Northeast Pharma', contact: 'Amanda Price' },
    origin: { city: 'Newark', state: 'NJ', zip: '07101', address: '200 McCarter Hwy' },
    destination: { city: 'Miami', state: 'FL', zip: '33101', address: '6600 NW 7th Ave' },
    pickupDate: '2024-04-01',
    pickupWindow: '06:00 - 10:00',
    deliveryDate: '2024-04-03',
    deliveryWindow: '08:00 - 16:00',
    equipmentType: 'reefer',
    weight: 18000,
    commodity: 'Pharmaceutical Supplies',
    rate: 5800,
    distance: 1280,
    podStatus: 'pending',
    createdAt: '2024-03-28',
    updatedAt: '2024-03-28',
  },
  {
    id: 'LD-2024-008',
    loadNumber: 'LD-2024-008',
    status: 'in_transit',
    shipper: { name: 'Summit Building Supply', contact: 'Tom Richardson' },
    origin: { city: 'Dallas', state: 'TX', zip: '75201', address: '3200 Industrial Blvd' },
    destination: { city: 'Memphis', state: 'TN', zip: '38101', address: '4400 Lamar Ave' },
    pickupDate: '2024-03-28',
    pickupWindow: '07:00 - 11:00',
    deliveryDate: '2024-03-29',
    deliveryWindow: '10:00 - 18:00',
    equipmentType: 'step_deck',
    weight: 39000,
    commodity: 'Construction Materials',
    rate: 2100,
    distance: 453,
    driver: { id: 'DRV-004', name: 'James Cooper' },
    carrier: { id: 'CAR-001', name: 'Great Plains Logistics' },
    bolNumber: 'BOL-28955',
    podStatus: 'pending',
    eta: '2024-03-29 15:00',
    createdAt: '2024-03-26',
    updatedAt: '2024-03-28',
  },
  {
    id: 'LD-2024-009',
    loadNumber: 'LD-2024-009',
    status: 'cancelled',
    shipper: { name: 'Pacific Textiles', contact: 'Jenny Liu' },
    origin: { city: 'Los Angeles', state: 'CA', zip: '90001', address: '1800 E Slauson Ave' },
    destination: { city: 'Las Vegas', state: 'NV', zip: '89101', address: '3500 Distribution Way' },
    pickupDate: '2024-03-29',
    pickupWindow: '08:00 - 12:00',
    deliveryDate: '2024-03-30',
    deliveryWindow: '08:00 - 16:00',
    equipmentType: 'dry_van',
    weight: 22000,
    commodity: 'Textile Goods',
    rate: 1800,
    distance: 270,
    podStatus: 'pending',
    notes: 'Customer cancelled \u2014 order not ready for shipment',
    createdAt: '2024-03-27',
    updatedAt: '2024-03-28',
  },
  {
    id: 'LD-2024-010',
    loadNumber: 'LD-2024-010',
    status: 'in_transit',
    shipper: { name: 'Heartland Grain Co', contact: 'Bill Anderson' },
    origin: { city: 'Omaha', state: 'NE', zip: '68101', address: '5600 Grain Exchange Rd' },
    destination: { city: 'Kansas City', state: 'MO', zip: '64101', address: '2000 Grand Blvd' },
    pickupDate: '2024-03-28',
    pickupWindow: '05:00 - 09:00',
    deliveryDate: '2024-03-28',
    deliveryWindow: '14:00 - 20:00',
    equipmentType: 'dry_van',
    weight: 44000,
    commodity: 'Grain Products',
    rate: 950,
    distance: 189,
    driver: { id: 'DRV-007', name: 'Ray Mitchell' },
    carrier: { id: 'CAR-006', name: 'Heartland Carriers Inc' },
    bolNumber: 'BOL-28960',
    podStatus: 'pending',
    eta: '2024-03-28 17:30',
    createdAt: '2024-03-27',
    updatedAt: '2024-03-28',
  },
];

// Create 8 drivers
export const drivers: Driver[] = [
  {
    id: 'DRV-001',
    name: 'Marcus Johnson',
    phone: '(312) 555-0147',
    email: 'marcus.j@infamousfreight.com',
    status: 'on_route',
    currentLoad: 'LD-2024-001',
    truck: 'Unit #1042 - Peterbilt 579',
    license: 'CDL-A IL-2847561',
    cdlExpiry: '2025-08-15',
    rating: 4.8,
    completedLoads: 342,
    onTimeRate: 96,
    earnings: { thisWeek: 3200, thisMonth: 11400 },
    location: { city: 'Springfield', state: 'MO' },
  },
  {
    id: 'DRV-002',
    name: 'Terrance Williams',
    phone: '(225) 555-0193',
    email: 'terrance.w@infamousfreight.com',
    status: 'on_route',
    currentLoad: 'LD-2024-004',
    truck: 'Unit #2078 - Kenworth T680',
    license: 'CDL-A LA-9384712',
    cdlExpiry: '2025-11-20',
    rating: 4.6,
    completedLoads: 287,
    onTimeRate: 93,
    earnings: { thisWeek: 2800, thisMonth: 10200 },
    location: { city: 'Jackson', state: 'MS' },
  },
  {
    id: 'DRV-003',
    name: 'Elena Rodriguez',
    phone: '(831) 555-0165',
    email: 'elena.r@infamousfreight.com',
    status: 'available',
    truck: 'Unit #3015 - Freightliner Cascadia',
    license: 'CDL-A CA-6273849',
    cdlExpiry: '2026-02-10',
    rating: 4.9,
    completedLoads: 518,
    onTimeRate: 98,
    earnings: { thisWeek: 2100, thisMonth: 12800 },
    location: { city: 'Phoenix', state: 'AZ' },
  },
  {
    id: 'DRV-004',
    name: 'James Cooper',
    phone: '(214) 555-0128',
    email: 'james.c@infamousfreight.com',
    status: 'on_route',
    currentLoad: 'LD-2024-008',
    truck: 'Unit #4023 - Volvo VNL 860',
    license: 'CDL-A TX-5182947',
    cdlExpiry: '2025-06-30',
    rating: 4.7,
    completedLoads: 423,
    onTimeRate: 95,
    earnings: { thisWeek: 3100, thisMonth: 11900 },
    location: { city: 'Little Rock', state: 'AR' },
  },
  {
    id: 'DRV-005',
    name: 'Tommy Nguyen',
    phone: '(408) 555-0184',
    email: 'tommy.n@infamousfreight.com',
    status: 'resting',
    truck: 'Unit #5009 - Mack Anthem',
    license: 'CDL-A CA-7293841',
    cdlExpiry: '2025-09-25',
    rating: 4.5,
    completedLoads: 196,
    onTimeRate: 91,
    earnings: { thisWeek: 1900, thisMonth: 8700 },
    location: { city: 'Sacramento', state: 'CA' },
  },
  {
    id: 'DRV-006',
    name: 'Chris Palmer',
    phone: '(313) 555-0156',
    email: 'chris.p@infamousfreight.com',
    status: 'on_route',
    currentLoad: 'LD-2024-006',
    truck: 'Unit #6031 - International LT',
    license: 'CDL-A MI-4829173',
    cdlExpiry: '2026-01-12',
    rating: 4.4,
    completedLoads: 267,
    onTimeRate: 90,
    earnings: { thisWeek: 2600, thisMonth: 10100 },
    location: { city: 'Louisville', state: 'KY' },
  },
  {
    id: 'DRV-007',
    name: 'Ray Mitchell',
    phone: '(402) 555-0137',
    email: 'ray.m@infamousfreight.com',
    status: 'on_route',
    currentLoad: 'LD-2024-010',
    truck: 'Unit #7044 - Western Star 5700',
    license: 'CDL-A NE-8374926',
    cdlExpiry: '2025-12-05',
    rating: 4.7,
    completedLoads: 389,
    onTimeRate: 97,
    earnings: { thisWeek: 2400, thisMonth: 9800 },
    location: { city: 'St. Joseph', state: 'MO' },
  },
  {
    id: 'DRV-008',
    name: 'Sandra Kim',
    phone: '(206) 555-0172',
    email: 'sandra.k@infamousfreight.com',
    status: 'off_duty',
    truck: 'Unit #8022 - Peterbilt 389',
    license: 'CDL-A WA-6482917',
    cdlExpiry: '2026-04-18',
    rating: 4.8,
    completedLoads: 445,
    onTimeRate: 96,
    earnings: { thisWeek: 0, thisMonth: 9200 },
    location: { city: 'Tacoma', state: 'WA' },
  },
];

// Create 6 carriers
export const carriers: Carrier[] = [
  {
    id: 'CAR-001',
    name: 'Great Plains Logistics',
    mcNumber: 'MC-784921',
    dotNumber: 'DOT-2847561',
    contact: 'Greg Thompson',
    phone: '(816) 555-0190',
    email: 'dispatch@greatplainslog.com',
    fleetSize: 85,
    rating: 4.7,
    onTimeRate: 95,
    activeLoads: 12,
    totalLoads: 1842,
    status: 'active',
    insuranceExpiry: '2025-06-30',
    safetyScore: 92,
  },
  {
    id: 'CAR-002',
    name: 'Western Cold Chain',
    mcNumber: 'MC-631478',
    dotNumber: 'DOT-1938274',
    contact: 'Maria Santos',
    phone: '(559) 555-0145',
    email: 'ops@westerncoldchain.com',
    fleetSize: 120,
    rating: 4.9,
    onTimeRate: 98,
    activeLoads: 18,
    totalLoads: 3210,
    status: 'active',
    insuranceExpiry: '2025-09-15',
    safetyScore: 97,
  },
  {
    id: 'CAR-003',
    name: 'Pacific Northwest Express',
    mcNumber: 'MC-529184',
    dotNumber: 'DOT-3748291',
    contact: 'Dave Wilson',
    phone: '(503) 555-0167',
    email: 'dispatch@pnwexpress.com',
    fleetSize: 45,
    rating: 4.5,
    onTimeRate: 92,
    activeLoads: 6,
    totalLoads: 892,
    status: 'active',
    insuranceExpiry: '2025-08-20',
    safetyScore: 88,
  },
  {
    id: 'CAR-004',
    name: 'Southern Tanker Lines',
    mcNumber: 'MC-847293',
    dotNumber: 'DOT-5829174',
    contact: 'Rick Dupree',
    phone: '(504) 555-0138',
    email: 'ops@southerntanker.com',
    fleetSize: 60,
    rating: 4.3,
    onTimeRate: 89,
    activeLoads: 8,
    totalLoads: 1456,
    status: 'active',
    insuranceExpiry: '2025-07-10',
    safetyScore: 85,
  },
  {
    id: 'CAR-005',
    name: 'Great Lakes Transport',
    mcNumber: 'MC-392847',
    dotNumber: 'DOT-4729381',
    contact: 'Karen O\'Brien',
    phone: '(614) 555-0159',
    email: 'dispatch@greatlakestransport.com',
    fleetSize: 72,
    rating: 4.6,
    onTimeRate: 94,
    activeLoads: 10,
    totalLoads: 2103,
    status: 'active',
    insuranceExpiry: '2025-11-25',
    safetyScore: 91,
  },
  {
    id: 'CAR-006',
    name: 'Heartland Carriers Inc',
    mcNumber: 'MC-718394',
    dotNumber: 'DOT-6382941',
    contact: 'Joe Franklin',
    phone: '(402) 555-0183',
    email: 'ops@heartlandcarriers.com',
    fleetSize: 35,
    rating: 4.4,
    onTimeRate: 91,
    activeLoads: 4,
    totalLoads: 678,
    status: 'active',
    insuranceExpiry: '2025-10-05',
    safetyScore: 87,
  },
];

// Create 10+ invoices
export const invoices: Invoice[] = [
  { id: 'INV-001', invoiceNumber: 'INV-2024-0847', loadId: 'LD-2024-002', loadNumber: 'LD-2024-002', customer: 'FreshFarm Foods', amount: 3200, status: 'paid', issuedDate: '2024-03-27', dueDate: '2024-04-10', paidDate: '2024-03-29' },
  { id: 'INV-002', invoiceNumber: 'INV-2024-0848', loadId: 'LD-2024-001', loadNumber: 'LD-2024-001', customer: 'Midwest Steel Corp', amount: 4850, status: 'invoiced', issuedDate: '2024-03-28', dueDate: '2024-04-11' },
  { id: 'INV-003', invoiceNumber: 'INV-2024-0849', loadId: 'LD-2024-004', loadNumber: 'LD-2024-004', customer: 'Gulf Petroleum', amount: 5100, status: 'pending', issuedDate: '2024-03-28', dueDate: '2024-04-11' },
  { id: 'INV-004', invoiceNumber: 'INV-2024-0850', loadId: 'LD-2024-006', loadNumber: 'LD-2024-006', customer: 'AutoNova Parts', amount: 2400, status: 'pending', issuedDate: '2024-03-28', dueDate: '2024-04-11' },
  { id: 'INV-005', invoiceNumber: 'INV-2024-0832', loadId: 'LD-2024-008', loadNumber: 'LD-2024-008', customer: 'Summit Building Supply', amount: 2100, status: 'invoiced', issuedDate: '2024-03-26', dueDate: '2024-04-09' },
  { id: 'INV-006', invoiceNumber: 'INV-2024-0820', loadId: 'LD-2024-010', loadNumber: 'LD-2024-010', customer: 'Heartland Grain Co', amount: 950, status: 'pending', issuedDate: '2024-03-27', dueDate: '2024-04-10' },
  { id: 'INV-007', invoiceNumber: 'INV-2024-0798', loadId: 'LD-2024-003', loadNumber: 'LD-2024-003', customer: 'TechParts Global', amount: 2750, status: 'overdue', issuedDate: '2024-03-15', dueDate: '2024-03-25' },
  { id: 'INV-008', invoiceNumber: 'INV-2024-0775', loadId: 'LD-2024-005', loadNumber: 'LD-2024-005', customer: 'Cascade Lumber', amount: 4200, status: 'pending', issuedDate: '2024-03-27', dueDate: '2024-04-10' },
];

// Create 12 notifications
export const notifications: Notification[] = [
  { id: 'N-001', type: 'shipment', title: 'Load LD-2024-001 Update', message: 'Driver Marcus Johnson passed Springfield, MO checkpoint. ETA updated to 10:30 AM.', time: '5 min ago', read: false, priority: 'medium' },
  { id: 'N-002', type: 'delay', title: 'Delay Alert: LD-2024-004', message: 'Severe weather on I-20. Load LD-2024-004 delayed by approximately 18 hours.', time: '22 min ago', read: false, priority: 'urgent' },
  { id: 'N-003', type: 'document', title: 'POD Uploaded', message: 'Elena Rodriguez uploaded proof of delivery for load LD-2024-002.', time: '1 hr ago', read: true, priority: 'low' },
  { id: 'N-004', type: 'payment', title: 'Payment Received', message: 'FreshFarm Foods paid invoice INV-2024-0847 ($3,200.00).', time: '2 hrs ago', read: true, priority: 'medium' },
  { id: 'N-005', type: 'system', title: 'CDL Expiry Warning', message: 'Driver James Cooper CDL expires in 90 days. Schedule renewal.', time: '3 hrs ago', read: false, priority: 'high' },
  { id: 'N-006', type: 'message', title: 'New Message from Carrier', message: 'Great Plains Logistics: "Truck #1042 maintenance completed ahead of schedule."', time: '4 hrs ago', read: true, priority: 'low' },
  { id: 'N-007', type: 'shipment', title: 'Pickup Confirmed', message: 'Chris Palmer confirmed pickup for load LD-2024-006 at Detroit facility.', time: '5 hrs ago', read: true, priority: 'medium' },
  { id: 'N-008', type: 'system', title: 'Insurance Renewal', message: 'Southern Tanker Lines insurance expires in 104 days. Send renewal reminder.', time: '6 hrs ago', read: false, priority: 'high' },
  { id: 'N-009', type: 'payment', title: 'Invoice Overdue', message: 'Invoice INV-2024-0798 for TechParts Global is 3 days overdue ($2,750.00).', time: '8 hrs ago', read: false, priority: 'urgent' },
  { id: 'N-010', type: 'shipment', title: 'Load LD-2024-010 Departed', message: 'Ray Mitchell departed Omaha facility with grain products shipment.', time: '10 hrs ago', read: true, priority: 'low' },
];

// Create messages
export const messages: Message[] = [
  { id: 'M-001', from: { name: 'Greg Thompson', role: 'carrier' }, to: { name: 'Dispatch Team', role: 'dispatcher' }, subject: 'Unit #1042 ETA Update', preview: 'Driver reports clear roads ahead. Should arrive Houston by 10:30 AM tomorrow.', time: '15 min ago', read: false, thread: 3 },
  { id: 'M-002', from: { name: 'Marcus Johnson', role: 'driver' }, to: { name: 'Dispatch Team', role: 'dispatcher' }, subject: 'Fuel Stop - Springfield MO', preview: 'Stopping at TA Travel Center for fuel and 30-min break. Back on road by 3:00 PM.', time: '45 min ago', read: false, thread: 2 },
  { id: 'M-003', from: { name: 'Sarah Chen', role: 'shipper' }, to: { name: 'Operations', role: 'dispatcher' }, subject: 'Re: Produce Delivery Confirmation', preview: 'Thank you for the on-time delivery. Quality was excellent. Will have another shipment ready next week.', time: '2 hrs ago', read: true, thread: 5 },
  { id: 'M-004', from: { name: 'Rick Dupree', role: 'carrier' }, to: { name: 'Dispatch Team', role: 'dispatcher' }, subject: 'Weather Delay Update', preview: 'NWS extended severe weather warning through tomorrow AM. Terrance will resume once cleared.', time: '3 hrs ago', read: true, thread: 4 },
  { id: 'M-005', from: { name: 'Mike Thompson', role: 'shipper' }, to: { name: 'Sales Team', role: 'admin' }, subject: 'Lumber Shipment - Need Carrier', preview: 'Need a flatbed carrier for our Seattle to Denver route by Saturday. Can you expedite?', time: '5 hrs ago', read: true, thread: 1 },
  { id: 'M-006', from: { name: 'Karen O\'Brien', role: 'carrier' }, to: { name: 'Billing', role: 'admin' }, subject: 'Invoice Discrepancy - Load LD-2024-006', preview: 'Rate on invoice doesn\'t match the agreed rate confirmation. Please review and adjust.', time: '6 hrs ago', read: false, thread: 2 },
];

// Create vehicles
export const vehicles: Vehicle[] = [
  { id: 'V-001', unitNumber: '1042', type: 'flatbed', make: 'Peterbilt', model: '579', year: 2023, vin: '1XPWD49XXPD123456', licensePlate: 'IL-TRK-1042', status: 'active', mileage: 87432, nextService: '2024-04-15', driver: 'Marcus Johnson', location: { city: 'Springfield', state: 'MO' } },
  { id: 'V-002', unitNumber: '2078', type: 'tanker', make: 'Kenworth', model: 'T680', year: 2022, vin: '1XKWD49XXND789012', licensePlate: 'LA-TRK-2078', status: 'active', mileage: 112890, nextService: '2024-04-20', driver: 'Terrance Williams', location: { city: 'Jackson', state: 'MS' } },
  { id: 'V-003', unitNumber: '3015', type: 'reefer', make: 'Freightliner', model: 'Cascadia', year: 2023, vin: '3AKJGLDR5NSLA3456', licensePlate: 'CA-TRK-3015', status: 'active', mileage: 65210, nextService: '2024-05-01', driver: 'Elena Rodriguez', location: { city: 'Phoenix', state: 'AZ' } },
  { id: 'V-004', unitNumber: '4023', type: 'step_deck', make: 'Volvo', model: 'VNL 860', year: 2024, vin: '4V4NC9EH1RN567890', licensePlate: 'TX-TRK-4023', status: 'active', mileage: 23456, nextService: '2024-06-15', driver: 'James Cooper', location: { city: 'Little Rock', state: 'AR' } },
  { id: 'V-005', unitNumber: '5009', type: 'dry_van', make: 'Mack', model: 'Anthem', year: 2022, vin: '1M1AN07Y5NM012345', licensePlate: 'CA-TRK-5009', status: 'active', mileage: 134567, nextService: '2024-04-05', driver: 'Tommy Nguyen', location: { city: 'Sacramento', state: 'CA' } },
  { id: 'V-006', unitNumber: '6031', type: 'dry_van', make: 'International', model: 'LT', year: 2023, vin: '3HSDJAPR4PN678901', licensePlate: 'MI-TRK-6031', status: 'active', mileage: 78901, nextService: '2024-05-10', driver: 'Chris Palmer', location: { city: 'Louisville', state: 'KY' } },
  { id: 'V-007', unitNumber: '7044', type: 'dry_van', make: 'Western Star', model: '5700', year: 2021, vin: '5KJJAELD2MPQR2345', licensePlate: 'NE-TRK-7044', status: 'active', mileage: 198234, nextService: '2024-04-25', driver: 'Ray Mitchell', location: { city: 'St. Joseph', state: 'MO' } },
  { id: 'V-008', unitNumber: '8022', type: 'flatbed', make: 'Peterbilt', model: '389', year: 2022, vin: '1XPWD49XXND345678', licensePlate: 'WA-TRK-8022', status: 'maintenance', mileage: 156789, nextService: '2024-04-01', driver: 'Sandra Kim', location: { city: 'Tacoma', state: 'WA' } },
];

// Create documents
export const documents: Document[] = [
  { id: 'DOC-001', name: 'BOL-28934.pdf', type: 'bol', loadId: 'LD-2024-001', uploadedBy: 'Marcus Johnson', uploadedAt: '2024-03-28', status: 'valid', fileSize: '245 KB' },
  { id: 'DOC-002', name: 'POD-LD2024002.pdf', type: 'pod', loadId: 'LD-2024-002', uploadedBy: 'Elena Rodriguez', uploadedAt: '2024-03-27', status: 'valid', fileSize: '1.2 MB' },
  { id: 'DOC-003', name: 'Great-Plains-Insurance-2024.pdf', type: 'insurance', carrier: 'Great Plains Logistics', uploadedBy: 'Greg Thompson', uploadedAt: '2024-01-15', expiresAt: '2025-06-30', status: 'valid', fileSize: '890 KB' },
  { id: 'DOC-004', name: 'Southern-Tanker-Insurance.pdf', type: 'insurance', carrier: 'Southern Tanker Lines', uploadedBy: 'Rick Dupree', uploadedAt: '2024-01-10', expiresAt: '2025-07-10', status: 'valid', fileSize: '1.1 MB' },
  { id: 'DOC-005', name: 'MC-Authority-PNW-Express.pdf', type: 'permit', carrier: 'Pacific Northwest Express', uploadedBy: 'Dave Wilson', uploadedAt: '2023-12-01', expiresAt: '2025-12-01', status: 'valid', fileSize: '320 KB' },
  { id: 'DOC-006', name: 'Carrier-Contract-Heartland.pdf', type: 'contract', carrier: 'Heartland Carriers Inc', uploadedBy: 'Admin', uploadedAt: '2024-02-15', expiresAt: '2025-02-15', status: 'valid', fileSize: '456 KB' },
  { id: 'DOC-007', name: 'INV-2024-0847.pdf', type: 'invoice', loadId: 'LD-2024-002', uploadedBy: 'System', uploadedAt: '2024-03-27', status: 'valid', fileSize: '178 KB' },
  { id: 'DOC-008', name: 'HazMat-Permit-SouthernTanker.pdf', type: 'permit', carrier: 'Southern Tanker Lines', uploadedBy: 'Rick Dupree', uploadedAt: '2023-08-20', expiresAt: '2024-08-20', status: 'pending_review', fileSize: '567 KB' },
];

// Shipments for tracking
export const shipments: Shipment[] = [
  {
    id: 'SHP-001',
    loadId: 'LD-2024-001',
    trackingNumber: 'IF-TRK-847291',
    status: 'in_transit',
    origin: { city: 'Chicago', state: 'IL' },
    destination: { city: 'Houston', state: 'TX' },
    currentLocation: { city: 'Springfield', state: 'MO', lat: 37.2090, lng: -93.2923 },
    eta: '2024-03-30 10:30',
    progress: 58,
    milestones: [
      { label: 'Order Created', time: '2024-03-25 09:00', completed: true },
      { label: 'Carrier Assigned', time: '2024-03-26 14:00', completed: true },
      { label: 'Picked Up', time: '2024-03-28 09:45', completed: true },
      { label: 'In Transit', time: '2024-03-28 10:00', completed: true },
      { label: 'Out for Delivery', time: '', completed: false },
      { label: 'Delivered', time: '', completed: false },
    ],
    carrier: 'Great Plains Logistics',
    driver: 'Marcus Johnson',
    lastUpdate: '15 min ago',
  },
  {
    id: 'SHP-002',
    loadId: 'LD-2024-008',
    trackingNumber: 'IF-TRK-847295',
    status: 'in_transit',
    origin: { city: 'Dallas', state: 'TX' },
    destination: { city: 'Memphis', state: 'TN' },
    currentLocation: { city: 'Little Rock', state: 'AR', lat: 34.7465, lng: -92.2896 },
    eta: '2024-03-29 15:00',
    progress: 72,
    milestones: [
      { label: 'Order Created', time: '2024-03-26 11:00', completed: true },
      { label: 'Carrier Assigned', time: '2024-03-27 09:00', completed: true },
      { label: 'Picked Up', time: '2024-03-28 08:30', completed: true },
      { label: 'In Transit', time: '2024-03-28 09:00', completed: true },
      { label: 'Out for Delivery', time: '', completed: false },
      { label: 'Delivered', time: '', completed: false },
    ],
    carrier: 'Great Plains Logistics',
    driver: 'James Cooper',
    lastUpdate: '30 min ago',
  },
  {
    id: 'SHP-003',
    loadId: 'LD-2024-010',
    trackingNumber: 'IF-TRK-847300',
    status: 'in_transit',
    origin: { city: 'Omaha', state: 'NE' },
    destination: { city: 'Kansas City', state: 'MO' },
    currentLocation: { city: 'St. Joseph', state: 'MO', lat: 39.7687, lng: -94.8468 },
    eta: '2024-03-28 17:30',
    progress: 85,
    milestones: [
      { label: 'Order Created', time: '2024-03-27 08:00', completed: true },
      { label: 'Carrier Assigned', time: '2024-03-27 10:00', completed: true },
      { label: 'Picked Up', time: '2024-03-28 06:00', completed: true },
      { label: 'In Transit', time: '2024-03-28 06:30', completed: true },
      { label: 'Out for Delivery', time: '2024-03-28 15:00', completed: true },
      { label: 'Delivered', time: '', completed: false },
    ],
    carrier: 'Heartland Carriers Inc',
    driver: 'Ray Mitchell',
    lastUpdate: '1 hr ago',
  },
];

// Users
export const users: User[] = [
  { id: 'USR-001', name: 'Alex Mercer', email: 'alex.mercer@infamousfreight.com', role: 'admin', phone: '(312) 555-0100', status: 'active', lastActive: '2 min ago' },
  { id: 'USR-002', name: 'Rachel Torres', email: 'rachel.t@infamousfreight.com', role: 'dispatcher', phone: '(312) 555-0101', status: 'active', lastActive: '5 min ago' },
  { id: 'USR-003', name: 'Kevin Shaw', email: 'kevin.s@infamousfreight.com', role: 'dispatcher', phone: '(312) 555-0102', status: 'active', lastActive: '15 min ago' },
  { id: 'USR-004', name: 'James Wilson', email: 'james.w@midweststeel.com', role: 'shipper', phone: '(312) 555-0200', company: 'Midwest Steel Corp', status: 'active', lastActive: '1 hr ago' },
  { id: 'USR-005', name: 'Sarah Chen', email: 'sarah.c@freshfarm.com', role: 'shipper', phone: '(831) 555-0201', company: 'FreshFarm Foods', status: 'active', lastActive: '3 hrs ago' },
  { id: 'USR-006', name: 'Greg Thompson', email: 'greg.t@greatplainslog.com', role: 'carrier', phone: '(816) 555-0190', company: 'Great Plains Logistics', status: 'active', lastActive: '10 min ago' },
  { id: 'USR-007', name: 'Maria Santos', email: 'maria.s@westerncoldchain.com', role: 'carrier', phone: '(559) 555-0145', company: 'Western Cold Chain', status: 'active', lastActive: '2 hrs ago' },
];

// Helper function for status badge styling
export function getStatusColor(status: LoadStatus): string {
  const colors: Record<LoadStatus, string> = {
    draft: 'badge-neutral',
    posted: 'badge-info',
    assigned: 'badge-info',
    picked_up: 'badge-warning',
    in_transit: 'badge-warning',
    delivered: 'badge-success',
    delayed: 'badge-error',
    cancelled: 'badge-neutral',
  };
  return colors[status] || 'badge-neutral';
}

export function getStatusLabel(status: LoadStatus): string {
  const labels: Record<LoadStatus, string> = {
    draft: 'Draft',
    posted: 'Posted',
    assigned: 'Assigned',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    delayed: 'Delayed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
