import type { EquipmentType, Season, MaintenanceTier, MaintenanceTask } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// TIER LOGIC
// minTier: 3 = Bronze/Basic (all tiers perform this task)
// minTier: 2 = Silver/Standard and Gold/Premium only
// minTier: 1 = Gold/Premium only
//
// getChecklist filters: tasks.filter(t => t.minTier >= tier)
//   - Tier 1 (Gold):   includes minTier 1, 2, 3  (all tasks)
//   - Tier 2 (Silver): includes minTier 2, 3      (silver + bronze tasks)
//   - Tier 3 (Bronze): includes minTier 3 only    (basic tasks only)
// ─────────────────────────────────────────────────────────────────────────────

export const TIER_DESCRIPTIONS = {
  1: {
    label: 'Gold — Premium',
    description: 'Maximum lifespan, peak efficiency, full documentation. Combustion analysis, refrigerant system analysis, water chemistry, borescope inspection, vibration analysis. Recommended for commercial, industrial, and condo programs.',
    color: '#b1a55a',
  },
  2: {
    label: 'Silver — Standard',
    description: 'Core seasonal maintenance with measurements, cleaning, and component-level inspection. Suitable for most commercial equipment.',
    color: '#9e9e9e',
  },
  3: {
    label: 'Bronze — Basic',
    description: 'Essential safety and reliability tasks. Filter service, visual inspection, operational test. Minimum recommended maintenance.',
    color: '#cd7f32',
  },
} as const


// ─────────────────────────────────────────────────────────────────────────────
// ROOFTOP UNITS (RTU) — Gas/Electric Packaged Units & Heat Pump RTUs
// ─────────────────────────────────────────────────────────────────────────────

const RTU_SPRING: MaintenanceTask[] = [
  // Bronze — all tiers
  { id: 'filter_inspect_replace', description: 'Inspect and replace air filter(s) — record size, MERV rating, and condition', category: 'filter', minTier: 3 },
  { id: 'unit_exterior_inspect', description: 'Inspect unit exterior, panels, fasteners, and cabinet for damage or corrosion', category: 'general', minTier: 3 },
  { id: 'condenser_coil_inspect', description: 'Inspect condenser coil for physical damage, fin damage, or blockage', category: 'coil', minTier: 3 },
  { id: 'cooling_operation_test', description: 'Test cooling operation — verify unit starts, runs, and reaches setpoint', category: 'controls', minTier: 3 },
  { id: 'heat_lockout_verify', description: 'Verify heat section is locked out or set to cooling mode for the season', category: 'safety', minTier: 3 },
  // Silver — Silver and Gold
  { id: 'condenser_coil_wash', description: 'Wash condenser coil with approved coil cleaner — rinse thoroughly; straighten bent fins with fin comb', category: 'coil', minTier: 2 },
  { id: 'condenser_fan_amps', description: 'Record condenser fan motor amperage on all legs — compare to nameplate FLA', category: 'electrical', minTier: 2, hasDataEntry: true, dataHint: 'L1, L2 amps (A)' },
  { id: 'supply_fan_amps', description: 'Record supply/return fan motor amperage on all legs — compare to nameplate FLA', category: 'electrical', minTier: 2, hasDataEntry: true, dataHint: 'L1, L2, L3 amps (A)' },
  { id: 'refrigerant_pressures', description: 'Check and record refrigerant suction and discharge pressures during steady-state operation', category: 'refrigeration', minTier: 2, hasDataEntry: true, dataHint: 'Suction psig / Discharge psig' },
  { id: 'belts_pulleys_inspect', description: 'Inspect V-belts for cracking, glazing, fraying — check tension (max 1/2" deflection per foot of span); replace if worn', category: 'mechanical', minTier: 2 },
  { id: 'electrical_connections', description: 'Check all electrical connections — tighten loose terminals; inspect for heat damage, arcing, or corrosion', category: 'electrical', minTier: 2 },
  { id: 'condensate_drain_flush', description: 'Clean condensate drain pan — flush drain line with water and diluted bleach; verify flow; treat pan with algaecide tablet', category: 'general', minTier: 2 },
  { id: 'economizer_inspect', description: 'Inspect economizer dampers and actuator — verify dampers open/close fully; clean linkage; check barometric relief', category: 'controls', minTier: 2 },
  { id: 'temp_differential_cooling', description: 'Measure supply and return air temperature differential — should be 15–22°F for cooling; record both temps', category: 'controls', minTier: 2, hasDataEntry: true, dataHint: 'Supply °F / Return °F' },
  // Gold only
  { id: 'evaporator_coil_clean', description: 'Clean evaporator coil with non-acidic coil cleaner — rinse thoroughly; inspect for icing or damage', category: 'coil', minTier: 1 },
  { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks using electronic leak detector — inspect all Schrader valves, brazed joints, and service ports', category: 'refrigeration', minTier: 1 },
  { id: 'superheat_subcooling', description: 'Measure and record superheat (target 8–15°F fixed orifice; 8–12°F TXV) and subcooling (target 8–15°F)', category: 'refrigeration', minTier: 1, hasDataEntry: true, dataHint: 'Superheat °F / Subcooling °F' },
  { id: 'capacitors_check', description: 'Check run and start capacitors with capacitor tester — record µF reading; replace if outside ±6% of rated value', category: 'electrical', minTier: 1, hasDataEntry: true, dataHint: 'µF reading' },
  { id: 'contactor_inspect', description: 'Inspect contactor points — replace if pitted, burned, or stuck; check coil voltage', category: 'electrical', minTier: 1 },
  { id: 'bearings_lubricate', description: 'Lubricate fan bearings through Zerk fittings with manufacturer-specified grease — do not over-grease', category: 'mechanical', minTier: 1 },
  { id: 'voltage_record', description: 'Record line voltage at all three legs (L1-L2, L2-L3, L1-L3) — phase imbalance must be less than 2%', category: 'electrical', minTier: 1, hasDataEntry: true },
  { id: 'total_static_pressure', description: 'Measure total external static pressure (TESP) — compare to unit nameplate max (typically 0.5–1.0" W.C.)', category: 'controls', minTier: 1, hasDataEntry: true, dataHint: 'Supply " W.C. / Return " W.C.' },
]

const RTU_SUMMER: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Inspect and replace filters — record size, MERV, and condition', category: 'filter', minTier: 3 },
  { id: 'visual_inspection', description: 'Visual inspection of unit — panels, coils, wiring, condensate pan', category: 'general', minTier: 3 },
  { id: 'cooling_operation_verify', description: 'Verify cooling is operating and reaching setpoint — check for complaints or fault codes', category: 'controls', minTier: 3 },
  { id: 'refrigerant_pressures', description: 'Check and record refrigerant suction and discharge pressures at steady-state', category: 'refrigeration', minTier: 2, hasDataEntry: true },
  { id: 'condenser_fan_amps', description: 'Record condenser fan motor amperage — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'supply_fan_amps', description: 'Record supply fan motor amperage — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'condenser_coil_clean', description: 'Clean condenser coil if dirty — wash with coil cleaner and rinse', category: 'coil', minTier: 2 },
  { id: 'economizer_check', description: 'Check economizer damper operation — verify minimum position; check controls', category: 'controls', minTier: 2 },
  { id: 'condensate_drain_check', description: 'Check condensate drain line — flush if sluggish; confirm drain pan is clean', category: 'general', minTier: 2 },
  { id: 'temp_differential', description: 'Measure supply and return air temperature differential — record both temps', category: 'controls', minTier: 2, hasDataEntry: true },
  { id: 'superheat_subcooling', description: 'Measure superheat and subcooling — compare to manufacturer specs and refrigerant type', category: 'refrigeration', minTier: 1, hasDataEntry: true },
  { id: 'evaporator_coil_inspect', description: 'Inspect evaporator coil — clean if dirty; look for icing pattern indicating airflow or refrigerant issues', category: 'coil', minTier: 1 },
  { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks at all connections and service ports', category: 'refrigeration', minTier: 1 },
  { id: 'electrical_connections', description: 'Check all electrical connections; inspect control board for fault codes', category: 'electrical', minTier: 1 },
  { id: 'voltage_record', description: 'Record line voltage on all three legs — check phase imbalance', category: 'electrical', minTier: 1, hasDataEntry: true },
]

const RTU_FALL: MaintenanceTask[] = [
  // Bronze
  { id: 'filter_inspect_replace', description: 'Inspect and replace air filter(s) — record size, MERV, and condition', category: 'filter', minTier: 3 },
  { id: 'heating_operation_test', description: 'Test heating operation — verify ignition occurs and unit reaches heating setpoint', category: 'controls', minTier: 3 },
  { id: 'ignition_test', description: 'Perform ignition test — verify clean ignition within first trial; observe flame characteristics', category: 'combustion', minTier: 3 },
  { id: 'visual_inspection', description: 'Visual inspection of unit — check for physical damage, animal intrusion, debris accumulation', category: 'general', minTier: 3 },
  // Silver
  { id: 'burners_clean', description: 'Remove and clean burner assembly — clear ports with compressed air; inspect for corrosion or warping', category: 'combustion', minTier: 2 },
  { id: 'igniter_test', description: 'Inspect hot surface igniter — measure resistance (Silicon Carbide: 40–75 Ω; Silicon Nitride: 20–50 Ω); replace if cracked or out of spec', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'Resistance Ω' },
  { id: 'flame_sensor_clean', description: 'Clean flame sensor rod with fine emery cloth — measure microamp signal (minimum 1.5 µA; replace if below 0.5 µA)', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'µA reading' },
  { id: 'heat_exchanger_inspect', description: 'Inspect heat exchanger for cracks, holes, or corrosion — perform flame deviation test and visual/mirror inspection', category: 'combustion', minTier: 2 },
  { id: 'gas_pressure_check', description: 'Measure and record manifold gas pressure — NG target: 3.5" W.C. (range 3.2–3.8); LP: 10.0–11.0" W.C.', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'Manifold pressure " W.C.' },
  { id: 'flue_venting_inspect', description: 'Inspect flue and vent connection — check for corrosion, separation, proper slope; clear of obstructions', category: 'combustion', minTier: 2 },
  { id: 'supply_fan_amps', description: 'Record supply fan motor amperage — compare to nameplate FLA', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'temp_rise_measure', description: 'Measure temperature rise — record supply and return air temps; compare rise to nameplate range (typical 40–70°F)', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'Supply °F / Return °F' },
  { id: 'limit_switch_test', description: 'Test high-limit switch — verify continuity at room temp; confirm unit shuts down on over-temp condition', category: 'safety', minTier: 2 },
  { id: 'pressure_switch_test', description: 'Test pressure switch(es) — verify hose is clear; measure differential pressure; confirm switch closes during inducer operation', category: 'safety', minTier: 2 },
  { id: 'economizer_winter_prep', description: 'Inspect economizer — verify dampers close fully for winter; check freeze stat setting; clean damper blades', category: 'controls', minTier: 2 },
  { id: 'electrical_connections', description: 'Check all electrical connections — tighten; inspect control board for fault codes', category: 'electrical', minTier: 2 },
  // Gold
  { id: 'combustion_analysis', description: 'Combustion analysis — record CO ppm (air-free <100 ppm), CO2 (8–10%), O2 (4–8%), flue temp, efficiency (%)', category: 'combustion', minTier: 1, hasDataEntry: true, dataHint: 'CO ppm / CO2% / O2% / Flue temp °F / Efficiency %' },
  { id: 'borescope_heat_exchanger', description: 'Borescope inspection of heat exchanger internal surfaces — photograph any cracks or corrosion', category: 'combustion', minTier: 1 },
  { id: 'gas_leak_check', description: 'Check all gas connections for leaks using electronic combustible gas detector — from shutoff valve through burner manifold', category: 'safety', minTier: 1 },
  { id: 'freeze_stat_test', description: 'Test freeze stat — verify setpoint is correct (typically 38°F/3°C); confirm unit shuts down on low-temp trip', category: 'safety', minTier: 1 },
  { id: 'total_static_pressure', description: 'Measure total external static pressure — compare to nameplate max', category: 'controls', minTier: 1, hasDataEntry: true },
  { id: 'voltage_record', description: 'Record line voltage on all three legs — check phase imbalance (must be <2%)', category: 'electrical', minTier: 1, hasDataEntry: true },
  { id: 'cooling_lockout_verify', description: 'Verify cooling circuit is locked out or disabled for heating season where applicable', category: 'safety', minTier: 1 },
]

const RTU_WINTER: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Inspect and replace filters — check for icing on filter face indicating airflow restriction', category: 'filter', minTier: 3 },
  { id: 'verify_heating_operation', description: 'Verify heating is operating correctly — confirm ignition and setpoint being reached', category: 'controls', minTier: 3 },
  { id: 'snow_ice_clearance', description: 'Inspect unit for snow/ice accumulation — clear debris from condenser, economizer intake, and flue termination', category: 'general', minTier: 3 },
  { id: 'burner_operation_check', description: 'Check burner flame — should be steady and blue; yellow/lazy flames indicate combustion issue', category: 'combustion', minTier: 2 },
  { id: 'gas_pressure_check', description: 'Check manifold gas pressure — verify within specification', category: 'combustion', minTier: 2, hasDataEntry: true },
  { id: 'flue_ice_check', description: 'Check flue and condensate drain for ice blockage — critical at -40°C', category: 'combustion', minTier: 2 },
  { id: 'economizer_freeze_check', description: 'Verify economizer dampers are closed or at minimum position — check freeze protection controls', category: 'controls', minTier: 2 },
  { id: 'supply_fan_amps', description: 'Record supply fan motor amperage — compare to nameplate', category: 'electrical', minTier: 1, hasDataEntry: true },
  { id: 'temp_rise_measure', description: 'Measure and record temperature rise across heat exchanger', category: 'combustion', minTier: 1, hasDataEntry: true },
  { id: 'freeze_stat_verify', description: 'Verify freeze stat setpoint — confirm freeze protection is active', category: 'safety', minTier: 1 },
  { id: 'heating_sequence_test', description: 'Test full heating sequence — stages 1 and 2 if multi-stage; verify proper staging operation', category: 'controls', minTier: 1 },
]


