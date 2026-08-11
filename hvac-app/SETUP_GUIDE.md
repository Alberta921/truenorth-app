# HVAC Maintenance Manager — Setup Guide

## What you're launching

A multi-tenant SaaS web app that:
- Technicians photograph equipment nameplates → AI auto-identifies the unit
- Auto-generates the correct seasonal maintenance checklist (Tier 1/2/3)
- Records all amperages, pressures, air temps, gas pressures
- Generates a branded professional PDF report for each client
- Clients log in to their portal to view all past reports

---

## Step 1: Create accounts (free)

### Supabase (your database)
1. Go to supabase.com → Sign up free
2. Create a new project (name it "hvac-maintenance")
3. Choose a strong database password — save it
4. Wait for project to provision (~2 min)

### Vercel (your hosting)
1. Go to vercel.com → Sign up free (use GitHub)
2. You'll connect this in Step 4

### GitHub (code storage)
1. Go to github.com → Sign up free
2. Create a new private repository named "hvac-maintenance-app"

---

## Step 2: Set up Supabase database

1. In your Supabase project, go to: **SQL Editor → New query**
2. Open the file `supabase/schema.sql` from this package
3. Paste the entire contents into the SQL editor
4. Click **Run** — you should see "Success"

### Create storage buckets
In Supabase → **Storage** → create these 5 buckets:

| Bucket name | Public? |
|---|---|
| equipment-photos | Yes (public) |
| facility-photos | Yes (public) |
| maintenance-photos | Yes (public) |
| reports | No (private) |
| logos | Yes (public) |

---

## Step 3: Configure environment variables

1. In Supabase → **Project Settings → API**
2. Copy:
   - Project URL
   - anon (public) key
   - service_role (secret) key

3. Create a file called `.env.local` in the app folder:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: Install and run locally (to test first)

Open a terminal, navigate to the app folder, then run:

```bash
npm install
npm run dev
```

Open your browser to: http://localhost:3000

---

## Step 5: Create your first account

1. Go to http://localhost:3000/auth/register
2. Enter:
   - Company name: True North Mechanical
   - Your name: Keith Craig
   - Email: keith@truenorth-mechanical.com
   - Password: (choose a strong one)
3. You'll be taken to the dashboard

---

## Step 6: Configure your company settings

1. Click **Settings** in the sidebar
2. Enter your company details
3. Upload your True North Mechanical logo
4. Enter your OpenAI API key (for AI nameplate reading)

### Getting an OpenAI API key:
1. Go to platform.openai.com → Sign up
2. Go to API Keys → Create new key
3. Copy it and paste it in Settings
4. Add a payment method (costs ~$0.01–0.05 per photo scan)

---

## Step 7: Deploy to Vercel (go live)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial setup"
git remote add origin https://github.com/YOUR-USERNAME/hvac-maintenance-app
git push -u origin main
```

2. Go to vercel.com → New Project
3. Import your GitHub repository
4. Add all environment variables (same as .env.local but with your production URL)
5. Change `NEXT_PUBLIC_APP_URL` to your Vercel URL
6. Click Deploy

Your app will be live at: **your-app.vercel.app**

---

## Step 8: Install on your phone (no app store needed)

**iPhone:**
1. Open Safari, go to your Vercel URL
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap Add

**Android:**
1. Open Chrome, go to your Vercel URL
2. Tap the three dots menu
3. Tap "Add to Home Screen"

It works just like a native app — camera, full screen, everything.

---

## How to use the app

### Adding a new client facility:
1. Dashboard → **Add Facility**
2. Take a photo of the building
3. Enter name (e.g. "Tim Hortons - Main St"), address, contact

### Adding equipment to a facility:
1. Open the facility → **Add Unit**
2. Take a photo of the unit
3. Take a photo of the nameplate → tap **Identify Equipment with AI**
4. AI fills in manufacturer, model, serial, tonnage automatically
5. Confirm the details, set the maintenance tier
6. Save

### Doing a maintenance visit:
1. Dashboard → **Start Maintenance**
2. Select the equipment
3. Select the season (app picks current season automatically)
4. Work through the checklist — tap each item as you complete it
5. Enter all measurements (amps, pressures, temps)
6. Take photos as needed
7. Add your technician notes
8. Tap **Save & Generate Report**

### Generating and sending the report:
1. From the report page, tap **Generate PDF Report**
2. A professional branded PDF is created with:
   - Your company logo
   - Facility info
   - Equipment details
   - Full checklist with checkmarks
   - All measurements in a table
   - Your technician notes
   - All service photos
3. Download or share directly with the client

---

## Adding technician accounts

1. Settings → (future: User Management)
2. For now: have technicians go to /auth/register and you manually update their role

In Supabase → Table Editor → users → find the technician → set role to "technician"

---

## Adding client portal access for clients

1. Go to Supabase → Table Editor → auth.users
2. Create an auth user for the client (or have them register)
3. In the users table, set their role to "client"
4. In the facilities table, set client_user_id to their user ID
5. Give them the URL: your-app.vercel.app/client/portal

---

## When you want to sell this to other HVAC companies

Each new company:
1. Goes to your-app.vercel.app/auth/register
2. Creates their account
3. Enters their own OpenAI API key in Settings
4. Uploads their own logo and brand colors
5. Their data is completely isolated from yours (Row Level Security)

You can add Stripe billing later — I can build that when you're ready.

---

## Files included

```
hvac-app/
├── supabase/schema.sql          ← Run this in Supabase first
├── .env.example                  ← Rename to .env.local, fill in values
├── SETUP_GUIDE.md               ← This file
├── src/
│   ├── app/                     ← All pages
│   │   ├── auth/login           ← Login page
│   │   ├── auth/register        ← Company signup
│   │   ├── dashboard            ← Main dashboard
│   │   ├── facilities           ← Facility management
│   │   ├── equipment            ← Equipment management
│   │   ├── maintenance/new      ← Maintenance form (field use)
│   │   ├── reports              ← Report history
│   │   ├── client/portal        ← Client-facing portal
│   │   ├── settings             ← Company + API settings
│   │   └── api/                 ← Backend API routes
│   ├── lib/
│   │   ├── maintenance/checklists.ts   ← All seasonal task lists
│   │   ├── openai/identify-equipment.ts ← AI nameplate reading
│   │   └── pdf/generate-report.tsx     ← PDF generation
│   └── types/index.ts           ← All TypeScript types
└── package.json
```

---

## Support

Built specifically for True North Mechanical. Questions or changes — continue the conversation in Sintra.
