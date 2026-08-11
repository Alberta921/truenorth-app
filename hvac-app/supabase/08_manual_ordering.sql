-- ============================================================
-- 06: MANUAL/AD-HOC PARTS ORDERING
-- Run after 05_scheduling_calendar.sql
-- Lets office staff or a technician build a cart across multiple
-- suppliers and place orders on demand, not just auto-triggered
-- by an upcoming scheduled visit.
-- ============================================================

-- procurement_orders originally required a visit_id and had a
-- unique (visit_id, supplier_id) constraint. Ad-hoc orders aren't
-- tied to a visit, so visit_id needs to be optional, and the
-- uniqueness rule only needs to apply when a visit *is* attached
-- (so we still never double-order the same visit/supplier pair).
alter table procurement_orders alter column visit_id drop not null;
alter table procurement_orders drop constraint if exists procurement_orders_visit_id_supplier_id_key;

create unique index if not exists uniq_procurement_visit_supplier
  on procurement_orders (visit_id, supplier_id)
  where visit_id is not null;

alter table procurement_orders add column if not exists order_type text not null default 'scheduled'
  check (order_type in ('scheduled', 'manual'));
alter table procurement_orders add column if not exists placed_by uuid references users(id);
alter table procurement_orders add column if not exists facility_id uuid references facilities(id);

create index if not exists idx_procurement_facility on procurement_orders(facility_id);
