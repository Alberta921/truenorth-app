import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, ChevronRight, Download } from 'lucide-react'
import { SEASON_LABELS } from '@/types'
import type { Season } from '@/types'

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

  const { data: records } = await supabase
    .from('maintenance_records')
    .select('*, equipment(name, equipment_type, facilities(name))')
    .eq('tenant_id', profile!.tenant_id)
    .order('service_date', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">All service records and reports</p>
      </div>

      {!records || records.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium mb-2">No reports yet</h3>
          <p className="text-gray-400 text-sm mb-6">Complete a maintenance visit to generate your first report</p>
          <Link href="/maintenance/new" className="inline-flex items-center gap-2 bg-[#193140] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors">
            Start Maintenance
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {records.map((record: any) => (
            <Link
              key={record.id}
              href={`/reports/${record.id}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                record.season === 'winter' ? 'bg-blue-100' :
                record.season === 'summer' ? 'bg-yellow-100' :
                record.season === 'fall' ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                <span className="text-lg">{
                  record.season === 'winter' ? '❄️' :
                  record.season === 'summer' ? '☀️' :
                  record.season === 'fall' ? '🍂' : '🌱'
                }</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {record.equipment?.name || 'Unknown equipment'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(record.equipment as any)?.facilities?.name || ''} •{' '}
                  {SEASON_LABELS[record.season as Season]} •{' '}
                  {record.service_date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {record.report_pdf_url && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">PDF ready</span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
