export type UserRole = 'super_admin' | 'company_admin' | 'technician' | 'client'
export type Season = 'spring' | 'summer' | 'fall' | 'winter'
export type MaintenanceTier = 1 | 2 | 3
export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type FilterCondition = 'clean' | 'dirty' | 'replaced' | 'n_a'

export type EquipmentType =
  | 'RTU'
  | 'SPLIT_SYSTEM'
  | 'AHU'
  | 'FURNACE'
  | 'BOILER'
  | 'MAU'
  | 'EXHAUST_FAN'
  | 'MINI_SPLIT'
  | 'HEAT_PUMP'
  | 'WALK_IN_COOLER'
  | 'WALK_IN_FREEZER'
  | 'REACH_IN'
  | 'CHILLER'
  | 'COOLING_TOWER'
  | 'UNIT_HEATER'
  | 'PTAC'
  | 'VRF'
  | 'ICE_MACHINE'
  | 'CONDENSING_UNIT'
  | 'WATER_HEATER_TANK'
  | 'WATER_HEATER_TANKLESS'
  | 'BACKFLOW_PREVENTER'
  | 'SUMP_PUMP'
  | 'SEWAGE_EJECTOR_PUMP'
  | 'GREASE_TRAP'
  | 'FLOOR_DRAIN'
  | 'BOOSTER_PUMP'
  | 'WATER_SOFTENER'
  | 'MIXING_VALVE'
  | 'GAS_METER_REGULATOR'
  | 'FLOOR_HEAT_MANIFOLD'
  | 'OTHER'

export type AssetCategory = 'hvac' | 'plumbing' | 'other'

export const HVAC_EQUIPMENT_TYPES: EquipmentType[] = [
  'RTU', 'SPLIT_SYSTEM', 'AHU', 'FURNACE', 'BOILER', 'MAU', 'EXHAUST_FAN',
  'MINI_SPLIT', 'HEAT_PUMP', 'WALK_IN_COOLER', 'WALK_IN_FREEZER', 'REACH_IN',
  'CHILLER', 'COOLING_TOWER', 'UNIT_HEATER', 'PTAC', 'VRF', 'ICE_MACHINE',
  'CONDENSING_UNIT',
]

export const PLUMBING_EQUIPMENT_TYPES: EquipmentType[] = [
  'WATER_HEATER_TANK', 'WATER_HEATER_TANKLESS', 'BACKFLOW_PREVENTER',
  'SUMP_PUMP', 'SEWAGE_EJECTOR_PUMP', 'GREASE_TRAP', 'FLOOR_DRAIN',
  'BOOSTER_PUMP', 'WATER_SOFTENER', 'MIXING_VALVE', 'GAS_METER_REGULATOR',
  'FLOOR_HEAT_MANIFOLD',
]

export function getAssetCategory(type: EquipmentType): AssetCategory {
  if (HVAC_EQUIPMENT_TYPES.includes(type)) return 'hvac'
  if (PLUMBING_EQUIPMENT_TYPES.includes(type)) return 'plumbing'
  return 'other'
}

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  RTU: 'Rooftop Unit (RTU)',
  SPLIT_SYSTEM: 'Split System',
  AHU: 'Air Handler Unit (AHU)',
  FURNACE: 'Furnace',
  BOILER: 'Boiler',
  MAU: 'Makeup Air Unit (MAU)',
  EXHAUST_FAN: 'Exhaust Fan',
  MINI_SPLIT: 'Mini Split / Ductless',
  HEAT_PUMP: 'Heat Pump',
  WALK_IN_COOLER: 'Walk-In Cooler',
  WALK_IN_FREEZER: 'Walk-In Freezer',
  REACH_IN: 'Reach-In Cooler/Freezer',
  CHILLER: 'Chiller',
  COOLING_TOWER: 'Cooling Tower',
  UNIT_HEATER: 'Unit Heater',
  PTAC: 'PTAC Unit',
  VRF: 'VRF System',
  ICE_MACHINE: 'Ice Machine',
  CONDENSING_UNIT: 'Condensing Unit (Remote)',
  WATER_HEATER_TANK: 'Water Heater — Tank',
  WATER_HEATER_TANKLESS: 'Water Heater — Tankless',
  BACKFLOW_PREVENTER: 'Backflow Preventer',
  SUMP_PUMP: 'Sump Pump',
  SEWAGE_EJECTOR_PUMP: 'Sewage Ejector Pump',
  GREASE_TRAP: 'Grease Trap / Interceptor',
  FLOOR_DRAIN: 'Floor Drain',
  BOOSTER_PUMP: 'Booster Pump',
  WATER_SOFTENER: 'Water Softener',
  MIXING_VALVE: 'Thermostatic Mixing Valve',
  GAS_METER_REGULATOR: 'Gas Meter / Regulator',
  FLOOR_HEAT_MANIFOLD: 'In-Floor Heat Manifold',
  OTHER: 'Other',
}

export const TIER_LABELS: Record<MaintenanceTier, string> = {
  1: 'Tier 1 — Premium',
  2: 'Tier 2 — Standard',
  3: 'Tier 3 — Basic',
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
}

export interface Tenant {
  id: string
  name: string
  logo_url?: string
  brand_color?: string
  openai_api_key?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  website?: string
  auto_procurement_enabled?: boolean
  procurement_lead_days?: number
  manager_email?: string
  default_regular_rate?: number
  default_overtime_rate?: number
  default_weekend_rate?: number
  default_emergency_rate?: number
  default_holiday_rate?: number
  created_at: string
  updated_at: string
}

export interface SupplierContact {
  id: string
  tenant_id: string
  name: string
  category: 'hvac' | 'plumbing' | 'refrigeration' | 'general'
  account_number?: string
  rep_name?: string
  order_email?: string
  order_phone?: string
  website?: string
  ships_to_site: boolean
  is_default_hvac: boolean
  is_default_plumbing: boolean
  notes?: string
}

