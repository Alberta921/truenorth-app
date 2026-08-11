-- ============================================================
-- 06: PER-ASSET COMPONENT SPECS
-- Run after 05_scheduling_calendar.sql
--
-- Problem this solves: the checklist knew generically that "a blower
-- motor" might need an amp reading, but not whether THIS unit actually
-- has a venter/inducer motor, what size filter(s) it takes, or how
-- many. That info should live on the equipment record itself so it's
-- known before the tech even leaves the shop — not re-typed every visit.
-- ============================================================

alter table equipment add column if not exists has_blower_motor boolean default true;
alter table equipment add column if not exists has_venter_motor boolean default false;
-- "venter motor" = induced draft / inducer motor on furnaces, boilers,
-- and condensing equipment. Defaults false since not every unit has one
-- (e.g. a straight AC condenser doesn't) — set true at equipment setup.

alter table equipment add column if not exists filter_size text;
-- e.g. "16x25x4" — can hold multiple sizes comma-separated if a unit
-- takes more than one distinct size.
alter table equipment add column if not exists filter_quantity integer default 1;
-- how many filters this unit takes, so the pre-order pulls the right count.

-- The venter/inducer motor amp reading had no column at all in the
-- original schema (only supply/condenser fan amps existed).
alter table maintenance_records add column if not exists inducer_amp numeric(6,2);

comment on column equipment.has_blower_motor is 'Whether this unit has a blower/supply fan motor requiring an amp reading at service';
comment on column equipment.has_venter_motor is 'Whether this unit has a venter/inducer draft motor requiring an amp reading at service';
comment on column equipment.filter_size is 'Exact filter size(s) this unit takes, e.g. 16x25x4 — shown to the tech and used for parts pre-ordering';
comment on column equipment.filter_quantity is 'How many filters of that size this unit takes per change';