// ─────────────────────────────────────────────────────────────────────────────
// GAS FURNACES — 80% AFUE and 90%+ Condensing
// ─────────────────────────────────────────────────────────────────────────────

const FURNACE_FALL: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Inspect and replace air filter — record size, MERV rating, and condition', category: 'filter', minTier: 3 },
  { id: 'heating_operation_test', description: 'Test heating — verify ignition and system reaches setpoint', category: 'controls', minTier: 3 },
  { id: 'ignition_test', description: 'Ignition test — verify clean, reliable ignition on first or second trial', category: 'combustion', minTier: 3 },
  { id: 'co_detector_check', description: 'Test CO detector — verify operation; replace batteries; advise client if no detector present', category: 'safety', minTier: 3 },
  { id: 'flue_vent_inspect', description: 'Inspect flue/vent connector — check slope, secure joints, no corrosion; 90%+ furnaces: inspect PVC for joint integrity, proper slope back to furnace', category: 'combustion', minTier: 3 },
  // Silver
  { id: 'burners_clean', description: 'Remove and clean burner assembly — clear ports with compressed air; inspect for corrosion or misalignment', category: 'combustion', minTier: 2 },
  { id: 'igniter_test', description: 'Test hot surface igniter — measure resistance (Si Carbide: 40–75 Ω; Si Nitride: 20–50 Ω); OL/open = failed', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'Resistance Ω' },
  { id: 'flame_sensor_clean', description: 'Clean flame sensor with fine emery cloth — measure microamp signal (minimum 1.5 µA in operation)', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'µA reading' },
  { id: 'heat_exchanger_inspect', description: 'Inspect heat exchanger — mirror/flashlight visual; flame deviation test with blower running; look for cracks, rust perforations', category: 'combustion', minTier: 2 },
  { id: 'gas_pressure_manifold', description: 'Measure manifold gas pressure — NG: 3.5" W.C. (range 3.2–3.8"); LP: 10.0–11.0" W.C.', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'Manifold " W.C. / Inlet " W.C.' },
  { id: 'temp_rise', description: 'Measure temperature rise — supply air temp minus return air temp; compare to nameplate range (typically 35–70°F)', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'Supply °F / Return °F' },
  { id: 'blower_clean_inspect', description: 'Inspect blower wheel — clean if dirty (even slight buildup reduces airflow significantly); check housing for corrosion', category: 'mechanical', minTier: 2 },
  { id: 'blower_motor_amps', description: 'Record blower motor amperage — compare to nameplate FLA; PSC: at or below FLA; ECM: check programmed speed', category: 'electrical', minTier: 2, hasDataEntry: true, dataHint: 'Amperage (A)' },
  { id: 'pressure_switch_test', description: 'Test pressure switch — inspect hose for cracks/blockage; measure differential pressure; confirm switch closes during inducer operation', category: 'safety', minTier: 2 },
  { id: 'limit_switch_test', description: 'Test high-limit switch — verify continuity at room temp; trip setpoint should match unit label (typically 140–200°F)', category: 'safety', minTier: 2 },
  { id: 'rollout_switch_inspect', description: 'Inspect rollout switch(es) — verify continuity; look for burn marks indicating prior trips (do not reset without finding cause)', category: 'safety', minTier: 2 },
  { id: 'inducer_motor_inspect', description: 'Inspect draft inducer motor — clean wheel if accessible; check bearings for noise; verify condensate ports clear on condensing units', category: 'mechanical', minTier: 2 },
  { id: 'electrical_connections', description: 'Check all electrical connections — high voltage and low voltage; inspect control board for error codes', category: 'electrical', minTier: 2 },
  { id: 'condensate_flush', description: 'Condensing furnaces: flush condensate trap and drain line — clear sediment; verify slope to drain; check neutralizer media', category: 'general', minTier: 2 },
  // Gold
  { id: 'combustion_analysis', description: 'Combustion analysis — record CO air-free (<100 ppm; >400 ppm = urgent), CO2 (8–10%), O2 (4–8%), stack temp, efficiency (%)', category: 'combustion', minTier: 1, hasDataEntry: true, dataHint: 'CO ppm / CO2% / O2% / Stack temp °F / Efficiency %' },
  { id: 'borescope_heat_exchanger', description: 'Borescope inspection of heat exchanger internal surfaces — photograph condition; document any cracks or corrosion', category: 'combustion', minTier: 1 },
  { id: 'gas_leak_check', description: 'Electronic gas leak check — all connections from shutoff valve through manifold; document any leaks found', category: 'safety', minTier: 1 },
  { id: 'gas_inlet_pressure', description: 'Measure supply (inlet) gas pressure at gas valve inlet port — NG: min 5.0" W.C.; LP: min 11.0" W.C.; test static and dynamic', category: 'combustion', minTier: 1, hasDataEntry: true },
  { id: 'total_static_pressure', description: 'Measure total external static pressure (TESP) — supply and return plenum; compare to nameplate max (typically 0.5" W.C.)', category: 'controls', minTier: 1, hasDataEntry: true },
  { id: 'co_occupied_space', description: 'Measure CO in occupied space near supply registers — any reading above 9 ppm requires immediate investigation', category: 'safety', minTier: 1, hasDataEntry: true, dataHint: 'CO ppm in occupied space' },
  { id: 'secondary_heat_exchanger', description: 'Condensing furnaces: inspect secondary (condensing) heat exchanger — look for corrosion, scale, or pitting', category: 'combustion', minTier: 1 },
]

const FURNACE_WINTER: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Inspect and replace filter — mid-season check during heavy heating use', category: 'filter', minTier: 3 },
  { id: 'verify_heating', description: 'Verify furnace is heating properly — no fault codes, reaching setpoint', category: 'controls', minTier: 3 },
  { id: 'burner_flame_check', description: 'Check burner flame appearance — should be steady blue; yellow/lazy = combustion issue', category: 'combustion', minTier: 2 },
  { id: 'flue_check', description: 'Check flue for ice blockage (condensing: PVC vent termination) — critical at -40°C', category: 'combustion', minTier: 2 },
  { id: 'condensate_drain_check', description: 'Condensing furnaces: verify condensate drain is flowing and not frozen', category: 'general', minTier: 2 },
  { id: 'gas_pressure_check', description: 'Check manifold gas pressure', category: 'combustion', minTier: 1, hasDataEntry: true },
  { id: 'blower_motor_amps', description: 'Record blower motor amperage', category: 'electrical', minTier: 1, hasDataEntry: true },
  { id: 'temp_rise', description: 'Measure temperature rise — compare to nameplate', category: 'combustion', minTier: 1, hasDataEntry: true },
  { id: 'co_spot_check', description: 'Spot CO measurement in occupied space near registers — address any reading above 9 ppm immediately', category: 'safety', minTier: 1, hasDataEntry: true },
]

const FURNACE_SPRING: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Inspect and replace filter after heating season', category: 'filter', minTier: 3 },
  { id: 'switch_cooling_mode', description: 'Switch system to cooling/fan-only mode — test fan operation; verify thermostat switchover', category: 'controls', minTier: 3 },
  { id: 'blower_wheel_inspect', description: 'Inspect blower wheel — clean after heating season if dirty', category: 'mechanical', minTier: 2 },
  { id: 'blower_motor_amps', description: 'Record blower motor amperage in cooling/fan mode', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'condensate_flush_spring', description: 'Condensing furnaces: flush condensate trap and drain — post-season cleaning; replace neutralizer media if depleted', category: 'general', minTier: 2 },
  { id: 'evaporator_coil_inspect', description: 'If paired with AC coil: inspect evaporator coil, clean drain pan, flush condensate drain with dilute bleach', category: 'coil', minTier: 2 },
  { id: 'heating_lockout_verify', description: 'Verify heating is locked out or disabled for the cooling season', category: 'safety', minTier: 2 },
  { id: 'electrical_connections', description: 'Check all electrical connections after heating season', category: 'electrical', minTier: 1 },
  { id: 'total_static_pressure', description: 'Measure TESP in cooling mode — verify adequate airflow for cooling (approx 400 CFM/ton)', category: 'controls', minTier: 1, hasDataEntry: true },
]

const FURNACE_SUMMER: MaintenanceTask[] = [
  { id: 'filter_inspect', description: 'Check filter condition — replace if dirty from cooling season operation', category: 'filter', minTier: 3 },
  { id: 'blower_operation_verify', description: 'Verify blower is operating correctly with cooling system', category: 'controls', minTier: 3 },
  { id: 'blower_motor_amps', description: 'Record blower motor amperage during cooling operation', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'condensate_drain_check', description: 'Check condensate drain from evaporator coil — flush if sluggish; inspect pan for standing water or mold', category: 'general', minTier: 2 },
  { id: 'evap_coil_inspect', description: 'Inspect evaporator coil — look for icing, blockage, or mold growth on coil face', category: 'coil', minTier: 1 },
]


// ─────────────────────────────────────────────────────────────────────────────
// SPLIT SYSTEM AIR CONDITIONERS & HEAT PUMPS
// ─────────────────────────────────────────────────────────────────────────────

