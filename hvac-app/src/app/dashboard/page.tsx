import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Wrench, FileText, Plus, ChevronRight, CalendarClock } from 'lucide-react'
import { getCurrentSeason, TIER_DESCRIPTIONS } from '@/lib/maintenance/checklists'
import { SEASON_LABELS } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  // Stats
  const [facilitiesResult, equipmentResult, recentRecordsResult, upcomingVisitsResult] = await Promise.all([
    supabase.from('facilities').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id).eq('is_active', true),
    supabase.from('equipment').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id).eq('is_active', true),
    supabase.from('maintenance_records')
      .select('*, equipment(name, equipment_type), facilities:equipment(facility_id(name))')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('maintenance_visits')
      .select('id, scheduled_date, season, status, facility:facilities(id, name)')
      .eq('tenant_id', profile.tenant_id)
      .in('status', ['scheduled', 'in_progress'])
      .order('scheduled_date', { ascending: true })
      .limit(6),
  ])

  const currentSeason = getCurrentSeason()
  const upcomingVisits = upcomingVisitsResult.data ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {profile.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {SEASON_LABELS[currentSeason]} season
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Active Facilities"
          value={String(facilitiesResult.count ?? 0)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          href="/facilities"
          color="blue"
        />
        <StatCard
          label="Equipment Units"
          value={String(equipmentResult.count ?? 0)}
          icon={<Wrench className="w-5 h-5 text-green-600" />}
          href="/facilities"
          color="green"
        />
        <StatCard
          label="Reports This Month"
          value="—"
          icon={<FileText className="w-5 h-5 text-purple-600" />}
          href="/reports"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/maintenance/new"
          className="flex items-center gap-4 p-5 bg-[#193140] rounded-xl text-white hover:bg-[#1e3d52] transition-colors group"
        >
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Start Maintenance</p>
            <p className="text-sm text-blue-200 mt-0.5">Log a service visit and generate report</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
        </Link>

        <Link
          href="/facilities/new"
          className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Add Facility</p>
            <p className="text-sm text-gray-500 mt-0.5">Register a new client location</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
        </Link>
      </div>

      {/* Upcoming Visits — scheduling one here is what triggers parts pre-ordering */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Visits</h2>
          <Link href="/visits" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {upcomingVisits.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center">
            <CalendarClock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">Nothing scheduled — parts won't pre-order until a visit is on the calendar</p>
            <Link href="/visits/new" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600">
              <Plus className="w-4 h-4" /> Schedule a visit
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {upcomingVisits.map((v: any) => (
              <Link key={v.id} href={`/visits/${v.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.facility?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{SEASON_LABELS[v.season as keyof typeof SEASON_LABELS]} \u2014 {v.scheduled_date}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Current Season */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{seasonEmoji(currentSeason)}</span>
          <h3 className="font-semibold text-amber-900">{SEASON_LABELS[currentSeason]} Season Maintenance</h3>
        </div>
        <p className="text-sm text-amber-800">
          {seasonDescription(currentSeason)}
        </p>
      </div>

      {/* Recent Records */}
      {recentRecordsResult.data && recentRecordsResult.data.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Service Records</h2>
            <Link href="/reports" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {recentRecordsResult.data.map((record: any) => (
              <Link
                key={record.id}
                href={`/reports/${record.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{record.equipment?.name || 'Unknown equipment'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {SEASON_LABELS[record.season as keyof typeof SEASON_LABELS]} service — {record.service_date}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, href, color }: {
  label: string
  value: string
  icon: React.ReactNode
  href: string
  color: string
}) {
  return (
    <Link href={href} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 bg-${color}-50 rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </Link>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function seasonEmoji(season: string) {
  const emojis: Record<string, string> = {
    spring: '🌱',
    summer: '☀️',
    fall: '🍂',
    winter: '❄️',
  }
  return emojis[season] || '🔧'
}

function seasonDescription(season: string) {
  const descriptions: Record<string, string> = {
    spring: 'Time to prep cooling systems. Clean condenser coils, check refrigerant levels, test AC operation before the heat arrives.',
    summer: 'Peak cooling season. Monitor refrigerant pressures, clean coils as needed, verify temperature differentials.',
    fall: 'Critical heating prep. Clean burners, test ignition systems, check heat exchangers for cracks before winter.',
    winter: 'Heating season is on. Verify gas pressures, check for flue blockage, ensure economizer freeze protection.',
  }
  return descriptions[season] || 'Perform seasonal maintenance on all equipment.'
}
