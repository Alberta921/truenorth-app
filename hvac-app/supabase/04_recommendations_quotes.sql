-- ============================================================
-- 04: RECOMMENDATIONS + QUOTES
-- Run after 03_suppliers_parts_procurement.sql
-- Captures "the technician said this should be done" and turns
-- it into a quote the office can send to the client.
-- ============================================================

create table recommendations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  maintenance_record_id uuid references maintenance_records(id) on delete set null,
  visit_id uuid references maintenance_visits(id) on delete set null,
  created_by uuid references users(id),
  priority text not null default 'monitor' check (priority in ('urgent','recommended','monitor')),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','quoted','approved','declined','completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quotes (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  facility_id uuid not null references facilities(id) on delete cascade,
  recommendation_id uuid references recommendations(id) on delete set null,
  quote_number text not null,
  line_items jsonb not null default '[]',
  -- [{ description, quantity, unit_price, total }]
  subtotal numeric(10,2) default 0,
  gst numeric(10,2) default 0,
  total numeric(10,2) default 0,
  status text not null default 'draft' check (status in ('draft','sent','viewed','approved','declined')),
  sent_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create sequence if not exists quote_number_seq;
create or replace function generate_quote_number()
returns text language plpgsql as $$
declare
  next_val integer;
begin
  next_val := nextval('quote_number_seq');
  return 'Q-' || to_char(now(), 'YYYY') || '-' || lpad(next_val::text, 4, '0');
end;
$$;

alter table recommendations enable row level security;
alter table quotes enable row level security;

-- Staff see everything; clients see recommendations tied to their own facility
create policy "Staff see recommendations" on recommendations
  for select using (
    tenant_id = get_user_tenant_id() and (
      get_user_role() in ('company_admin','technician','super_admin')
      or equipment_id in (
        select e.id from equipment e
        join facilities f on f.id = e.facility_id
        where f.client_user_id = auth.uid()
      )
    )
  );
create policy "Staff manage recommendations" on recommendations
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','technician','super_admin'));

create policy "Facility client sees own quotes" on quotes
  for select using (
    tenant_id = get_user_tenant_id() and (
      get_user_role() in ('company_admin','technician','super_admin')
      or facility_id in (select id from facilities where client_user_id = auth.uid())
    )
  );
create policy "Admin manages quotes" on quotes
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

create index idx_recommendations_equipment on recommendations(equipment_id);
create index idx_recommendations_tenant on recommendations(tenant_id);
create index idx_quotes_facility on quotes(facility_id);
create index idx_quotes_tenant on quotes(tenant_id);