export interface PartCatalogItem {
  id: string
  tenant_id: string
  supplier_id?: string
  name: string
  part_number?: string
  supplier_part_number?: string // PRIVATE — strip before sending to clients
  manufacturer?: string
  category: 'filter' | 'belt' | 'refrigerant' | 'electrical' | 'plumbing_part' | 'valve' | 'pump' | 'other'
  compatible_equipment_types?: EquipmentType[]
  cost_price?: number   // PRIVATE
  sell_price?: number
  markup_pct?: number   // PRIVATE
  unit: string
  in_stock: boolean
  stock_note?: string
  lead_time_days: number
}

// Client-safe view of a part — cost fields intentionally absent
export type PartCatalogPublic = Omit<PartCatalogItem, 'cost_price' | 'markup_pct' | 'supplier_part_number' | 'supplier_id'>

export interface EquipmentPart {
  id: string
  tenant_id: string
  equipment_id: string
  part_id: string
  quantity_per_service: number
  applies_seasons: Season[]
  notes?: string
  part?: PartCatalogItem
}

export interface ProcurementOrder {
  id: string
  tenant_id: string
  visit_id: string
  supplier_id?: string
  order_items: { part_id: string; name: string; quantity: number; cost_price?: number; part_number?: string }[]
  status: 'pending' | 'sent' | 'po_confirmed' | 'received' | 'cancelled'
  po_number?: string
  po_confirmed_at?: string
  sent_at?: string
  needed_by_date?: string
  created_at: string
}

export interface Recommendation {
  id: string
  tenant_id: string
  equipment_id: string
  maintenance_record_id?: string
  visit_id?: string
  priority: 'urgent' | 'recommended' | 'monitor'
  title: string
  description?: string
  status: 'open' | 'quoted' | 'approved' | 'declined' | 'completed'
  created_at: string
  equipment?: Equipment
}

export interface QuoteLineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Quote {
  id: string
  tenant_id: string
  facility_id: string
  recommendation_id?: string
  quote_number: string
  line_items: QuoteLineItem[]
  subtotal: number
  gst: number
  total: number
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'declined'
  sent_at?: string
  notes?: string
  created_at: string
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name?: string
  role: UserRole
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Facility {
  id: string
  tenant_id: string
  name: string
  address?: string
  city?: string
  province?: string
  postal_code?: string
  photo_url?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  client_user_id?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  equipment?: Equipment[]
  client?: User
}

export interface Equipment {
  id: string
  facility_id: string
  tenant_id: string
  name: string
  equipment_type: EquipmentType
  manufacturer?: string
  model_number?: string
  serial_number?: string
  tonnage?: number
  btu_capacity?: number
  voltage?: string
  refrigerant_type?: string
  year_installed?: number
  location_in_facility?: string
  unit_photo_url?: string
  nameplate_photo_url?: string
  maintenance_tier: MaintenanceTier
  has_blower_motor: boolean
  has_venter_motor: boolean
  filter_size?: string
  filter_quantity: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  facility?: Facility
  maintenance_records?: MaintenanceRecord[]
}

export interface MaintenanceVisit {
  id: string
  tenant_id: string
  facility_id: string
  technician_id?: string
  season: Season
  scheduled_date?: string
  completed_date?: string
  status: VisitStatus
  notes?: string
  created_at: string
  updated_at: string
  facility?: Facility
  technician?: User
  records?: MaintenanceRecord[]
}

export interface TaskRecord {
  id: string
  completed: boolean
  notes?: string
  value?: string | number
}

export interface PhotoRecord {
  url: string
  caption?: string
}

export interface MaintenanceRecord {
  id: string
  visit_id?: string
  equipment_id: string
  tenant_id: string
  technician_id?: string
  season: Season
  service_date: string
  maintenance_tier: MaintenanceTier
  tasks_completed: TaskRecord[]
  filter_size?: string
  filter_condition?: FilterCondition
  supply_fan_amp_l1?: number
  supply_fan_amp_l2?: number
  supply_fan_amp_l3?: number
  condenser_fan_amp_l1?: number
  condenser_fan_amp_l2?: number
  inducer_amp?: number
  voltage_l1_l2?: number
  voltage_l2_l3?: number
  voltage_l1_l3?: number
  suction_pressure?: number
  discharge_pressure?: number
  suction_temp?: number
  liquid_line_temp?: number
  superheat?: number
  subcooling?: number
  supply_air_temp?: number
  return_air_temp?: number
  temp_differential?: number
  gas_pressure_in_wc?: number
  supply_air_temp_heat?: number
  return_air_temp_heat?: number
  temp_rise?: number
  custom_readings?: Record<string, string | number>
  photos: PhotoRecord[]
  notes?: string
  report_pdf_url?: string
  report_sent_at?: string
  report_sent_to?: string
  created_at: string
  updated_at: string
  equipment?: Equipment
  technician?: User
}

export interface MaintenanceTask {
  id: string
  description: string
  category: 'filter' | 'coil' | 'electrical' | 'refrigeration' | 'combustion' | 'mechanical' | 'controls' | 'safety' | 'general'
  minTier: MaintenanceTier
  hasDataEntry?: boolean
  dataHint?: string
}

export interface SeasonalChecklist {
  season: Season
  equipmentType: EquipmentType
  tasks: MaintenanceTask[]
  measurementFields: string[]
}

export interface EquipmentIdentificationResult {
  equipment_type: EquipmentType
  manufacturer?: string
  model_number?: string
  serial_number?: string
  tonnage?: number
  btu_capacity?: number
  voltage?: string
  refrigerant_type?: string
  year?: string
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}
