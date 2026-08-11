import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle, Wrench } from 'lucide-react'
import { EQUIPMENT_TYPE_LABELS, SEASON_LABELS } from '@/types'
import type { EquipmentType } from '@/types'
import CacheWarmer from '@/components/offline/CacheWarmer'
import GenerateVisitReportButton from './GenerateVisitReportButton'

export default async function VisitDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: visit } = await supabase
    .from('maintenance_visits')
    .select('*, facility:facilities(*), technician:users(full_name)')
    .eq('id', params.id)
    .single()

  if (!visit) notFound()

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*, maintenance_records(id, service_date, season)')
    .eq('facility_id', visit.facility_id)
    .eq('is_active', true)
    .order('name')

  // "Done for this visit" = has a maintenance record from this visit_id
  const { data: visitRecords } = await supabase
    .from('maintenance_records')
    .select('id, equipment_id')
    .eq('visit_id', params.id)

  const completedEquipmentIds = new Set((visitRecords ?? []).map((r) => r.equipment_id))
  const allDone = (equipment ?? []).length > 0 && (equipment ?? []).every((e) => completedEquipmentIds.has(e.id))

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <CacheWarmer facilityId={visit.facility_id} tenantId={visit.tenant_id} />
      <Link href="/visits" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Visits
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h1 className="text-xl font-bold text-gray-900">{visit.facility?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {SEASON_LABELS[visit.season]} \u00b7 {visit.scheduled_date} {visit.technician?.full_name ? `\u00b7 ${visit.technician.full_name}` : ''}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {completedEquipmentIds.size} of {equipment?.length ?? 0} unit(s) done this visit
        </p>
      </div>

      <div className="grid gap-2 mb-6">
        {(equipment ?? []).map((e: any) => {
          const done = completedEquipmentIds.has(e.id)
          return (
            <Link
              key={e.id}
              href={`/maintenance/new?equipment=${e.id}&visit=${visit.id}`}
              className={`flex items-center gap-3 bg-white border rounded-xl p-4 hover:border-blue-300 transition-colors ${done ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
            >
              {done ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{e.name}</p>
                <p className="text-xs text-gray-400">{EQUIPMENT_TYPE_LABELS[e.equipment_type as EquipmentType]}</p>
              </div>
              <Wrench className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          )
        })}
      </div>

      {allDone && visit.status !== 'completed' && (
        <GenerateVisitReportButton visitId={visit.id} />
      )}
      {visit.status === 'completed' && (
        <p className="text-center text-sm text-green-700 bg-green-50 rounded-lg py-3">
          Visit complete \u2014 report sent to client
        </p>
      )}
    </div>
  )
}
