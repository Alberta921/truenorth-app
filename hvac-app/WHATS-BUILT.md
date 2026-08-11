# What's actually built vs. what's next

This replaces the old AI-Handoff-Document — that doc described 8 database
schema files and a full feature set; the code it came with only had 1 of
those files. Everything below reflects what's actually in this codebase
as of today.

## Working end-to-end
- Multi-tenant auth, facilities, equipment across **HVAC, refrigeration,
  exhaust, MUA, boilers, ice machines, chillers, condensing units, and
  plumbing** — full seasonal, tiered (Gold/Silver/Bronze) checklists for
  every category
- AI nameplate reading (GPT-4o Vision) on equipment photos
- Single-equipment and **full multi-equipment visit** PDF reports — one
  branded document covering everything serviced that day, emailed to the
  client automatically when the last unit on a visit is finished
- **Visit scheduling** (`/visits`) — the missing link that makes
  everything else actually trigger: schedule a visit, and that's what
  starts the parts pre-order countdown and gives the tech a guided
  facility-by-facility, unit-by-unit worklist
- **Parts pre-order engine**: attach parts to equipment, and a daily job
  emails your suppliers an order ahead of each scheduled visit, referencing
  your account number. Manager gets notified to call in the PO.
- **Manual multi-supplier ordering**: `/parts/order` — one cart, split
  automatically across every supplier by their assigned parts
- **Client self-service parts ordering** — clients can order parts
  themselves through their portal at your sell price, with cost/margin
  physically stripped out at three separate layers (view, RLS, insert
  trigger) so there's no path for that data to leak to a client session
- **Editable markup tiers and labour rates** — `/settings/markup`
- **Recommendations → Quotes**, now created **directly from the
  maintenance form** — a tech flags something during the visit, the
  office sees it in the queue immediately, no separate step
- **Voice-to-report**: tap-to-talk notes + AI cleanup into report language
- **Website → logo/brand pull** for onboarding future tenants
- Real role-based route protection in middleware
- **Offline-first field entry**: maintenance records and photos save
  straight to the device the instant a tech taps Save, sync automatically
  when signal returns, installable as a PWA
- Dashboard now shows upcoming scheduled visits at a glance

## Honest limitations
- **Nothing here has been deployed or run against a live Supabase
  project.** This is the single biggest gap between "code" and "app" —
  see the deploy checklist below.
- True "click and it's ordered" with Sinclair's/Wolseley/MCO/etc. isn't
  possible without those suppliers offering API/EDI access, which they
  don't to small contractors — the built version (one cart, split by
  supplier, proper PO email with your account number) is the realistic
  ceiling for that idea.
- Google Calendar sync and Jabber reminders aren't built — schema has a
  placeholder (`tenant_integrations` table) but no working sync code
- Offline support covers the maintenance form; equipment photo capture
  and nameplate scanning during initial setup still need a connection
  (that step calls GPT-4o Vision, which inherently needs a connection
  regardless)
- "Search the internet for every HVAC/plumbing model ever made" isn't
  realistic as a standalone feature — the nameplate photo AI reading is
  the reliable version of that idea, and it's what's built

## Deploy checklist (this is what's actually left to reach "app status")
1. Create a Supabase project
2. Run all SQL files in `/supabase` **in exact numeric order**
   (schema.sql, then 02 through 09) — a version-conflict between two
   files trying to create the same table was caught and fixed during
   this build; the current numbering is conflict-free
3. Create the 5 storage buckets: equipment-photos, facility-photos,
   maintenance-photos, reports (private), logos
4. Push to GitHub, import into Vercel, add every env var from
   `.env.example`
5. Register the first account, upload the logo, add suppliers and parts
6. Schedule one real visit and run it start to finish on a phone — this
   is the point where real problems surface that no amount of code
   review catches