const SPLIT_SPRING: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Inspect and replace indoor air filter(s)', category: 'filter', minTier: 3 },
  { id: 'cooling_operation_test', description: 'Test cooling operation — verify unit starts and cools', category: 'controls', minTier: 3 },
  { id: 'outdoor_unit_inspect', description: 'Inspect outdoor unit — clear debris, straighten fins, check clearances', category: 'general', minTier: 3 },
  { id: 'condenser_coil_wash', description: 'Wash condenser coil — apply coil cleaner, rinse from inside out with water', category: 'coil', minTier: 2 },
  { id: 'refrigerant_pressures', description: 'Check refrigerant suction and discharge pressures at steady state', category: 'refrigeration', minTier: 2, hasDataEntry: true },
  { id: 'condenser_fan_amps', description: 'Record condenser fan motor amperage — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'indoor_blower_amps', description: 'Record indoor blower motor amperage — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'condensate_drain_flush', description: 'Flush condensate drain pan and drain line — treat with algaecide; verify float switch', category: 'general', minTier: 2 },
  { id: 'electrical_connections', description: 'Check all electrical connections at both indoor and outdoor units', category: 'electrical', minTier: 2 },
  { id: 'temp_differential', description: 'Measure supply and return air temperature differential (target 15–22°F for cooling)', category: 'controls', minTier: 2, hasDataEntry: true },
  { id: 'superheat_subcooling', description: 'Measure superheat (8–15°F fixed orifice; 8–12°F TXV) and subcooling (8–15°F) — confirm proper refrigerant charge', category: 'refrigeration', minTier: 1, hasDataEntry: true },
  { id: 'evaporator_coil_clean', description: 'Clean indoor evaporator coil with approved coil cleaner — rinse thoroughly', category: 'coil', minTier: 1 },
  { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks at all connections, service ports, and brazed joints', category: 'refrigeration', minTier: 1 },
  { id: 'capacitors_check', description: 'Check run and start capacitors — record µF; replace if outside ±6% of rating', category: 'electrical', minTier: 1, hasDataEntry: true },
  { id: 'voltage_record', description: 'Record line voltage — check for low voltage or phase imbalance', category: 'electrical', minTier: 1, hasDataEntry: true },
]

const SPLIT_FALL: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Inspect and replace indoor air filter(s)', category: 'filter', minTier: 3 },
  { id: 'heating_operation_test', description: 'Test heating operation (electric heat strips or heat pump heating mode)', category: 'controls', minTier: 3 },
  { id: 'outdoor_unit_inspect', description: 'Inspect outdoor unit — check clearances; ensure no debris buildup', category: 'general', minTier: 3 },
  { id: 'defrost_system_test', description: 'Heat pump: test defrost cycle operation — verify defrost board initiates and terminates properly', category: 'controls', minTier: 2 },
  { id: 'refrigerant_pressures', description: 'Check refrigerant pressures in heating mode — verify within spec for ambient temperature', category: 'refrigeration', minTier: 2, hasDataEntry: true },
  { id: 'crankcase_heater_check', description: 'Heat pump: verify crankcase heater is energized when compressor is off — prevents liquid slugging', category: 'electrical', minTier: 2 },
  { id: 'reversing_valve_test', description: 'Heat pump: test reversing valve — verify switchover from cooling to heating mode', category: 'controls', minTier: 2 },
  { id: 'indoor_blower_amps', description: 'Record indoor blower motor amperage in heating mode', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'electrical_connections', description: 'Check all electrical connections at both units', category: 'electrical', minTier: 1 },
  { id: 'voltage_record', description: 'Record line voltage and compare to nameplate', category: 'electrical', minTier: 1, hasDataEntry: true },
]

const SPLIT_SUMMER: MaintenanceTask[] = [
  { id: 'filter_inspect', description: 'Check and replace filter mid-season if dirty', category: 'filter', minTier: 3 },
  { id: 'cooling_verify', description: 'Verify cooling operation — check setpoint is being maintained', category: 'controls', minTier: 3 },
  { id: 'refrigerant_pressures', description: 'Spot-check refrigerant pressures — verify system is holding charge from spring', category: 'refrigeration', minTier: 2, hasDataEntry: true },
  { id: 'condensate_check', description: 'Check condensate drain — flush if needed; clear any blockage', category: 'general', minTier: 2 },
  { id: 'temp_differential', description: 'Measure supply/return temperature differential — verify cooling performance', category: 'controls', minTier: 1, hasDataEntry: true },
]

const SPLIT_WINTER: MaintenanceTask[] = [
  { id: 'filter_inspect', description: 'Check and replace filter', category: 'filter', minTier: 3 },
  { id: 'heating_verify', description: 'Verify heating operation — unit reaching setpoint', category: 'controls', minTier: 3 },
  { id: 'outdoor_unit_inspect', description: 'Inspect outdoor unit — clear snow/ice from top and sides; verify airflow is not blocked', category: 'general', minTier: 2 },
  { id: 'defrost_operation', description: 'Heat pump: verify defrost cycles are occurring appropriately — look for excessive ice buildup', category: 'controls', minTier: 2 },
  { id: 'crankcase_heater_check', description: 'Heat pump: verify crankcase heater is energized when compressor is off', category: 'electrical', minTier: 1 },
  { id: 'indoor_blower_amps', description: 'Record indoor blower amperage in heating mode', category: 'electrical', minTier: 1, hasDataEntry: true },
]


// ─────────────────────────────────────────────────────────────────────────────
// AIR HANDLER UNITS (AHU)
// ─────────────────────────────────────────────────────────────────────────────

const AHU_TASKS = (season: Season): MaintenanceTask[] => {
  const base: MaintenanceTask[] = [
    { id: 'filter_inspect_replace', description: 'Inspect and replace all filters — record sizes, MERV ratings, and condition', category: 'filter', minTier: 3 },
    { id: 'visual_inspection', description: 'Visual inspection of unit — check coils, fans, wiring, and insulation', category: 'general', minTier: 3 },
    { id: 'supply_fan_amps', description: 'Record supply fan motor amperage — compare to nameplate FLA', category: 'electrical', minTier: 2, hasDataEntry: true },
    { id: 'belts_pulleys_inspect', description: 'Inspect belts for cracking/glazing; check tension (max 1/2" deflection per foot); inspect sheave condition', category: 'mechanical', minTier: 2 },
    { id: 'coil_inspect_clean', description: 'Inspect coil — clean with approved coil cleaner if dirty; straighten bent fins', category: 'coil', minTier: 2 },
    { id: 'drain_pan_clean', description: 'Inspect and clean drain pan — flush drain line; treat with algaecide tablet', category: 'general', minTier: 2 },
    { id: 'electrical_connections', description: 'Check all electrical connections — inspect control board for fault codes', category: 'electrical', minTier: 2 },
    { id: 'dampers_check', description: 'Inspect all dampers — verify full travel; check actuator operation and linkage', category: 'controls', minTier: 2 },
    { id: 'bearings_lubricate', description: 'Lubricate fan shaft bearings through Zerk fittings — use manufacturer-specified grease; do not over-grease', category: 'mechanical', minTier: 1 },
    { id: 'voltage_record', description: 'Record line voltage on all legs', category: 'electrical', minTier: 1, hasDataEntry: true },
    { id: 'total_static_pressure', description: 'Measure total external static pressure — compare to design spec', category: 'controls', minTier: 1, hasDataEntry: true },
    { id: 'vibration_check', description: 'Check for vibration at fan bearings and motor mounts — excessive vibration indicates bearing wear or imbalance', category: 'mechanical', minTier: 1 },
  ]
  if (season === 'fall' || season === 'winter') {
    base.push(
      { id: 'heating_coil_inspect', description: 'Inspect hot water heating coil — check for leaks; verify valve opens fully on call for heat', category: 'combustion', minTier: 2 },
      { id: 'freeze_stat_test', description: 'Test freeze stat — verify setpoint (typically 38°F/3°C) and that it shuts off AHU on low-temp condition', category: 'safety', minTier: 1 }
    )
  }
  return base
}


// ─────────────────────────────────────────────────────────────────────────────
// MINI-SPLIT / DUCTLESS SYSTEMS (Mitsubishi, Daikin, Fujitsu, LG, Samsung)
// ─────────────────────────────────────────────────────────────────────────────

const MINI_SPLIT_TASKS = (season: Season): MaintenanceTask[] => {
  const base: MaintenanceTask[] = [
    { id: 'indoor_filter_clean', description: 'Remove and clean indoor unit washable filters — rinse with warm water; allow to dry completely before reinstalling', category: 'filter', minTier: 3 },
    { id: 'indoor_unit_clean', description: 'Wipe down indoor unit exterior and louvers — check for mold or dust on internal surfaces', category: 'general', minTier: 3 },
    { id: 'operation_test', description: 'Test all operating modes on remote — cooling, heating, fan, dry — verify unit responds correctly', category: 'controls', minTier: 3 },
    { id: 'outdoor_unit_inspect', description: 'Inspect outdoor unit — clear debris, leaves, and vegetation from coil; check clearances', category: 'general', minTier: 3 },
    { id: 'evaporator_coil_clean', description: 'Clean indoor evaporator coil — use approved foam cleaner; wipe down coil face; clean drain pan', category: 'coil', minTier: 2 },
    { id: 'condensate_drain_check', description: 'Check condensate drain — flush with water; ensure proper slope and free drainage', category: 'general', minTier: 2 },
    { id: 'condenser_coil_clean', description: 'Clean outdoor condenser coil — rinse with water (no pressure washer); inspect fins', category: 'coil', minTier: 2 },
    { id: 'refrigerant_pressures', description: 'Check refrigerant pressures — verify within manufacturer specification', category: 'refrigeration', minTier: 2, hasDataEntry: true },
    { id: 'electrical_connections', description: 'Check electrical connections at indoor and outdoor units — inspect for heat damage or corrosion', category: 'electrical', minTier: 2 },
    { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks at linesets, service ports, and flare connections', category: 'refrigeration', minTier: 1 },
    { id: 'capacitors_check', description: 'Check capacitors — replace if outside rated value', category: 'electrical', minTier: 1 },
    { id: 'error_code_check', description: 'Read diagnostic/error code history from unit controller — document any stored fault codes', category: 'controls', minTier: 1 },
  ]
  if (season === 'fall' || season === 'winter') {
    base.push(
      { id: 'defrost_operation', description: 'Verify defrost operation — confirm defrost initiates appropriately at low ambient temperatures', category: 'controls', minTier: 2 },
      { id: 'drain_pan_heater', description: 'Verify drain pan heater is operational — prevents drain pan freezing at low ambient (critical at -40°C)', category: 'safety', minTier: 2 },
    )
  }
  return base
}


// ─────────────────────────────────────────────────────────────────────────────
// MAKE-UP AIR UNITS (MAU) — Engineered Air, Nortek, Cambridge
// ─────────────────────────────────────────────────────────────────────────────

const MAU_FALL: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Replace all supply air filters — record type (2" or 4" pleated/bag), size, and MERV rating', category: 'filter', minTier: 3 },
  { id: 'heating_test', description: 'Test heating operation — verify ignition, modulation, and setpoint achievement', category: 'controls', minTier: 3 },
  { id: 'ignition_test', description: 'Ignition test — verify clean ignition; observe flame characteristics at startup', category: 'combustion', minTier: 3 },
  { id: 'belt_inspect', description: 'Inspect belt drives — check tension (max 1/2" deflection per foot), alignment with straightedge; replace all belts together if replacing any', category: 'mechanical', minTier: 2 },
  { id: 'bearings_lubricate', description: 'Lubricate fan and motor bearings per manufacturer schedule — use specified grease type and quantity; do not over-grease', category: 'mechanical', minTier: 2 },
  { id: 'fan_inspect', description: 'Inspect fan wheel and housing — clean grease and dirt; check for imbalance or damage', category: 'mechanical', minTier: 2 },
  { id: 'motor_amps', description: 'Record supply fan motor amperage — compare to nameplate FLA; check for abnormal vibration or heat', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'gas_train_leak_test', description: 'Leak test all gas connections with electronic sniffer or solution — from manual shutoff through burner manifold', category: 'combustion', minTier: 2 },
  { id: 'ignition_electrode', description: 'Inspect and clean ignition electrode — check ceramic insulator; set gap per manufacturer spec; verify spark quality', category: 'combustion', minTier: 2 },
  { id: 'flame_sensor', description: 'Clean flame sensor — verify signal strength; check operation', category: 'combustion', minTier: 2 },
  { id: 'safeties_test', description: 'Test all safety interlocks: high-temp limit, freeze stat, sail switch (airflow proving), gas pressure switches', category: 'safety', minTier: 2 },
  { id: 'mixing_box_dampers', description: 'Inspect mixing box (economizer) dampers and actuators — verify full travel, clean linkage, check for damage', category: 'controls', minTier: 2 },
  { id: 'gas_pressure_check', description: 'Check manifold gas pressure — NG: 3.5" W.C. typical; LP: 10.0–11.0" W.C.; adjust modulating valve if equipped', category: 'combustion', minTier: 2, hasDataEntry: true },
  { id: 'electrical_connections', description: 'Check all electrical connections in control panel — inspect for heat damage, corrosion, loose terminals', category: 'electrical', minTier: 2 },
  { id: 'combustion_analysis', description: 'Combustion analysis — CO (<100 ppm air-free), CO2 (8–10%), O2 (4–8%), efficiency; direct-fire MAU: verify CO at discharge plenum (<10 ppm)', category: 'combustion', minTier: 1, hasDataEntry: true },
  { id: 'heat_exchanger_inspect', description: 'Indirect-fired MAU: inspect heat exchanger for cracks, holes, or soot on air side indicating breach', category: 'combustion', minTier: 1 },
  { id: 'burner_inspect', description: 'Direct-fired MAU: inspect burner manifold ports, burner cone, and flame retention head for blockage or damage', category: 'combustion', minTier: 1 },
  { id: 'discharge_temp', description: 'Measure discharge air temperature under heating load — verify unit capacity matches current building needs', category: 'controls', minTier: 1, hasDataEntry: true },
  { id: 'control_fault_history', description: 'Review controller fault history — document all faults; clear codes after documentation', category: 'controls', minTier: 1 },
]

