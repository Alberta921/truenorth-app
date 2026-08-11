import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Building2, ChevronRight, Wrench } from 'lucide-react'

export default async function FacilitiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: facilities } = await supabase
    .from('facilities')
    .select('*, equipment(id)')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facilities</h1>
          <p className="text-gray-500 text-sm mt-1">All client locations you service</p>
        </div>
        <Link
          href="/facilities/new"
          className="flex items-center gap-2 bg-[#193140] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Facility
        </Link>
      </div>

      {!facilities || facilities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium mb-2">No facilities yet</h3>
          <p className="text-gray-400 text-sm mb-6">Add your first client facility to get started</p>
          <Link
            href="/facilities/new"
            className="inline-flex items-center gap-2 bg-[#193140] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Facility
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {facilities.map((facility: any) => (
            <Link
              key={facility.id}
              href={`/facilities/${facility.id}`}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              {facility.photo_url ? (
                <img
                  src={facility.photo_url}
                  alt={facility.name}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-blue-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{facility.name}</p>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {[facility.address, facility.city].filter(Boolean).join(', ') || 'No address'}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Wrench className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {facility.equipment?.length || 0} unit{facility.equipment?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
