-- ============================================================
-- 05: SCHEDULING + GOOGLE CALENDAR SYNC
-- Run after 04_recommendations_quotes.sql
-- ============================================================

alter table maintenance_visits add column if not exists google_event_id text;
alter table maintenance_visits add column if not exists reminder_sent_at timestamptz;

-- Per-tenant Google integration (refresh token stored encrypted at rest
-- by Supabase; app only ever holds it server-side, never sent to client)
create table if not exists tenant_integrations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade unique,
  google_refresh_token text,
  google_calendar_id text,
  jabber_webhook_url text,   -- Cisco Jabber / XMPP bridge endpoint, if the company has one
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tenant_integrations enable row level security;
create policy "Admin manages integrations" on tenant_integrations
  for all using (tenant_id = get_user_tenant_id() and get_user_role() in ('company_admin','super_admin'));

create index idx_visits_scheduled_date on maintenance_visits(scheduled_date);
