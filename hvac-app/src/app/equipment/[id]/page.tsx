import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wrench, FileText, ChevronRight } from 'lucide-react'
import { EQUIPMENT_TYPE_LABELS, TIER_LABELS, SEASON_LABELS } from '@/types'
import type { EquipmentType, Season } from '@/types'

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*, facilities(*)')
    .eq('id', params.id)
    .single()

  if (!equipment) notFound()

  const { data: records } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('equipment_id', params.id)
    .order('service_date', { ascending: false })
    .limit(10)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/facilities/${equipment.facility_id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{equipment.name}</h1>
          <p className="text-sm text-gray-500">{(equipment as any).facilities?.name}</p>
        </div>
        <Link
          href={`/maintenance/new?equipment=${params.id}`}
          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
        >
          <Wrench className="w-3.5 h-3.5" />
          Service Now
        </Link>
      </div>

      {/* Photos */}
      {(equipment.unit_photo_url || equipment.nameplate_photo_url) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {equipment.unit_photo_url && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Unit Photo</p>
              <img src={equipment.unit_photo_url} alt="Unit" className="w-full h-32 object-cover rounded-xl" />
            </div>
          )}
          {equipment.nameplate_photo_url && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Nameplate</p>
              <img src={equipment.nameplate_photo_url} alt="Nameplate" className="w-full h-32 object-cover rounded-xl" />
            </div>
          )}
        </div>
      )}

      {/* Equipment Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Detail label="Type" value={EQUIPMENT_TYPE_LABELS[equipment.equipment_type as EquipmentType]} />
          <Detail label="Maintenance Tier" value={TIER_LABELS[equipment.maintenance_tier as 1|2|3]} />
          {equipment.manufacturer && <Detail label="Manufacturer" value={equipment.manufacturer} />}
          {equipment.model_number && <Detail label="Model" value={equipment.model_number} />}
          {equipment.serial_number && <Detail label="Serial" value={equipment.serial_number} />}
          {equipment.tonnage && <Detail label="Tonnage" value={`${equipment.tonnage} Ton`} />}
          {equipment.voltage && <Detail label="Voltage" value={equipment.voltage} />}
          {equipment.refrigerant_type && <Detail label="Refrigerant" value={equipment.refrigerant_type} />}
          {equipment.year_installed && <Detail label="Year Installed" value={String(equipment.year_installed)} />}
          {equipment.location_in_facility && <Detail label="Location" value={equipment.location_in_facility} />}
          {equipment.filter_size && <Detail label="Filter Size" value={`${equipment.filter_size} × ${equipment.filter_quantity ?? 1}`} />}
          <Detail label="Blower Motor" value={equipment.has_blower_motor ? 'Yes — amp reading required' : 'None on this unit'} />
          <Detail label="Venter/Inducer Motor" value={equipment.has_venter_motor ? 'Yes — amp reading required' : 'None on this unit'} />
        </div>
        {equipment.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase mb-1">Notes</p>
            <p className="text-sm text-gray-600">{equipment.notes}</p>
          </div>
        )}
      </div>

      {/* Service History */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Service History</h2>
      {!records || records.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">No service records yet</p>
          <Link href={`/maintenance/new?equipment=${params.id}`}
            className="inline-block mt-3 text-sm text-blue-600 hover:underline">
            Start first maintenance visit
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {records.map((record: any) => (
            <Link key={record.id} href={`/reports/${record.id}`}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors group">
              <span className="text-lg">{
                record.season === 'winter' ? '❄️' : record.season === 'summer' ? '☀️' : record.season === 'fall' ? '🍂' : '🌱'
              }</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {SEASON_LABELS[record.season as Season]} Service
                </p>
                <p className="text-xs text-gray-500">{record.service_date} • Tier {record.maintenance_tier}</p>
              </div>
              <div className="flex items-center gap-2">
                {record.report_pdf_url && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">PDF</span>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}
