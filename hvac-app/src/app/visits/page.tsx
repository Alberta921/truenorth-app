import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CalendarClock, CheckCircle2 } from 'lucide-react'
import { SEASON_LABELS } from '@/types'

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700', in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700', cancelled: 'bg-gray-100 text-gray-500',
}

export default async function VisitsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const { data: visits } = await supabase
    .from('maintenance_visits')
    .select('*, facility:facilities(name), technician:users(full_name)')
    .eq('tenant_id', profile.tenant_id)
    .order('scheduled_date', { ascending: true })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduled Visits</h1>
          <p className="text-gray-500 text-sm mt-1">Scheduling a visit here is what triggers automatic parts pre-ordering</p>
        </div>
        <Link href="/visits/new" className="flex items-center gap-2 bg-[#193140] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors">
          <Plus className="w-4 h-4" /> Schedule Visit
        </Link>
      </div>

      {!visits || visits.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium mb-2">No visits scheduled</h3>
          <p className="text-gray-400 text-sm mb-6">Schedule a visit and the app will pre-order any parts that facility's equipment needs</p>
          <Link href="/visits/new" className="inline-flex items-center gap-2 bg-[#193140] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors">
            <Plus className="w-4 h-4" /> Schedule First Visit
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {visits.map((v: any) => (
            <Link key={v.id} href={`/visits/${v.id}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
              <div>
                <p className="font-semibold text-gray-900">{v.facility?.name}</p>
                <p className="text-sm text-gray-500">{SEASON_LABELS[v.season as keyof typeof SEASON_LABELS]} — {v.scheduled_date} {v.technician?.full_name ? `· ${v.technician.full_name}` : ''}</p>
              </div>
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[v.status]}`}>
                {v.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {v.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
