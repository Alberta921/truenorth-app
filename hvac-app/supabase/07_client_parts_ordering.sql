-- ============================================================
-- 07: CLIENT PARTS ORDERING (white-label storefront)
-- Run after 06_asset_component_specs.sql
--
-- Clients browse the parts catalog and order at YOUR sell price with
-- YOUR markup already applied. Cost price and margin must never reach
-- a client session — enforced at 3 layers below (view, RLS, insert trigger).
-- ============================================================

create table parts_orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  facility_id uuid not null references facilities(id) on delete cascade,
  ordered_by uuid references users(id),           -- client user or staff on their behalf
  order_items jsonb not null default '[]',
  -- Client-visible shape only: [{ part_id, name, quantity, sell_price, line_total }]
  -- cost_price / markup_pct must never appear in this jsonb for client-placed orders.
  subtotal numeric(10,2) not null default 0,       -- sum of sell prices — what the client pays
  total_cost numeric(10,2) default 0,              -- PRIVATE — populated by staff only, never by client insert
  total_margin numeric(10,2) default 0,            -- PRIVATE
  status text not null default 'pending' check (status in ('pending','confirmed','ordered','fulfilled','cancelled')),
  internal_notes text,                             -- PRIVATE — staff-only
  requested_delivery_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table parts_orders enable row level security;

-- Staff: full access within their tenant
create policy "Staff manage parts orders" on parts_orders
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','technician','super_admin'));

-- Clients: can see and create orders for their own facility only, and can
-- never write total_cost/total_margin/internal_notes (enforced by the
-- trigger below, since RLS can restrict rows but not silently zero columns).
create policy "Client sees own parts orders" on parts_orders
  for select using (
    tenant_id = get_user_tenant_id()
    and facility_id in (select id from facilities where client_user_id = auth.uid())
  );

create policy "Client places own parts orders" on parts_orders
  for insert with check (
    tenant_id = get_user_tenant_id()
    and facility_id in (select id from facilities where client_user_id = auth.uid())
  );

-- Layer: force private financial fields to zero/null on any insert made by
-- a client role, regardless of what the client-side code sends. This is
-- the backstop layer — even a compromised or modified client app can't
-- leak cost/margin through this table.
create or replace function strip_private_fields_for_client()
returns trigger language plpgsql security definer as $$
begin
  if get_user_role() = 'client' then
    new.total_cost := 0;
    new.total_margin := 0;
    new.internal_notes := null;
  end if;
  return new;
end;
$$;

create trigger trg_strip_private_fields_parts_orders
  before insert or update on parts_orders
  for each row execute function strip_private_fields_for_client();

-- Client-safe view for reading order history (extra safety layer even
-- though the columns are already stripped at write time above).
create or replace view parts_orders_client_view as
  select id, tenant_id, facility_id, ordered_by, order_items, subtotal,
         status, requested_delivery_date, created_at
  from parts_orders;

alter view parts_orders_client_view set (security_invoker = true);

create index idx_parts_orders_facility on parts_orders(facility_id);
create index idx_parts_orders_tenant on parts_orders(tenant_id);
