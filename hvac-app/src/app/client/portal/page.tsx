import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Wrench, Lightbulb, Receipt, LogOut, ShoppingCart } from 'lucide-react'
import PartsOrderSheet from '@/components/parts/PartsOrderSheet'

// Client-only view. Middleware already blocks non-client roles from reaching
// this route and blocks clients from reaching every other route — this page
// only ever queries data scoped to the logged-in client's own facility.
export default async function ClientPortalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, name, address')
    .eq('client_user_id', user.id)

  const facilityIds = (facilities ?? []).map((f) => f.id)

  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, name, equipment_type, maintenance_tier, facility_id')
    .in('facility_id', facilityIds)

  const { data: records } = await supabase
    .from('maintenance_records')
    .select('id, service_date, season, equipment_id, report_pdf_url, equipment(name, facility_id)')
    .in('equipment_id', (equipment ?? []).map((e) => e.id))
    .order('service_date', { ascending: false })
    .limit(10)

  // Recommendations use the client-scoped RLS policy — clients only ever
  // see recommendations tied to equipment on their own facility.
  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('id, title, description, priority, status, equipment(name)')
    .in('equipment_id', (equipment ?? []).map((e) => e.id))
    .eq('status', 'open')

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, total, status, facility(name)')
    .in('facility_id', facilityIds)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#193140] p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">Client Portal</h1>
          <form action="/api/auth/signout" method="post">
            <button className="text-blue-200 text-sm flex items-center gap-1 hover:text-white"><LogOut className="w-4 h-4" /> Sign out</button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {facilities?.map((f) => (
          <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-900">{f.name}</h2>
            <p className="text-sm text-gray-500">{f.address}</p>
          </div>
        ))}

        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" /> Your Equipment</h3>
          <div className="grid gap-2">
            {(equipment ?? []).map((e: any) => (
              <div key={e.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex justify-between text-sm">
                <span className="font-medium text-gray-900">{e.name}</span>
                <span className="text-gray-500">Tier {e.maintenance_tier}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Recent Reports</h3>
          <div className="grid gap-2">
            {(records ?? []).map((r: any) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-center text-sm">
                <span>{r.equipment?.name} — {r.season} {r.service_date}</span>
                {r.report_pdf_url && <a href={r.report_pdf_url} className="text-blue-600 font-medium">View PDF</a>}
              </div>
            ))}
          </div>
        </section>

        {recommendations && recommendations.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Technician Recommendations</h3>
            <div className="grid gap-2">
              {recommendations.map((r: any) => (
                <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                  <p className="font-medium text-amber-900">{r.title} — {r.equipment?.name}</p>
                  <p className="text-amber-700 mt-1">{r.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {quotes && quotes.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Receipt className="w-4 h-4" /> Quotes</h3>
            <div className="grid gap-2">
              {quotes.map((q: any) => (
                <Link key={q.id} href={`/quotes/${q.id}`} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex justify-between text-sm hover:border-blue-300">
                  <span>{q.quote_number}</span>
                  <span className="font-medium">${Number(q.total).toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {facilities && facilities.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Order Parts</h3>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <PartsOrderSheet facilityId={facilities[0].id} isClient={true} />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
