-- ============================================================
-- 07: ICE MACHINES + REMOTE CONDENSING UNITS
-- Run after 06_manual_ordering.sql
-- These task lists already existed in checklists.ts but the
-- equipment type was never added to the database — this closes
-- that gap so they're selectable when adding equipment.
-- ============================================================

alter table equipment drop constraint if exists equipment_equipment_type_check;

alter table equipment add constraint equipment_equipment_type_check check (
  equipment_type in (
    -- HVAC / Refrigeration
    'RTU','SPLIT_SYSTEM','AHU','FURNACE','BOILER','MAU',
    'EXHAUST_FAN','MINI_SPLIT','HEAT_PUMP','WALK_IN_COOLER',
    'WALK_IN_FREEZER','REACH_IN','CHILLER','COOLING_TOWER',
    'UNIT_HEATER','PTAC','VRF','ICE_MACHINE','CONDENSING_UNIT',
    -- Plumbing / Gas
    'WATER_HEATER_TANK','WATER_HEATER_TANKLESS','BACKFLOW_PREVENTER',
    'SUMP_PUMP','SEWAGE_EJECTOR_PUMP','GREASE_TRAP','FLOOR_DRAIN',
    'BOOSTER_PUMP','WATER_SOFTENER','MIXING_VALVE','GAS_METER_REGULATOR',
    'FLOOR_HEAT_MANIFOLD',
    'OTHER'
  )
);

-- Refresh the generated asset_category column's logic to include the
-- two new HVAC types (Postgres requires dropping + recreating a
-- generated column to change its expression).
alter table equipment drop column if exists asset_category;
alter table equipment add column asset_category text
  generated always as (
    case
      when equipment_type in (
        'RTU','SPLIT_SYSTEM','AHU','FURNACE','BOILER','MAU',
        'EXHAUST_FAN','MINI_SPLIT','HEAT_PUMP','WALK_IN_COOLER',
        'WALK_IN_FREEZER','REACH_IN','CHILLER','COOLING_TOWER',
        'UNIT_HEATER','PTAC','VRF','ICE_MACHINE','CONDENSING_UNIT'
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
