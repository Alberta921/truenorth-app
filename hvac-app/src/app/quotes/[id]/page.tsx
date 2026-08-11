import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import SendQuoteButton from './SendQuoteButton'

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, facility:facilities(name, contact_email)')
    .eq('id', params.id)
    .single()

  if (!quote) notFound()

  const isStaff = ['company_admin', 'technician', 'super_admin'].includes(profile.role)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{quote.quote_number}</h1>
            <p className="text-sm text-gray-500">{quote.facility?.name}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{quote.status}</span>
        </div>

        <table className="w-full text-sm mb-4">
          <thead className="text-gray-400 text-xs uppercase">
            <tr><th className="text-left py-2">Description</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(quote.line_items ?? []).map((i: any, idx: number) => (
              <tr key={idx}>
                <td className="py-2">{i.description}</td>
                <td className="text-right">{i.quantity}</td>
                <td className="text-right">${Number(i.unit_price).toFixed(2)}</td>
                <td className="text-right">${Number(i.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right text-sm text-gray-600 space-y-1 mb-4">
          <p>Subtotal ${Number(quote.subtotal).toFixed(2)}</p>
          <p>GST ${Number(quote.gst).toFixed(2)}</p>
          <p className="font-bold text-gray-900 text-base">Total ${Number(quote.total).toFixed(2)}</p>
        </div>

        {quote.notes && <p className="text-sm text-gray-600 border-t pt-3 mb-4">{quote.notes}</p>}

        {isStaff && quote.status === 'draft' && (
          <SendQuoteButton quoteId={quote.id} />
        )}
      </div>
    </div>
  )
}
