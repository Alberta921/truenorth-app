import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Wrench, ChevronRight, Building2 } from 'lucide-react'
import { EQUIPMENT_TYPE_LABELS, TIER_LABELS } from '@/types'
import type { EquipmentType, MaintenanceTier } from '@/types'
import CacheWarmer from '@/components/offline/CacheWarmer'

export default async function FacilityDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: facility, error } = await supabase
    .from('facilities')
    .select('*, equipment(*)')
    .eq('id', params.id)
    .single()

  if (error || !facility) notFound()

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <CacheWarmer facilityId={facility.id} tenantId={facility.tenant_id} />
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/facilities" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{facility.name}</h1>
      </div>

      {/* Facility Photo */}
      {facility.photo_url && (
        <div className="rounded-xl overflow-hidden h-40 mb-4">
          <img src={facility.photo_url} alt={facility.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Facility Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {facility.address && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
              <p className="text-gray-800">{[facility.address, facility.city, facility.province].filter(Boolean).join(', ')}</p>
            </div>
          )}
          {facility.contact_name && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Contact</p>
              <p className="text-gray-800">{facility.contact_name}</p>
              {facility.contact_email && <p className="text-gray-500 text-xs">{facility.contact_email}</p>}
            </div>
          )}
        </div>
        {facility.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Notes</p>
            <p className="text-sm text-gray-600">{facility.notes}</p>
          </div>
        )}
      </div>

      {/* Equipment Section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Equipment</h2>
        <Link
          href={`/equipment/new?facility=${params.id}`}
          className="flex items-center gap-1.5 bg-[#193140] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#1e3d52] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Unit
        </Link>
      </div>

      {!facility.equipment || facility.equipment.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium mb-1">No equipment added yet</p>
          <p className="text-gray-400 text-xs mb-4">Add units to start tracking maintenance</p>
          <Link
            href={`/equipment/new?facility=${params.id}`}
            className="inline-flex items-center gap-2 bg-[#193140] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {facility.equipment
            .filter((eq: any) => eq.is_active)
            .map((eq: any) => (
              <Link
                key={eq.id}
                href={`/equipment/${eq.id}`}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                {eq.unit_photo_url ? (
                  <img src={eq.unit_photo_url} alt={eq.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{eq.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {EQUIPMENT_TYPE_LABELS[eq.equipment_type as EquipmentType]}
                    {eq.tonnage ? ` — ${eq.tonnage} Ton` : ''}
                    {eq.manufacturer ? ` — ${eq.manufacturer}` : ''}
                  </p>
                  <div className="mt-1.5">
                    <TierBadge tier={eq.maintenance_tier} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/maintenance/new?equipment=${eq.id}`}
                    onClick={e => e.stopPropagation()}
                    className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-md font-medium hover:bg-green-700 transition-colors"
                  >
                    Service
                  </Link>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}

function TierBadge({ tier }: { tier: number }) {
  const styles: Record<number, string> = {
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-gray-100 text-gray-700',
    3: 'bg-orange-100 text-orange-700',
  }
  const labels: Record<number, string> = {
    1: 'Tier 1 — Premium',
    2: 'Tier 2 — Standard',
    3: 'Tier 3 — Basic',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[tier] || styles[2]}`}>
      {labels[tier] || 'Tier 2'}
    </span>
  )
}
