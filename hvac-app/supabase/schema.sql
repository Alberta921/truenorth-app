-- ============================================================
-- HVAC Maintenance SaaS — Supabase Schema
-- Run this in Supabase SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TENANTS (each HVAC company that uses the app)
-- ============================================================
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  brand_color text default '#1a3a5c',
  openai_api_key text, -- stored encrypted, used for AI features
  contact_email text,
  contact_phone text,
  address text,
  website text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- USERS (linked to Supabase Auth)
-- ============================================================
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('super_admin','company_admin','technician','client')),
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- FACILITIES (buildings/sites the HVAC company services)
-- ============================================================
create table facilities (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  address text,
  city text,
  province text,
  postal_code text,
  photo_url text,
  contact_name text,
  contact_email text,
  contact_phone text,
  client_user_id uuid references users(id) on delete set null,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- EQUIPMENT (HVAC units at each facility)
-- ============================================================
create table equipment (
  id uuid primary key default uuid_generate_v4(),
  facility_id uuid not null references facilities(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null, -- e.g. "RTU-1", "Rooftop Unit - Main"
  equipment_type text not null check (equipment_type in (
    'RTU','SPLIT_SYSTEM','AHU','FURNACE','BOILER','MAU',
    'EXHAUST_FAN','MINI_SPLIT','HEAT_PUMP','WALK_IN_COOLER',
    'WALK_IN_FREEZER','REACH_IN','CHILLER','COOLING_TOWER',
    'UNIT_HEATER','PTAC','VRF','OTHER'
  )),
  manufacturer text,
  model_number text,
  serial_number text,
  tonnage numeric(5,2),
  btu_capacity integer,
  voltage text,
  refrigerant_type text,
  year_installed integer,
  location_in_facility text, -- e.g. "Roof - North side", "Basement mechanical room"
  unit_photo_url text,
  nameplate_photo_url text,
  maintenance_tier integer not null default 2 check (maintenance_tier in (1,2,3)),
  -- Tier 1 = Premium, Tier 2 = Standard, Tier 3 = Basic
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- MAINTENANCE VISITS (scheduled service calls)
-- ============================================================
create table maintenance_visits (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  facility_id uuid not null references facilities(id) on delete cascade,
  technician_id uuid references users(id) on delete set null,
  season text not null check (season in ('spring','summer','fall','winter')),
  scheduled_date date,
  completed_date date,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- MAINTENANCE RECORDS (completed work on a single piece of equipment)
-- ============================================================
create table maintenance_records (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid references maintenance_visits(id) on delete set null,
  equipment_id uuid not null references equipment(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  technician_id uuid references users(id) on delete set null,
  season text not null check (season in ('spring','summer','fall','winter')),
  service_date date not null default current_date,
  maintenance_tier integer not null check (maintenance_tier in (1,2,3)),

  -- Checklist tasks completed (array of task IDs)
  tasks_completed jsonb default '[]',
  -- e.g. [{"id": "filter_replace", "completed": true, "notes": "16x25x4 MERV-11"}]

  -- Filter info
  filter_size text,
  filter_condition text check (filter_condition in ('clean','dirty','replaced','n_a')),

  -- Electrical measurements
  supply_fan_amp_l1 numeric(6,2),
  supply_fan_amp_l2 numeric(6,2),
  supply_fan_amp_l3 numeric(6,2),
  condenser_fan_amp_l1 numeric(6,2),
  condenser_fan_amp_l2 numeric(6,2),
  voltage_l1_l2 numeric(6,1),
  voltage_l2_l3 numeric(6,1),
  voltage_l1_l3 numeric(6,1),

  -- Refrigeration measurements
  suction_pressure numeric(6,1),
  discharge_pressure numeric(6,1),
  suction_temp numeric(5,1),
  liquid_line_temp numeric(5,1),
  superheat numeric(5,1),
  subcooling numeric(5,1),

  -- Air measurements
  supply_air_temp numeric(5,1),
  return_air_temp numeric(5,1),
  temp_differential numeric(5,1),

  -- Heating measurements
  gas_pressure_in_wc numeric(5,2),
  supply_air_temp_heat numeric(5,1),
  return_air_temp_heat numeric(5,1),
  temp_rise numeric(5,1),

  -- Additional custom readings (flexible key-value store)
  custom_readings jsonb default '{}',

  -- Photos taken during service
  photos jsonb default '[]',
  -- e.g. [{"url": "...", "caption": "Dirty condenser coil before cleaning"}]

  -- Technician notes
  notes text,

  -- Generated report
  report_pdf_url text,
  report_sent_at timestamptz,
  report_sent_to text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- REPORT TEMPLATES (per-tenant branding)
-- ============================================================
create table report_templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  header_color text default '#1a3a5c',
  footer_text text,
  include_logo boolean default true,
  include_facility_photo boolean default true,
  include_equipment_photos boolean default true,
  terms_and_conditions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table tenants enable row level security;
alter table users enable row level security;
alter table facilities enable row level security;
alter table equipment enable row level security;
alter table maintenance_visits enable row level security;
alter table maintenance_records enable row level security;
alter table report_templates enable row level security;

-- Helper function: get current user's tenant_id
create or replace function get_user_tenant_id()
returns uuid language sql security definer stable as $$
  select tenant_id from users where id = auth.uid()
$$;

-- Helper function: get current user's role
create or replace function get_user_role()
returns text language sql security definer stable as $$
  select role from users where id = auth.uid()
$$;

-- Tenants: users can only see their own tenant
create policy "Users see own tenant" on tenants
  for select using (id = get_user_tenant_id());

create policy "Company admin can update tenant" on tenants
  for update using (id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

-- Users: tenant isolation
create policy "Users see own tenant users" on users
  for select using (tenant_id = get_user_tenant_id());

create policy "Company admin manages users" on users
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

create policy "Users update own profile" on users
  for update using (id = auth.uid());

-- Facilities: tenant isolation; clients only see their own facility
create policy "Tenant members see facilities" on facilities
  for select using (
    tenant_id = get_user_tenant_id() and (
      get_user_role() in ('company_admin','technician','super_admin')
      or client_user_id = auth.uid()
    )
  );

create policy "Admin/tech manage facilities" on facilities
  for all using (
    tenant_id = get_user_tenant_id()
    and get_user_role() in ('company_admin','technician','super_admin')
  );

-- Equipment: tenant isolation
create policy "Tenant members see equipment" on equipment
  for select using (tenant_id = get_user_tenant_id());

create policy "Admin/tech manage equipment" on equipment
  for all using (
    tenant_id = get_user_tenant_id()
    and get_user_role() in ('company_admin','technician','super_admin')
  );

-- Maintenance visits: tenant isolation
create policy "Tenant members see visits" on maintenance_visits
  for select using (tenant_id = get_user_tenant_id());

create policy "Admin/tech manage visits" on maintenance_visits
  for all using (
    tenant_id = get_user_tenant_id()
    and get_user_role() in ('company_admin','technician','super_admin')
  );

-- Maintenance records: tenant isolation; clients can see records for their facility
create policy "Tenant members see records" on maintenance_records
  for select using (tenant_id = get_user_tenant_id());

create policy "Admin/tech manage records" on maintenance_records
  for all using (
    tenant_id = get_user_tenant_id()
    and get_user_role() in ('company_admin','technician','super_admin')
  );

-- Report templates
create policy "Tenant members see templates" on report_templates
  for select using (tenant_id = get_user_tenant_id());

create policy "Admin manages templates" on report_templates
  for all using (
    tenant_id = get_user_tenant_id()
    and get_user_role() in ('company_admin','super_admin')
  );

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard > Storage)
-- ============================================================
-- Create these buckets manually in Supabase dashboard:
-- 1. "equipment-photos"   — public
-- 2. "facility-photos"    — public
-- 3. "maintenance-photos" — public
-- 4. "reports"            — private (accessed via signed URLs)
-- 5. "logos"              — public

-- ============================================================
-- SEED: Create the first super_admin tenant (True North Mechanical)
-- Run this AFTER creating your Supabase Auth user
-- Replace 'YOUR-AUTH-USER-ID' with the UUID from auth.users
-- ============================================================

-- Step 1: Insert tenant
-- insert into tenants (name, contact_email, brand_color)
-- values ('True North Mechanical', 'keith@truenorth-mechanical.com', '#193140')
-- returning id;

-- Step 2: Insert user (replace UUIDs)
-- insert into users (id, tenant_id, email, full_name, role)
-- values ('YOUR-AUTH-USER-ID', 'TENANT-ID-FROM-STEP-1', 'keith@truenorth-mechanical.com', 'Keith Craig', 'company_admin');

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index idx_equipment_facility on equipment(facility_id);
create index idx_equipment_tenant on equipment(tenant_id);
create index idx_facilities_tenant on facilities(tenant_id);
create index idx_maintenance_records_equipment on maintenance_records(equipment_id);
create index idx_maintenance_records_tenant on maintenance_records(tenant_id);
create index idx_maintenance_visits_facility on maintenance_visits(facility_id);
create index idx_users_tenant on users(tenant_id);
