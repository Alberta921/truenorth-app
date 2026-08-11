-- ============================================================
-- 02: PLUMBING ASSET SUPPORT
-- Run after schema.sql
-- Extends equipment to cover plumbing assets, not just HVAC
-- ============================================================

-- Drop the old HVAC-only constraint and replace it with one that
-- also covers plumbing equipment True North services.
alter table equipment drop constraint if exists equipment_equipment_type_check;

alter table equipment add constraint equipment_equipment_type_check check (
  equipment_type in (
    -- HVAC / Refrigeration
    'RTU','SPLIT_SYSTEM','AHU','FURNACE','BOILER','MAU',
    'EXHAUST_FAN','MINI_SPLIT','HEAT_PUMP','WALK_IN_COOLER',
    'WALK_IN_FREEZER','REACH_IN','CHILLER','COOLING_TOWER',
    'UNIT_HEATER','PTAC','VRF',
    -- Plumbing / Gas
    'WATER_HEATER_TANK','WATER_HEATER_TANKLESS','BACKFLOW_PREVENTER',
    'SUMP_PUMP','SEWAGE_EJECTOR_PUMP','GREASE_TRAP','FLOOR_DRAIN',
    'BOOSTER_PUMP','WATER_SOFTENER','MIXING_VALVE','GAS_METER_REGULATOR',
    'FLOOR_HEAT_MANIFOLD',
    'OTHER'
  )
);

-- A simple asset_category so the UI can group "HVAC" vs "Plumbing"
-- without hardcoding the list in every screen.
alter table equipment add column if not exists asset_category text
  generated always as (
    case
      when equipment_type in (
        'RTU','SPLIT_SYSTEM','AHU','FURNACE','BOILER','MAU',
        'EXHAUST_FAN','MINI_SPLIT','HEAT_PUMP','WALK_IN_COOLER',
        'WALK_IN_FREEZER','REACH_IN','CHILLER','COOLING_TOWER',
        'UNIT_HEATER','PTAC','VRF'
      ) then 'hvac'
      when equipment_type in (
        'WATER_HEATER_TANK','WATER_HEATER_TANKLESS','BACKFLOW_PREVENTER',
        'SUMP_PUMP','SEWAGE_EJECTOR_PUMP','GREASE_TRAP','FLOOR_DRAIN',
        'BOOSTER_PUMP','WATER_SOFTENER','MIXING_VALVE','GAS_METER_REGULATOR',
        'FLOOR_HEAT_MANIFOLD'
      ) then 'plumbing'
      else 'other'
    end
  ) stored;

create index if not exists idx_equipment_asset_category on equipment(asset_category);
