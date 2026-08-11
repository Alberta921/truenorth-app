import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Receipt } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-amber-50 text-amber-700', approved: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
}

export default async function QuotesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const isClient = profile.role === 'client'
  let query = supabase.from('quotes').select('*, facility:facilities(name)').eq('tenant_id', profile.tenant_id)
  if (isClient) {
    const { data: myFacilities } = await supabase.from('facilities').select('id').eq('client_user_id', user.id)
    query = query.in('facility_id', (myFacilities ?? []).map((f) => f.id))
  }
  const { data: quotes } = await query.order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-500 text-sm mt-1">{isClient ? 'Quotes for your facilities' : 'Sent to clients from the recommendations queue'}</p>
      </div>

      {!quotes || quotes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium">No quotes yet</h3>
        </div>
      ) : (
        <div className="grid gap-3">
          {quotes.map((q: any) => (
            <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
              <div>
                <p className="font-semibold text-gray-900">{q.quote_number} — {q.facility?.name}</p>
                <p className="text-sm text-gray-500">${Number(q.total).toFixed(2)}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[q.status]}`}>{q.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