const MAU_SPRING: MaintenanceTask[] = [
  { id: 'filter_inspect_replace', description: 'Replace all supply air filters', category: 'filter', minTier: 3 },
  { id: 'belt_inspect', description: 'Inspect belt drives — tension and alignment', category: 'mechanical', minTier: 2 },
  { id: 'cooling_test', description: 'Test cooling operation if unit has DX cooling — verify compressor starts, refrigerant circuit operation', category: 'controls', minTier: 2 },
  { id: 'cooling_coil_inspect', description: 'Inspect cooling coil fins — straighten with fin comb; check condensate pan and drain', category: 'coil', minTier: 2 },
  { id: 'economizer_min_pos', description: 'Check economizer damper minimum position — verify minimum outdoor air percentage for ventilation', category: 'controls', minTier: 2 },
  { id: 'refrigerant_pressures', description: 'Check refrigerant pressures — suction and discharge; calculate superheat and subcooling', category: 'refrigeration', minTier: 1, hasDataEntry: true },
  { id: 'motor_amps', description: 'Record fan motor amperage', category: 'electrical', minTier: 1, hasDataEntry: true },
  { id: 'combustion_analysis_spring', description: 'Combustion analysis — verify efficiency has not degraded over winter season', category: 'combustion', minTier: 1, hasDataEntry: true },
]

const MAU_SUMMER: MaintenanceTask[] = [
  { id: 'filter_inspect', description: 'Check and replace filters mid-season', category: 'filter', minTier: 3 },
  { id: 'belt_visual', description: 'Visual inspection of belt condition', category: 'mechanical', minTier: 2 },
  { id: 'motor_amps', description: 'Record fan motor amperage', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'cooling_verify', description: 'Verify cooling operation (if equipped) — check setpoint and refrigerant circuit', category: 'controls', minTier: 2, hasDataEntry: true },
]

const MAU_WINTER: MaintenanceTask[] = [
  { id: 'filter_inspect', description: 'Check filter loading — replace if pressure drop indicates high loading', category: 'filter', minTier: 3 },
  { id: 'heating_verify', description: 'Verify heating operation — confirm ignition, modulation, and setpoint', category: 'controls', minTier: 3 },
  { id: 'flue_check', description: 'Check flue termination for ice blockage — critical at -40°C in Fort McMurray', category: 'combustion', minTier: 2 },
  { id: 'freeze_stat_verify', description: 'Verify freeze stat setpoint and operation — protect heating coil from freezing', category: 'safety', minTier: 2 },
  { id: 'motor_amps', description: 'Record fan motor amperage during winter operation', category: 'electrical', minTier: 1, hasDataEntry: true },
  { id: 'gas_pressure_check', description: 'Check manifold gas pressure', category: 'combustion', minTier: 1, hasDataEntry: true },
  { id: 'combustion_analysis_winter', description: 'Mid-season combustion analysis — verify efficiency has not degraded from soot accumulation', category: 'combustion', minTier: 1, hasDataEntry: true },
]


// ─────────────────────────────────────────────────────────────────────────────
// BOILERS — Gas-Fired Hot Water (Weil-McLain, Burnham, Lochinvar, IBC, Viessmann)
// ─────────────────────────────────────────────────────────────────────────────

const BOILER_FALL: MaintenanceTask[] = [
  { id: 'system_pressure_check', description: 'Check system water pressure — cold fill: 12–18 psi typical; record and compare to previous year', category: 'general', minTier: 3, hasDataEntry: true, dataHint: 'System pressure (psi)' },
  { id: 'relief_valve_test', description: 'Test pressure relief valve — lift lever fully 3–5 seconds; verify discharge and clean reseat; tag with test date; replace if valve weeps after test', category: 'safety', minTier: 3 },
  { id: 'lwco_test', description: 'Test low water cutoff (LWCO) — float type: drain below sight glass and confirm burner shuts off; probe type: lower water level electrically and confirm shutdown', category: 'safety', minTier: 3 },
  { id: 'expansion_tank_inspect', description: 'Inspect expansion tank — tap test for waterlogging (solid = failed bladder); check air pre-charge with system isolated', category: 'mechanical', minTier: 3 },
  { id: 'venting_inspect', description: 'Inspect boiler flue and vent connector — check slope, secure joints, absence of corrosion; clear of obstructions', category: 'combustion', minTier: 3 },
  { id: 'heat_test', description: 'Cycle boiler through full heat call — observe ignition, sequence of operation, and normal shutdown', category: 'controls', minTier: 3 },
  { id: 'burner_clean', description: 'Remove and clean burner assembly — clear ports with compressed air; inspect for scale and corrosion', category: 'combustion', minTier: 2 },
  { id: 'heat_exchanger_clean', description: 'Inspect and clean heat exchanger fire side — remove soot and scale; check for cracking', category: 'combustion', minTier: 2 },
  { id: 'combustion_analysis', description: 'Combustion analysis — O2 (target 3–5%), CO2 (8–10%), CO (<200 ppm air-free; <50 ppm excellent), stack temp, efficiency', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'CO ppm / CO2% / O2% / Stack temp °F / Efficiency %' },
  { id: 'gas_pressure_check', description: 'Verify gas supply pressure at manifold — NG: 3.5" W.C. manifold, 7" W.C. supply typical', category: 'combustion', minTier: 2, hasDataEntry: true },
  { id: 'circulator_pump_check', description: 'Check circulator pump(s) — listen for noise, check seals for leaks, verify rotation, measure amperage', category: 'mechanical', minTier: 2, hasDataEntry: true },
  { id: 'zone_valves_check', description: 'Test all zone valves — verify open/close operation; check for leaks at valve bodies', category: 'controls', minTier: 2 },
  { id: 'electrical_connections', description: 'Check all electrical connections — aquastat, gas valve, igniter, low-voltage controls', category: 'electrical', minTier: 2 },
  { id: 'auto_fill_verify', description: 'Verify auto-fill valve operation — confirm it maintains system pressure; check for continuous fill indicating a leak', category: 'general', minTier: 2 },
  // Gold
  { id: 'lwco_full_inspect', description: 'Full LWCO disassembly — clean float chamber, inspect float for waterlogging, inspect electrical contacts; probe type: clean rod', category: 'safety', minTier: 1 },
  { id: 'water_quality_test', description: 'System water quality test — pH (target 7.5–9.0), inhibitor concentration, hardness, dissolved oxygen; add Fernox F1 or equivalent if inhibitor depleted', category: 'general', minTier: 1, hasDataEntry: true, dataHint: 'pH / Inhibitor level / Conductivity' },
  { id: 'condensate_system', description: 'Condensing boilers: descale stainless heat exchanger with citric acid flush if scale detected; clean condensate trap; replace neutralizer media; verify pH of condensate output (target 6.5–7.0 after neutralization)', category: 'combustion', minTier: 1 },
  { id: 'absa_certificate_check', description: 'Verify ABSA Certificate of Inspection is current (Alberta requirement) — schedule inspection if due', category: 'safety', minTier: 1 },
  { id: 'gas_leak_check', description: 'Electronic gas leak check of all accessible connections from meter through appliance', category: 'safety', minTier: 1 },
]

const BOILER_WINTER: MaintenanceTask[] = [
  { id: 'system_pressure_verify', description: 'Check system pressure — top up ONLY after identifying cause of pressure drop', category: 'general', minTier: 3, hasDataEntry: true },
  { id: 'all_zones_heating', description: 'Verify all zones are heating properly — check for rooms not reaching setpoint (may indicate air lock or failed zone valve)', category: 'controls', minTier: 3 },
  { id: 'short_cycle_check', description: 'Check for short cycling — minimum run time should be several minutes; short cycling damages heat exchanger', category: 'controls', minTier: 2 },
  { id: 'lwco_test', description: 'Re-test LWCO during peak heating season', category: 'safety', minTier: 2 },
  { id: 'combustion_analysis', description: 'Mid-season combustion analysis — verify efficiency has not degraded from soot accumulation', category: 'combustion', minTier: 1, hasDataEntry: true },
  { id: 'water_quality_spot', description: 'Spot-check system water quality — pH and inhibitor level', category: 'general', minTier: 1, hasDataEntry: true },
]

