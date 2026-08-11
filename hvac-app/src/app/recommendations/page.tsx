import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lightbulb, AlertTriangle } from 'lucide-react'

const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  recommended: 'bg-amber-50 text-amber-700 border-amber-200',
  monitor: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default async function RecommendationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const { data: recs } = await supabase
    .from('recommendations')
    .select('*, equipment(name, facility:facilities(id, name))')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'open')
    .order('priority')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recommendations Queue</h1>
        <p className="text-gray-500 text-sm mt-1">Everything a technician flagged during a visit that needs a decision or a quote</p>
      </div>

      {!recs || recs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium mb-2">Nothing pending</h3>
          <p className="text-gray-400 text-sm">Technician recommendations will show up here after a visit</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {recs.map((r: any) => (
            <div key={r.id} className={`border rounded-xl p-4 ${PRIORITY_STYLE[r.priority]}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {r.priority === 'urgent' && <AlertTriangle className="w-4 h-4" />}
                    <p className="font-semibold">{r.title}</p>
                  </div>
                  <p className="text-sm mt-1 opacity-90">{r.description}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {r.equipment?.name} — {r.equipment?.facility?.name}
                  </p>
                </div>
                <Link
                  href={`/quotes/new?recommendation=${r.id}`}
                  className="flex-shrink-0 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Build Quote
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
