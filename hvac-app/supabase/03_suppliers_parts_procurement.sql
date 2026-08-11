-- ============================================================
-- 03: SUPPLIERS, PARTS CATALOG, PRE-ORDER PROCUREMENT
-- Run after 02_plumbing_assets.sql
-- This is the "pre-order filters/belts/parts before the tech
-- arrives" system.
-- ============================================================

-- ------------------------------------------------------------
-- SUPPLIERS (BGE, Sinclair's, Wolseley, MCO, independents...)
-- ------------------------------------------------------------
create table supplier_contacts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,                    -- "BGE Filters", "Sinclair Supply"
  category text check (category in ('hvac','plumbing','refrigeration','general')) default 'general',
  account_number text,
  rep_name text,
  order_email text,
  order_phone text,
  website text,
  ships_to_site boolean default false,   -- can they deliver direct to the facility?
  is_default_hvac boolean default false,
  is_default_plumbing boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- PARTS CATALOG (cost is private, sell price is what clients see)
-- ------------------------------------------------------------
create table parts_catalog (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  supplier_id uuid references supplier_contacts(id) on delete set null,
  name text not null,                    -- "16x25x4 MERV-11 Filter"
  part_number text,
  supplier_part_number text,             -- PRIVATE
  manufacturer text,
  category text check (category in ('filter','belt','refrigerant','electrical','plumbing_part','valve','pump','other')) default 'other',
  compatible_equipment_types text[],     -- e.g. ARRAY['RTU','AHU']
  cost_price numeric(10,2),              -- PRIVATE — never sent to clients
  sell_price numeric(10,2),              -- shown to clients/techs
  markup_pct numeric(6,2),               -- PRIVATE
  unit text default 'each',
  in_stock boolean default true,
  stock_note text,
  lead_time_days integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Equipment ↔ recurring parts (what a specific unit needs every service)
create table equipment_parts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  part_id uuid not null references parts_catalog(id) on delete cascade,
  quantity_per_service integer not null default 1,
  applies_seasons text[] default array['spring','summer','fall','winter'],
  notes text,                            -- "belt size A47", "filter size 16x25x4"
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- MARKUP TIERS (per-tenant sliding scale, feeds calculateSellPrice)
-- ------------------------------------------------------------
create table markup_tiers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  min_cost numeric(10,2) not null,
  max_cost numeric(10,2),                -- null = no upper bound
  multiplier numeric(5,2) not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- PROCUREMENT ORDERS (the pre-order-before-the-tech-arrives engine)
-- ------------------------------------------------------------
create table procurement_orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  visit_id uuid not null references maintenance_visits(id) on delete cascade,
  supplier_id uuid references supplier_contacts(id) on delete set null,
  order_items jsonb not null default '[]',
  -- [{ part_id, name, quantity, cost_price, part_number }]
  status text not null default 'pending' check (status in ('pending','sent','po_confirmed','received','cancelled')),
  po_number text,
  po_confirmed_at timestamptz,
  po_confirmed_by uuid references users(id),
  sent_at timestamptz,
  needed_by_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (visit_id, supplier_id)          -- never double-order the same visit/supplier
);

create index idx_procurement_visit on procurement_orders(visit_id);
create index idx_procurement_tenant on procurement_orders(tenant_id);

-- ------------------------------------------------------------
-- Auto-procurement settings on tenants
-- ------------------------------------------------------------
alter table tenants add column if not exists website text;
alter table tenants add column if not exists auto_procurement_enabled boolean default true;
alter table tenants add column if not exists procurement_lead_days integer default 5;
alter table tenants add column if not exists manager_email text;
alter table tenants add column if not exists default_regular_rate numeric(8,2) default 125;
alter table tenants add column if not exists default_overtime_rate numeric(8,2) default 165;
alter table tenants add column if not exists default_weekend_rate numeric(8,2) default 175;
alter table tenants add column if not exists default_emergency_rate numeric(8,2) default 195;
alter table tenants add column if not exists default_holiday_rate numeric(8,2) default 220;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table supplier_contacts enable row level security;
alter table parts_catalog enable row level security;
alter table equipment_parts enable row level security;
alter table markup_tiers enable row level security;
alter table procurement_orders enable row level security;

create policy "Tenant sees suppliers" on supplier_contacts
  for select using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','technician','super_admin'));
create policy "Admin manages suppliers" on supplier_contacts
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

create policy "Staff see parts catalog" on parts_catalog
  for select using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','technician','super_admin'));
create policy "Admin manages parts catalog" on parts_catalog
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

create policy "Staff see equipment parts" on equipment_parts
  for select using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','technician','super_admin'));
create policy "Admin manages equipment parts" on equipment_parts
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

create policy "Admin sees markup tiers" on markup_tiers
  for select using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));
create policy "Admin manages markup tiers" on markup_tiers
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

create policy "Staff see procurement" on procurement_orders
  for select using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','technician','super_admin'));
create policy "Admin manages procurement" on procurement_orders
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

-- ------------------------------------------------------------
-- PRIVACY VIEW — this is what client-facing screens must query.
-- Physically excludes cost_price, markup_pct, supplier_part_number.
-- ------------------------------------------------------------
create or replace view parts_catalog_public as
  select id, tenant_id, name, part_number, manufacturer, category,
         compatible_equipment_types, sell_price, unit, in_stock,
         stock_note, lead_time_days
  from parts_catalog;

alter view parts_catalog_public set (security_invoker = true);

create index idx_parts_catalog_tenant on parts_catalog(tenant_id);
create index idx_equipment_parts_equipment on equipment_parts(equipment_id);