const BOILER_SPRING: MaintenanceTask[] = [
  { id: 'switch_summer_mode', description: 'Switch boiler to summer/off setting on operating control', category: 'controls', minTier: 3 },
  { id: 'system_pressure_record', description: 'Record final system pressure at end of heating season', category: 'general', minTier: 3, hasDataEntry: true },
  { id: 'relief_valve_inspect', description: 'Inspect and tag pressure relief valve — note condition after a full heating season', category: 'safety', minTier: 3 },
  { id: 'boiler_flush', description: 'Flush boiler bottom drain — remove accumulated sediment; inspect water quality', category: 'general', minTier: 2 },
  { id: 'flue_inspect_post_season', description: 'Inspect flue/vent connector for deterioration after full heating season', category: 'combustion', minTier: 2 },
  { id: 'circulator_pump_lubricate', description: 'Lubricate circulator pump motor oil ports if serviceable (sealed motors require no lubrication)', category: 'mechanical', minTier: 2 },
  { id: 'zone_valves_operate', description: 'Manually operate all zone valves through full cycle — verify no sticking post-season', category: 'controls', minTier: 2 },
  { id: 'water_quality_full', description: 'Full water quality test — pH, inhibitor, hardness; treat system if inhibitor depleted', category: 'general', minTier: 1, hasDataEntry: true },
]

const BOILER_SUMMER: MaintenanceTask[] = [
  { id: 'visual_inspection', description: 'Visual inspection — check for leaks, corrosion, or unusual conditions during summer standby', category: 'general', minTier: 3 },
  { id: 'pressure_check', description: 'Verify system remains pressurized during summer standby', category: 'general', minTier: 3, hasDataEntry: true },
  { id: 'expansion_tank_check', description: 'Recheck expansion tank pre-charge during off-season', category: 'mechanical', minTier: 2 },
]


// ─────────────────────────────────────────────────────────────────────────────
// HOT WATER TANKS / WATER HEATERS
// ─────────────────────────────────────────────────────────────────────────────

const HWT_TASKS = (season: Season): MaintenanceTask[] => {
  const annual: MaintenanceTask[] = [
    { id: 'tp_valve_test', description: 'Test T&P relief valve — lift lever fully 3–5 seconds; verify discharge and clean reseat; replace if valve weeps after test; confirm discharge pipe terminates within 6" of floor', category: 'safety', minTier: 3 },
    { id: 'tank_visual', description: 'Inspect tank exterior — look for corrosion, water staining, or active leaks at fittings; inspect all connections', category: 'general', minTier: 3 },
    { id: 'venting_inspect', description: 'Inspect venting — check for blockage, corrosion at joints, proper slope; look for CO staining near draft diverter; power vent: inspect motor and pressure switch', category: 'combustion', minTier: 3 },
    { id: 'sediment_flush', description: 'Sediment flush — connect hose to drain valve; shut cold supply; drain 2–5 gallons until water runs clear; commercial: flush more frequently', category: 'general', minTier: 2 },
    { id: 'anode_rod_inspect', description: 'Inspect anode rod — replace when core wire exposed or rod is less than 1/2" diameter; record rod condition and size', category: 'general', minTier: 2 },
    { id: 'gas_pressure_check', description: 'Check gas manifold pressure (gas units) — NG: 3.5" W.C. typical', category: 'combustion', minTier: 2, hasDataEntry: true },
    { id: 'burner_pilot_inspect', description: 'Inspect pilot assembly and thermocouple — verify flame engulfs thermocouple tip; clean if needed', category: 'combustion', minTier: 2 },
    { id: 'temp_setting_verify', description: 'Verify temperature setting — commercial: 60°C (140°F) minimum for legionella prevention; residential: 49°C (120°F) maximum to fixtures', category: 'safety', minTier: 2, hasDataEntry: true, dataHint: 'Set temp °C / Actual outlet temp °C' },
    { id: 'expansion_tank_check', description: 'Check thermal expansion tank pre-charge — closed systems require expansion tank; verify air pre-charge matches cold water supply pressure', category: 'mechanical', minTier: 2 },
    { id: 'tankless_descale', description: 'Tankless units (Navien, Rinnai): flush heat exchanger with citric acid descaling solution annually in hard water areas; clean inlet filter screen; clean condensate trap', category: 'general', minTier: 1 },
    { id: 'combustion_analysis', description: 'Combustion analysis (gas units) — stack temp (300–400°F standard; excessively high = scale on HX), O2, CO; adjust air shutter if equipped', category: 'combustion', minTier: 1, hasDataEntry: true },
    { id: 'water_quality_test', description: 'Water quality test — hardness, pH, chloride content; correlate to anode rod wear; consider powered anode in corrosive water', category: 'general', minTier: 1, hasDataEntry: true },
    { id: 'legionella_risk_review', description: 'Review legionella risk — verify no dead legs, temps maintained (>60°C storage), adequate circulation in recirculating systems', category: 'safety', minTier: 1 },
  ]
  if (season === 'fall' || season === 'winter') {
    annual.push({ id: 'freeze_protection', description: 'Verify adequate freeze protection for water heater and supply/distribution piping in unconditioned spaces — check heat trace if installed', category: 'safety', minTier: 2 })
  }
  return annual
}


// ─────────────────────────────────────────────────────────────────────────────
// EXHAUST FANS (Rooftop, Wall, Kitchen Exhaust)
// ─────────────────────────────────────────────────────────────────────────────

const EXHAUST_FAN_TASKS = (season: Season): MaintenanceTask[] => [
  { id: 'fan_visual_inspect', description: 'Inspect fan wheel/propeller and housing — clean accumulated grease, dust, or debris; check for corrosion or damage', category: 'general', minTier: 3 },
  { id: 'motor_visual', description: 'Inspect motor — wipe external surfaces; check for excessive heat or unusual noise', category: 'electrical', minTier: 3 },
  { id: 'curb_mounting_inspect', description: 'Inspect fan mounting hardware and roof curb — check for loose bolts, deteriorated mounting gasket, failed caulk at roof penetration', category: 'general', minTier: 3 },
  { id: 'belt_inspect', description: 'Belt-drive fans: inspect belt for cracking, glazing, fraying — check tension; adjust with motor mount if needed; replace worn belts', category: 'mechanical', minTier: 2 },
  { id: 'bearings_lubricate', description: 'Lubricate bearings through Zerk fittings — apply grease per manufacturer spec; do not over-grease', category: 'mechanical', minTier: 2 },
  { id: 'motor_amps', description: 'Measure motor amperage — compare to nameplate FLA; high amps indicate failing motor or belt issue', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'damper_inspect', description: 'Inspect back-draft damper — verify it closes completely when fan is off; check linkage is free', category: 'controls', minTier: 2 },
  { id: 'bird_screen_clean', description: 'Clean bird screen or weather hood — remove debris and bird nests', category: 'general', minTier: 2 },
  { id: 'sheave_inspect', description: 'Belt-drive fans: inspect sheave (pulley) condition — look for wear grooves; worn sheaves cause rapid belt wear', category: 'mechanical', minTier: 2 },
  { id: 'rotation_verify', description: 'Verify fan rotation is correct — three-phase motors can rotate backwards (check for adequate airflow)', category: 'electrical', minTier: 2 },
  { id: 'kitchen_grease_cup', description: 'Kitchen upblast fans: inspect and clean grease cup/receptacle; check hinge assembly; verify grease drains back into cup', category: 'general', minTier: 2 },
  { id: 'airflow_verify', description: 'Verify exhaust flow with anemometer or smoke pencil at register — confirm adequate exhaust vs makeup air balance', category: 'controls', minTier: 1 },
  { id: 'vibration_check', description: 'Check vibration at motor and bearings — rough bearing sound indicates imminent failure', category: 'mechanical', minTier: 1 },
  { id: 'motor_megger', description: 'Megger test motor windings insulation resistance — below 1 megohm indicates failing insulation', category: 'electrical', minTier: 1 },
  { id: 'electrical_connections', description: 'Check electrical connections at motor junction box — verify grounding', category: 'electrical', minTier: 1 },
  ...(season === 'fall' || season === 'winter' ? [
    { id: 'freeze_protection', description: 'Verify kitchen exhaust system components are protected from freeze — check condensate freeze-up risk', category: 'safety', minTier: 2 } as MaintenanceTask
  ] : [])
]


// ─────────────────────────────────────────────────────────────────────────────
// WALK-IN COOLERS & WALK-IN FREEZERS
// ─────────────────────────────────────────────────────────────────────────────

const WALK_IN_TASKS = (season: Season, isFreeezer: boolean): MaintenanceTask[] => [
  { id: 'temp_verify', description: `Verify box temperature at setpoint — cooler: 0–4°C (32–40°F); freezer: -18°C (0°F) or below — CRITICAL for food safety compliance`, category: 'controls', minTier: 3, hasDataEntry: true, dataHint: 'Box temp °C or °F' },
  { id: 'visual_inspection', description: 'Inspect unit for ice buildup, frost patterns, damage, or unusual conditions', category: 'general', minTier: 3 },
  { id: 'door_gaskets_inspect', description: 'Inspect door gaskets — check for tears, gaps, or hardening; close dollar bill in door to test seal; replace if bill pulls out easily', category: 'general', minTier: 3 },
  { id: 'condenser_coil_clean', description: 'Clean condenser coil — use vacuum and/or coil cleaner; rinse thoroughly; straighten bent fins', category: 'coil', minTier: 2 },
  { id: 'evaporator_defrost_inspect', description: 'Inspect evaporator coil and defrost system — check defrost heaters (electric), hot gas lines, or off-cycle defrost; look for heavy frost or ice buildup indicating defrost failure', category: 'coil', minTier: 2 },
  { id: 'refrigerant_pressures', description: 'Check refrigerant suction and discharge pressures — record at steady-state operation', category: 'refrigeration', minTier: 2, hasDataEntry: true },
  { id: 'condenser_fan_amps', description: 'Record condenser fan motor amperage — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'evaporator_fan_amps', description: 'Record evaporator fan motor amperage — compare to nameplate; check for ice binding', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'drain_line_clear', description: 'Check and clear condensate drain line — pour water to verify flow; frozen drain (freezer) may require heat trace inspection', category: 'general', minTier: 2 },
  { id: 'defrost_cycle_verify', description: 'Verify defrost cycle timing and duration — check defrost clock/timer or electronic controller; confirm defrost terminates on temp or time', category: 'controls', minTier: 2 },
  { id: 'door_heaters_check', description: 'Check door frame anti-sweat heaters — verify operation on glass door units; measure amperage if accessible', category: 'electrical', minTier: 2 },
  { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks using electronic leak detector — inspect evaporator, condenser, lineset, and Schrader valves', category: 'refrigeration', minTier: 1 },
  { id: 'superheat_check', description: 'Measure and record superheat — compare to manufacturer spec (typically 8–15°F for standard TXV systems)', category: 'refrigeration', minTier: 1, hasDataEntry: true, dataHint: 'Superheat °F' },
  { id: 'electrical_connections', description: 'Check all electrical connections at condenser unit, evaporator, and control board', category: 'electrical', minTier: 1 },
  { id: 'defrost_heater_resistance', description: 'Test defrost heater element resistance with multimeter — OL/open circuit indicates failed heater element', category: 'electrical', minTier: 1, hasDataEntry: true, dataHint: 'Heater resistance Ω' },
  { id: 'food_safety_log', description: 'Document temperature readings in maintenance record — provide to client for food safety compliance records (CFIA, Health Canada, AHS requirements)', category: 'safety', minTier: 1 },
  ...(isFreeezer && (season === 'fall' || season === 'winter') ? [
    { id: 'low_ambient_check', description: 'Check low-ambient controls on condensing unit — verify head pressure controls are active to prevent over-condensing in cold ambient', category: 'controls', minTier: 2 } as MaintenanceTask
  ] : [])
]


// ─────────────────────────────────────────────────────────────────────────────
// REACH-IN COOLER / PREP COOLER / DISPLAY COOLER
// ─────────────────────────────────────────────────────────────────────────────

const REACH_IN_TASKS = (): MaintenanceTask[] => [
  { id: 'temp_verify', description: 'Verify box temperature at setpoint — cold holding: 4°C (40°F) or below; food safety compliance', category: 'controls', minTier: 3, hasDataEntry: true },
  { id: 'door_gaskets_inspect', description: 'Inspect door gaskets — check for tears or gaps; replace if failing dollar bill test', category: 'general', minTier: 3 },
  { id: 'coils_inspect', description: 'Inspect condenser and evaporator coils for frost buildup, blockage, or damage', category: 'coil', minTier: 3 },
  { id: 'condenser_coil_clean', description: 'Clean condenser coil — vacuum then coil cleaner; rinse; clean condenser fan blades', category: 'coil', minTier: 2 },
  { id: 'evaporator_defrost', description: 'Manually defrost evaporator if frosted up — check defrost heater and thermostat', category: 'coil', minTier: 2 },
  { id: 'drain_line_check', description: 'Check condensate drain line — flush with water; inspect drain pan for standing water', category: 'general', minTier: 2 },
  { id: 'refrigerant_pressures', description: 'Check refrigerant pressures at steady state', category: 'refrigeration', minTier: 2, hasDataEntry: true },
  { id: 'fan_motor_amps', description: 'Record condenser and evaporator fan motor amperage', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'defrost_verify', description: 'Verify defrost cycle operation and timing', category: 'controls', minTier: 2 },
  { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks using electronic leak detector', category: 'refrigeration', minTier: 1 },
  { id: 'superheat_check', description: 'Measure and record superheat', category: 'refrigeration', minTier: 1, hasDataEntry: true },
  { id: 'electrical_connections', description: 'Check all electrical connections at unit and control board', category: 'electrical', minTier: 1 },
  { id: 'door_heater_amps', description: 'Measure door anti-sweat heater amperage — verify operation', category: 'electrical', minTier: 1, hasDataEntry: true },
]


// ─────────────────────────────────────────────────────────────────────────────
// ICE MACHINES (Hoshizaki, Manitowoc, Scotsman, Ice-O-Matic)
// ─────────────────────────────────────────────────────────────────────────────

const ICE_MACHINE_TASKS = (): MaintenanceTask[] => [
  { id: 'visual_inspect', description: 'Visual inspection — check for ice formation abnormalities, unusual sounds, and general unit condition', category: 'general', minTier: 3 },
  { id: 'ice_quality_check', description: 'Check ice quality and production — verify ice is clear, full-sized, and production rate appears normal', category: 'controls', minTier: 3 },
  { id: 'water_supply_inspect', description: 'Inspect water supply and drain — check supply line for adequate pressure; verify drain line slope and free flow', category: 'general', minTier: 3 },
  { id: 'condenser_coil_clean', description: 'Clean condenser coil (air-cooled units) — vacuum accessible air-side components; rinse coil; clean condenser fan blade', category: 'coil', minTier: 2 },
  { id: 'water_filter_inspect', description: 'Inspect and replace water filter per manufacturer schedule — typically every 6 months', category: 'general', minTier: 2 },
  { id: 'scale_inspect', description: 'Inspect evaporator plate and water system for scale/mineral buildup — heavy scale reduces production and causes harvest failures', category: 'coil', minTier: 2 },
  { id: 'scale_delime', description: 'Descaling/deliming of evaporator and water system — use manufacturer-approved nickel-safe descaler per IOM procedure', category: 'coil', minTier: 2 },
  { id: 'slime_mold_check', description: 'Inspect for slime and mold in ice storage bin, water pan, and evaporator area — document location and extent; note: sanitization requires separate customer authorization', category: 'general', minTier: 2 },
  { id: 'refrigerant_pressures', description: 'Check refrigerant pressures during harvest and freeze cycles', category: 'refrigeration', minTier: 2, hasDataEntry: true },
  { id: 'harvest_cycle_time', description: 'Time harvest and freeze cycles — compare to manufacturer specification in IOM; deviation indicates refrigerant, scale, or timing issue', category: 'controls', minTier: 2, hasDataEntry: true, dataHint: 'Freeze cycle time (min) / Harvest cycle time (min)' },
  { id: 'bin_thermostat_check', description: 'Test bin full thermostat or sensor — verify machine shuts off when bin is full', category: 'controls', minTier: 2 },
  { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks using electronic detector', category: 'refrigeration', minTier: 1 },
  { id: 'superheat_check', description: 'Measure superheat at compressor inlet — compare to manufacturer spec for ice machine', category: 'refrigeration', minTier: 1, hasDataEntry: true },
  { id: 'electrical_connections', description: 'Check all electrical connections — inspect control board for error codes', category: 'electrical', minTier: 1 },
  { id: 'water_quality_assess', description: 'Assess water quality — high mineral content accelerates scale; recommend water filter or treatment if TDS above 200 ppm', category: 'general', minTier: 1 },
]


// ─────────────────────────────────────────────────────────────────────────────
// CONDENSING UNITS (Remote Condensers for Walk-Ins and Commercial Ref.)
// ─────────────────────────────────────────────────────────────────────────────

const CONDENSING_UNIT_TASKS = (season: Season): MaintenanceTask[] => [
  { id: 'visual_inspect', description: 'Inspect unit — check for physical damage, refrigerant oil staining, and general condition', category: 'general', minTier: 3 },
  { id: 'condenser_coil_clean', description: 'Clean condenser coil — use vacuum and coil cleaner; rinse thoroughly; straighten fins', category: 'coil', minTier: 2 },
  { id: 'condenser_fan_amps', description: 'Record condenser fan motor amperage — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'refrigerant_pressures', description: 'Check suction and discharge pressures during operation', category: 'refrigeration', minTier: 2, hasDataEntry: true },
  { id: 'refrigerant_piping_inspect', description: 'Inspect refrigerant piping — check insulation condition; look for oil staining indicating leaks; verify line supports', category: 'refrigeration', minTier: 2 },
  { id: 'electrical_connections', description: 'Check all electrical connections — inspect contactors, capacitors, control board', category: 'electrical', minTier: 2 },
  { id: 'vibration_check', description: 'Check for vibration at compressor and fan mounts — document unusual vibration', category: 'mechanical', minTier: 2 },
  { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks using electronic detector — inspect all fittings, service ports, and brazed joints', category: 'refrigeration', minTier: 1 },
  { id: 'superheat_subcooling', description: 'Measure superheat and subcooling — verify system is operating with correct charge', category: 'refrigeration', minTier: 1, hasDataEntry: true },
  { id: 'oil_level_check', description: 'Check oil level in compressor sight glass if visible — log oil color and level', category: 'mechanical', minTier: 1 },
  ...(season === 'fall' || season === 'winter' ? [
    { id: 'low_ambient_controls', description: 'Verify low-ambient head pressure controls are operating — fan cycling or VFD active; prevents over-condensing and slugging in cold weather (-40°C)', category: 'controls', minTier: 2 } as MaintenanceTask,
    { id: 'crankcase_heater', description: 'Verify crankcase heater is energized when compressor is off — prevents refrigerant migration into compressor oil at low ambient', category: 'electrical', minTier: 2 } as MaintenanceTask,
  ] : [])
]


// ─────────────────────────────────────────────────────────────────────────────
// UNIT HEATERS (Modine, Reznor, Sterling — Gas-Fired Hanging Unit Heaters)
// ─────────────────────────────────────────────────────────────────────────────

const UNIT_HEATER_FALL: MaintenanceTask[] = [
  { id: 'visual_inspect', description: 'Inspect unit exterior, mounting hardware, and clearances to combustibles — check supports for corrosion or looseness', category: 'general', minTier: 3 },
  { id: 'filter_inspect', description: 'Inspect inlet air filter if equipped — replace if dirty', category: 'filter', minTier: 3 },
  { id: 'gas_shutoff_verify', description: 'Verify gas supply shutoff valve is accessible, moves freely, and is open — tag location for emergency reference', category: 'safety', minTier: 3 },
  { id: 'operation_test', description: 'Test thermostat and verify unit fires on call for heat', category: 'controls', minTier: 3 },
  { id: 'heat_exchanger_clean', description: 'Vacuum and brush-clean heat exchanger exterior and interior passages — remove dust, cobwebs, and debris', category: 'combustion', minTier: 2 },
  { id: 'burner_clean', description: 'Remove and clean burner assembly — clear ports with compressed air; inspect for corrosion', category: 'combustion', minTier: 2 },
  { id: 'gas_pressure_check', description: 'Measure manifold gas pressure — NG: 3.5" W.C. typical; LP: 10.0–11.0" W.C.', category: 'combustion', minTier: 2, hasDataEntry: true },
  { id: 'ignition_electrode', description: 'Inspect ignition electrode — check ceramic insulator, gap (typically 1/8"), and clean with emery cloth', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: 'Electrode gap (inches)' },
  { id: 'gas_valve_test', description: 'Test gas valve operation — verify it opens on call for heat and closes on shutoff; leak-check all connections', category: 'combustion', minTier: 2 },
  { id: 'flue_inspect', description: 'Inspect exhaust flue — verify slope, secure at unit collar, vent cap present and clear', category: 'combustion', minTier: 2 },
  { id: 'belt_inspect', description: 'Belt-drive units: inspect belt and check tension; adjust or replace as needed', category: 'mechanical', minTier: 2 },
  { id: 'fan_motor_amps', description: 'Record fan motor amperage — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'heat_exchanger_inspect', description: 'Inspect heat exchanger tubes for cracks or corrosion — check tube-to-header joints; look for rollout evidence', category: 'combustion', minTier: 2 },
  { id: 'limit_switch_test', description: 'Test high-limit switch — verify continuity; check for evidence of prior trips', category: 'safety', minTier: 2 },
  { id: 'temp_rise', description: 'Measure temperature rise — record inlet (ambient at unit intake) and discharge air temps', category: 'combustion', minTier: 2, hasDataEntry: true },
  { id: 'combustion_analysis', description: 'Combustion analysis — CO air-free (<100 ppm), CO2 (8–10%), O2 (4–8%), flue temp, efficiency', category: 'combustion', minTier: 1, hasDataEntry: true },
  { id: 'motor_lubricate', description: 'Lubricate fan motor if oil ports present — apply 3–5 drops #20 non-detergent motor oil; sealed/ECM motors require no lubrication', category: 'mechanical', minTier: 1 },
]

const UNIT_HEATER_SPRING: MaintenanceTask[] = [
  { id: 'post_season_inspect', description: 'Post-season visual inspection — check for damage or corrosion before shutdown', category: 'general', minTier: 3 },
  { id: 'clean_fan_housing', description: 'Clean fan blades, motor housing, and unit interior — prevent corrosion during humid summer months', category: 'mechanical', minTier: 2 },
]


// ─────────────────────────────────────────────────────────────────────────────
// GENERIC TASKS (fallback for any equipment type)
// ─────────────────────────────────────────────────────────────────────────────

const getGenericTasks = (season: Season): MaintenanceTask[] => [
  { id: 'filter_inspect_replace', description: 'Inspect and replace filters — record type, size, and condition', category: 'filter', minTier: 3 },
  { id: 'visual_inspection', description: 'Visual inspection of unit — check for damage, leaks, unusual conditions', category: 'general', minTier: 3 },
  { id: 'operation_test', description: 'Test operation — verify unit reaches and maintains setpoint', category: 'controls', minTier: 3 },
  { id: 'motor_amps', description: 'Record motor amperage — compare to nameplate FLA', category: 'electrical', minTier: 2, hasDataEntry: true },
  { id: 'electrical_connections', description: 'Check all electrical connections — inspect for heat damage or corrosion', category: 'electrical', minTier: 2 },
  { id: 'coil_clean', description: 'Inspect and clean coils as needed', category: 'coil', minTier: 2 },
  { id: 'lubrication', description: 'Lubricate all motor bearings and moving parts per manufacturer schedule', category: 'mechanical', minTier: 1 },
  { id: 'controls_check', description: 'Check controls, setpoints, and safety devices', category: 'controls', minTier: 1 },
  { id: 'voltage_record', description: 'Record line voltage readings', category: 'electrical', minTier: 1, hasDataEntry: true },
  ...(season === 'fall' || season === 'winter' ? [
    { id: 'heating_prep', description: 'Prepare heating system for winter — verify operation at all heating stages', category: 'combustion', minTier: 2 } as MaintenanceTask
  ] : [])
]


// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: getChecklist
// ─────────────────────────────────────────────────────────────────────────────

export function getChecklist(
  equipmentType: EquipmentType,
  season: Season,
  tier: MaintenanceTier
): MaintenanceTask[] {
  const allTasks = getAllTasks(equipmentType, season)
  return allTasks.filter((task) => task.minTier >= tier)
}

function getAllTasks(equipmentType: EquipmentType, season: Season): MaintenanceTask[] {
  switch (equipmentType) {
    case 'RTU':
      switch (season) {
        case 'spring': return RTU_SPRING
        case 'summer': return RTU_SUMMER
        case 'fall':   return RTU_FALL
        case 'winter': return RTU_WINTER
      }
    case 'FURNACE':
      switch (season) {
        case 'spring': return FURNACE_SPRING
        case 'summer': return FURNACE_SUMMER
        case 'fall':   return FURNACE_FALL
        case 'winter': return FURNACE_WINTER
      }
    case 'SPLIT_SYSTEM':
      switch (season) {
        case 'spring': return SPLIT_SPRING
        case 'summer': return SPLIT_SUMMER
        case 'fall':   return SPLIT_FALL
        case 'winter': return SPLIT_WINTER
      }
    case 'HEAT_PUMP':
      switch (season) {
        case 'spring': return SPLIT_SPRING
        case 'summer': return SPLIT_SUMMER
        case 'fall':   return SPLIT_FALL
        case 'winter': return SPLIT_WINTER
      }
    case 'AHU':
      return AHU_TASKS(season)
    case 'MINI_SPLIT':
      return MINI_SPLIT_TASKS(season)
    case 'VRF':
      return MINI_SPLIT_TASKS(season) // VRF shares many tasks with mini-split
    case 'MAU':
      switch (season) {
        case 'spring': return MAU_SPRING
        case 'summer': return MAU_SUMMER
        case 'fall':   return MAU_FALL
        case 'winter': return MAU_WINTER
      }
    case 'BOILER':
      switch (season) {
        case 'spring': return BOILER_SPRING
        case 'summer': return BOILER_SUMMER
        case 'fall':   return BOILER_FALL
        case 'winter': return BOILER_WINTER
      }
    case 'WALK_IN_COOLER':
      return WALK_IN_TASKS(season, false)
    case 'WALK_IN_FREEZER':
      return WALK_IN_TASKS(season, true)
    case 'REACH_IN':
      return REACH_IN_TASKS()
    case 'EXHAUST_FAN':
      return EXHAUST_FAN_TASKS(season)
    case 'UNIT_HEATER':
      switch (season) {
        case 'fall':   return UNIT_HEATER_FALL
        case 'spring': return UNIT_HEATER_SPRING
        default:       return UNIT_HEATER_SPRING
      }
    case 'CHILLER':
      return getChillerTasks(season)
    case 'COOLING_TOWER':
      return getCoolingTowerTasks(season)
    case 'PTAC':
      return getPTACTasks(season)
    case 'ICE_MACHINE':
      return ICE_MACHINE_TASKS()
    case 'CONDENSING_UNIT':
      return CONDENSING_UNIT_TASKS(season)
    // Plumbing assets — not seasonal in the same way HVAC is, so the same
    // task list applies every visit (typically quarterly for Gold/Silver).
    case 'WATER_HEATER_TANK':
      return HWT_TASKS(season)
    case 'WATER_HEATER_TANKLESS':
      return getWaterHeaterTanklessTasks()
    case 'BACKFLOW_PREVENTER':
      return getBackflowPreventerTasks()
    case 'SUMP_PUMP':
    case 'SEWAGE_EJECTOR_PUMP':
      return getSumpEjectorPumpTasks()
    case 'GREASE_TRAP':
      return getGreaseTrapTasks()
    case 'FLOOR_DRAIN':
      return getFloorDrainTasks()
    case 'BOOSTER_PUMP':
      return getBoosterPumpTasks()
    case 'WATER_SOFTENER':
      return getWaterSoftenerTasks()
    case 'MIXING_VALVE':
      return getMixingValveTasks()
    case 'GAS_METER_REGULATOR':
      return getGasMeterRegulatorTasks()
    case 'FLOOR_HEAT_MANIFOLD':
      return getFloorHeatManifoldTasks()
    default:
      return getGenericTasks(season)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHILLER TASKS
// ─────────────────────────────────────────────────────────────────────────────

function getChillerTasks(season: Season): MaintenanceTask[] {
  return [
    { id: 'visual_inspect', description: 'Visual inspection of entire chiller — check for leaks, damage, unusual conditions', category: 'general', minTier: 3 },
    { id: 'operation_verify', description: 'Verify chiller is meeting leaving chilled water temperature setpoint', category: 'controls', minTier: 3, hasDataEntry: true },
    { id: 'refrigerant_pressures', description: 'Record suction and discharge pressures at steady state', category: 'refrigeration', minTier: 2, hasDataEntry: true },
    { id: 'chilled_water_temps', description: 'Record leaving and entering chilled water temperatures', category: 'controls', minTier: 2, hasDataEntry: true, dataHint: 'Entering CWS °F / Leaving CWS °F' },
    { id: 'condenser_clean', description: 'Clean condenser coil (air-cooled) or inspect condenser water piping (water-cooled)', category: 'coil', minTier: 2 },
    { id: 'compressor_amps', description: 'Record compressor amperage on all legs', category: 'electrical', minTier: 2, hasDataEntry: true },
    { id: 'pump_check', description: 'Verify chilled water pump operation — check amps, no unusual noise or vibration', category: 'mechanical', minTier: 2, hasDataEntry: true },
    { id: 'refrigerant_leak_check', description: 'Check for refrigerant leaks at all connections, service ports, and heat exchangers', category: 'refrigeration', minTier: 1 },
    { id: 'superheat_subcooling', description: 'Measure superheat and subcooling — verify proper refrigerant charge', category: 'refrigeration', minTier: 1, hasDataEntry: true },
    { id: 'electrical_connections', description: 'Check all electrical connections — inspect control board, safeties, fault codes', category: 'electrical', minTier: 1 },
    { id: 'oil_analysis', description: 'Oil analysis — send sample to lab for contamination, moisture, and acidity testing', category: 'mechanical', minTier: 1 },
    ...(season === 'fall' || season === 'winter' ? [
      { id: 'glycol_concentration', description: 'Test glycol concentration in chilled water loop — Fort McMurray target: 50% propylene glycol for -37°C freeze protection; test with refractometer', category: 'general', minTier: 2, hasDataEntry: true, dataHint: 'Glycol % / Freeze point °C / pH' } as MaintenanceTask
    ] : [])
  ]
}


// ─────────────────────────────────────────────────────────────────────────────
// COOLING TOWER TASKS
// ─────────────────────────────────────────────────────────────────────────────

function getCoolingTowerTasks(season: Season): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = [
    { id: 'visual_inspect', description: 'Visual inspection of tower structure, fill, basin, and distribution system', category: 'general', minTier: 3 },
    { id: 'water_level_check', description: 'Check basin water level — adjust float valve if needed', category: 'general', minTier: 3 },
    { id: 'fan_motor_amps', description: 'Record fan motor amperage — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true },
    { id: 'belt_inspect', description: 'Inspect belt drive if belt-drive type — check tension and condition', category: 'mechanical', minTier: 2 },
    { id: 'drift_eliminators_inspect', description: 'Inspect drift eliminators — clean or replace if damaged; reduces legionella risk', category: 'general', minTier: 2 },
    { id: 'spray_nozzles_inspect', description: 'Inspect water distribution nozzles — clear any blocked nozzles', category: 'general', minTier: 2 },
    { id: 'water_quality_test', description: 'Test cooling tower water — pH (target 7.0–8.5), conductivity, inhibitor concentration, biological count; adjust chemical treatment', category: 'general', minTier: 2, hasDataEntry: true },
    { id: 'basin_clean', description: 'Clean basin — remove sludge, debris, and scale deposits', category: 'general', minTier: 2 },
    { id: 'bleed_rate_adjust', description: 'Verify and adjust bleed/blowdown rate — controls scale and biological growth', category: 'controls', minTier: 2 },
    { id: 'legionella_risk', description: 'Legionella risk assessment — verify treatment program is active; review water test results; Alberta Health Services guidance requires active Legionella management plan for cooling towers', category: 'safety', minTier: 1 },
    { id: 'fill_inspect', description: 'Inspect fill media — check for scaling, biological growth, or structural damage; replace if degraded', category: 'general', minTier: 1 },
    { id: 'bearings_lubricate', description: 'Lubricate fan shaft bearings through Zerk fittings per manufacturer schedule', category: 'mechanical', minTier: 1 },
  ]
  if (season === 'fall') {
    tasks.push(
      { id: 'winterization', description: 'Winterize cooling tower — drain basin and distribution piping; shut down make-up water; verify no freeze risk', category: 'safety', minTier: 3 },
    )
  }
  if (season === 'spring') {
    tasks.push(
      { id: 'spring_startup', description: 'Spring startup — refill basin; flush distribution; check all connections; test operation; full water chemistry analysis before startup', category: 'general', minTier: 3 },
    )
  }
  return tasks
}


// ─────────────────────────────────────────────────────────────────────────────
// PTAC TASKS
// ─────────────────────────────────────────────────────────────────────────────

function getPTACTasks(season: Season): MaintenanceTask[] {
  return [
    { id: 'filter_clean', description: 'Remove and clean washable filter — rinse with warm water; allow to dry before reinstalling', category: 'filter', minTier: 3 },
    { id: 'visual_inspect', description: 'Visual inspection of unit, louvers, and sleeve', category: 'general', minTier: 3 },
    { id: 'operation_test', description: 'Test all modes — cooling, heating, and fan; verify setpoint control', category: 'controls', minTier: 3 },
    { id: 'coil_clean', description: 'Clean indoor and outdoor coils — use vacuum and coil cleaner; rinse outdoor coil', category: 'coil', minTier: 2 },
    { id: 'condensate_check', description: 'Check condensate drain — verify proper drainage; clean drain if needed', category: 'general', minTier: 2 },
    { id: 'electrical_connections', description: 'Check electrical connections at unit', category: 'electrical', minTier: 2 },
    { id: 'refrigerant_inspect', description: 'Visual inspection for refrigerant leaks — oil staining around coils or fittings', category: 'refrigeration', minTier: 1 },
    { id: 'motor_amps', description: 'Record fan motor amperage', category: 'electrical', minTier: 1, hasDataEntry: true },
  ]
}


// ─────────────────────────────────────────────────────────────────────────────
// PLUMBING ASSETS
// ─────────────────────────────────────────────────────────────────────────────

function getWaterHeaterTankTasks(): MaintenanceTask[] {
  return [
    { id: 'wh_visual_leak_check', description: 'Inspect tank, fittings, and relief valve for leaks or corrosion', category: 'general', minTier: 3 },
    { id: 'wh_temp_verify', description: 'Verify tank temperature setpoint (typically 60°C/140°F) and record actual', category: 'general', minTier: 3, hasDataEntry: true, dataHint: '°C / °F' },
    { id: 'wh_trp_valve_test', description: 'Test temperature/pressure relief (T&P) valve — lift lever, confirm discharge and reseat', category: 'safety', minTier: 2 },
    { id: 'wh_sediment_flush', description: 'Drain and flush sediment from tank bottom until water runs clear', category: 'general', minTier: 2 },
    { id: 'wh_anode_inspect', description: 'Inspect sacrificial anode rod for depletion — replace if less than 50% remaining', category: 'general', minTier: 1 },
    { id: 'wh_combustion_check', description: 'Combustion analysis on gas-fired units — O2, CO2, CO ppm, flue temp', category: 'combustion', minTier: 1, hasDataEntry: true, dataHint: 'O2% / CO2% / CO ppm / Flue °F' },
    { id: 'wh_expansion_tank', description: 'Check expansion tank pre-charge (if equipped)', category: 'mechanical', minTier: 1, hasDataEntry: true, dataHint: 'psi' },
  ]
}

function getWaterHeaterTanklessTasks(): MaintenanceTask[] {
  return [
    { id: 'twh_visual_leak_check', description: 'Inspect unit, venting, and connections for leaks or damage', category: 'general', minTier: 3 },
    { id: 'twh_inlet_filter_clean', description: 'Clean inlet water filter screen', category: 'general', minTier: 3 },
    { id: 'twh_descale', description: 'Descale heat exchanger with approved solution (white vinegar or commercial descaler) — critical in hard water areas', category: 'mechanical', minTier: 2 },
    { id: 'twh_error_log_review', description: 'Review unit error/fault code history via control panel', category: 'controls', minTier: 2 },
    { id: 'twh_combustion_check', description: 'Combustion analysis — O2, CO2, CO ppm, flue temp', category: 'combustion', minTier: 1, hasDataEntry: true, dataHint: 'O2% / CO2% / CO ppm / Flue °F' },
    { id: 'twh_flow_rate_verify', description: 'Verify flow rate and temperature rise meet rated performance', category: 'mechanical', minTier: 1, hasDataEntry: true },
  ]
}

function getBackflowPreventerTasks(): MaintenanceTask[] {
  return [
    { id: 'bf_visual_inspect', description: 'Visual inspection of assembly, test cocks, and shutoff valves for damage or leaks', category: 'general', minTier: 3 },
    { id: 'bf_annual_cert_test', description: 'Perform certified backflow test per municipal/ABSA requirements — record results on official test form', category: 'safety', minTier: 3, hasDataEntry: true, dataHint: 'PSI differential' },
    { id: 'bf_relief_valve_check', description: 'Confirm relief valve discharges properly under test', category: 'safety', minTier: 2 },
    { id: 'bf_strainer_clean', description: 'Clean strainer screen if equipped', category: 'general', minTier: 1 },
  ]
}

function getSumpEjectorPumpTasks(): MaintenanceTask[] {
  return [
    { id: 'sp_visual_inspect', description: 'Inspect pit, pump, and discharge piping for debris, odor, or damage', category: 'general', minTier: 3 },
    { id: 'sp_float_switch_test', description: 'Test float switch operation — pour water into pit and confirm pump activates/deactivates correctly', category: 'controls', minTier: 3 },
    { id: 'sp_check_valve_inspect', description: 'Inspect check valve on discharge line for proper seating (prevents backflow)', category: 'mechanical', minTier: 2 },
    { id: 'sp_amp_draw', description: 'Record pump motor amperage during operation — compare to nameplate', category: 'electrical', minTier: 2, hasDataEntry: true, dataHint: 'Amps' },
    { id: 'sp_alarm_test', description: 'Test high-water alarm (if equipped)', category: 'safety', minTier: 1 },
    { id: 'sp_battery_backup_test', description: 'Test battery backup system and load-test battery (if equipped)', category: 'safety', minTier: 1 },
  ]
}

function getGreaseTrapTasks(): MaintenanceTask[] {
  return [
    { id: 'gt_visual_inspect', description: 'Inspect interceptor body, lid, and gasket for damage or odor leaks', category: 'general', minTier: 3 },
    { id: 'gt_measure_grease_layer', description: 'Measure grease cap thickness and solids depth — pump out if grease layer exceeds 25% of trap depth', category: 'general', minTier: 3, hasDataEntry: true, dataHint: 'inches of grease/solids' },
    { id: 'gt_flow_test', description: 'Verify inlet/outlet baffles are clear and flow is unobstructed', category: 'mechanical', minTier: 2 },
    { id: 'gt_pump_out_log', description: 'Log pump-out date and hauler manifest number for compliance records', category: 'general', minTier: 2 },
  ]
}

function getFloorDrainTasks(): MaintenanceTask[] {
  return [
    { id: 'fd_visual_inspect', description: 'Inspect grate, strainer basket, and drain body for debris or damage', category: 'general', minTier: 3 },
    { id: 'fd_trap_primer_check', description: 'Verify trap seal is intact (pour water if dry) to prevent sewer gas escape', category: 'general', minTier: 3 },
    { id: 'fd_flow_test', description: 'Pour test to confirm free flow with no backup', category: 'mechanical', minTier: 2 },
  ]
}

function getBoosterPumpTasks(): MaintenanceTask[] {
  return [
    { id: 'bp_visual_inspect', description: 'Inspect pump, motor, and piping for leaks, vibration, or noise', category: 'general', minTier: 3 },
    { id: 'bp_pressure_check', description: 'Record system pressure at pump discharge and compare to setpoint', category: 'mechanical', minTier: 3, hasDataEntry: true, dataHint: 'psi' },
    { id: 'bp_amp_draw', description: 'Record motor amperage on all legs — compare to nameplate FLA', category: 'electrical', minTier: 2, hasDataEntry: true, dataHint: 'L1 / L2 / L3 amps' },
    { id: 'bp_bearing_lube', description: 'Lubricate bearings per manufacturer schedule (if applicable)', category: 'mechanical', minTier: 1 },
    { id: 'bp_pressure_tank_precharge', description: 'Check pressure tank air pre-charge with tank drained of water', category: 'mechanical', minTier: 1, hasDataEntry: true, dataHint: 'psi' },
  ]
}

function getWaterSoftenerTasks(): MaintenanceTask[] {
  return [
    { id: 'ws_salt_level_check', description: 'Check brine tank salt level — top up if below half full', category: 'general', minTier: 3 },
    { id: 'ws_hardness_test', description: 'Test treated water hardness — verify within target range', category: 'general', minTier: 3, hasDataEntry: true, dataHint: 'grains/gallon' },
    { id: 'ws_resin_bed_inspect', description: 'Inspect resin bed for fouling or salt bridging', category: 'mechanical', minTier: 2 },
    { id: 'ws_regen_cycle_verify', description: 'Verify regeneration cycle timing and settings match household/facility demand', category: 'controls', minTier: 2 },
    { id: 'ws_injector_venturi_clean', description: 'Clean brine injector/venturi assembly', category: 'mechanical', minTier: 1 },
  ]
}

function getMixingValveTasks(): MaintenanceTask[] {
  return [
    { id: 'mv_outlet_temp_verify', description: 'Verify mixed outlet temperature is within code-required range (typically ≤49°C/120°F for public lavatories)', category: 'safety', minTier: 3, hasDataEntry: true, dataHint: '°C / °F' },
    { id: 'mv_visual_inspect', description: 'Inspect valve body and connections for leaks or scale buildup', category: 'general', minTier: 3 },
    { id: 'mv_thermal_shutdown_test', description: 'Test thermal shutoff (cold-water failure response)', category: 'safety', minTier: 2 },
    { id: 'mv_recalibrate', description: 'Recalibrate valve to setpoint if drift detected', category: 'mechanical', minTier: 1 },
  ]
}

function getGasMeterRegulatorTasks(): MaintenanceTask[] {
  return [
    { id: 'gm_visual_inspect', description: 'Inspect meter, regulator, and piping for corrosion, damage, or leak signs', category: 'general', minTier: 3 },
    { id: 'gm_leak_test', description: 'Leak-test all accessible fittings with approved gas leak solution', category: 'safety', minTier: 3 },
    { id: 'gm_static_pressure', description: 'Record static and operating gas pressure at regulator outlet', category: 'combustion', minTier: 2, hasDataEntry: true, dataHint: '" W.C.' },
    { id: 'gm_vent_clear', description: 'Confirm regulator vent is clear and terminates per code', category: 'safety', minTier: 2 },
  ]
}

function getFloorHeatManifoldTasks(): MaintenanceTask[] {
  return [
    { id: 'fh_visual_inspect', description: 'Inspect manifold, valves, and actuators for leaks or corrosion', category: 'general', minTier: 3 },
    { id: 'fh_loop_flow_balance', description: 'Verify flow balance across all loops using flowmeters on manifold', category: 'mechanical', minTier: 2, hasDataEntry: true, dataHint: 'GPM per loop' },
    { id: 'fh_air_purge', description: 'Purge air from loops if flow is uneven or noisy', category: 'mechanical', minTier: 2 },
    { id: 'fh_glycol_check', description: 'Test glycol concentration and pH of loop fluid', category: 'mechanical', minTier: 1, hasDataEntry: true, dataHint: '% glycol / pH' },
    { id: 'fh_actuator_test', description: 'Cycle-test each zone actuator for proper open/close response', category: 'controls', minTier: 1 },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getSeasonForDate(date: Date): Season {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

export function getCurrentSeason(): Season {
  return getSeasonForDate(new Date())
}

export const MEASUREMENT_TARGETS = {
  gas_pressure_ng: '3.2–3.8" W.C. (natural gas)',
  gas_pressure_lp: '10.0–11.0" W.C. (propane)',
  gas_inlet_ng: 'Min 5.0" W.C. dynamic',
  temp_rise_typical: '35–70°F (confirm per unit nameplate)',
  flame_sensor_ua: 'Min 1.5 µA; replace below 0.5 µA',
  hsi_silicon_carbide: '40–75 Ω at room temp; OL = failed',
  hsi_silicon_nitride: '20–50 Ω at room temp; OL = failed',
  co_flue_gas: '<100 ppm air-free; >400 ppm = urgent',
  co_occupied_space: '<9 ppm (ASHRAE 62.1); any reading requires investigation',
  combustion_o2: '3–8% for natural gas',
  combustion_co2: '8–10.5% for natural gas',
  flue_temp_80pct: '300–600°F (80% AFUE)',
  flue_temp_condensing: '80–120°F (90%+ condensing)',
  superheat_fixed_orifice: '8–15°F (typical; confirm per refrigerant)',
  superheat_txv: '8–12°F (TXV/EXV; verify per manufacturer)',
  subcooling_typical: '8–15°F (typical; confirm per manufacturer)',
  temp_differential_cooling: '15–22°F (supply vs. return air, cooling)',
  phase_imbalance_max: '<2% voltage phase imbalance',
  glycol_fort_mcmurray: '50% propylene glycol = -37°C freeze protection',
  boiler_water_ph: '7.5–9.0 (closed hydronic system)',
  walk_in_cooler_temp: '0–4°C (32–40°F)',
  walk_in_freezer_temp: '-18°C (0°F) or below (food safety minimum)',
  backflow_test_interval: 'Annual — required by Alberta municipal utilities',
  boiler_absa: 'ABSA Certificate of Inspection required in Alberta',
} as const
