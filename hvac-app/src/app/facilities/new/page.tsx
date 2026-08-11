'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Camera, Building2 } from 'lucide-react'

export default function NewFacilityPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    province: 'AB',
    postal_code: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Facility name is required'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single()

    let photo_url: string | undefined

    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${profile!.tenant_id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('facility-photos')
        .upload(path, photoFile)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('facility-photos').getPublicUrl(path)
        photo_url = publicUrl
      }
    }

    const { data: facility, error: insertError } = await supabase
      .from('facilities')
      .insert({
        tenant_id: profile!.tenant_id,
        ...form,
        photo_url,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/facilities/${facility.id}`)
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/facilities" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Add Facility</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Facility Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Facility Photo</label>
          <label className="cursor-pointer block">
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden h-40">
                <img src={photoPreview} alt="Facility" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">Change Photo</p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center hover:border-blue-400 transition-colors">
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Take or upload facility photo</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Facility Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
            placeholder="e.g. Tim Hortons - Main St"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
          <input
            type="text"
            value={form.address}
            onChange={e => update('address', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={e => update('city', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="Fort McMurray"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              value={form.province}
              onChange={e => update('province', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140] bg-white"
            >
              {['AB','BC','SK','MB','ON','QC','NS','NB','NL','PE','YT','NT','NU'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Client Contact (Optional)</p>
          <div className="space-y-3">
            <input
              type="text"
              value={form.contact_name}
              onChange={e => update('contact_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="Contact name"
            />
            <input
              type="email"
              value={form.contact_email}
              onChange={e => update('contact_email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="Contact email (for report delivery)"
            />
            <input
              type="tel"
              value={form.contact_phone}
              onChange={e => update('contact_phone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="Contact phone"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140] resize-none"
            placeholder="Access instructions, special notes, etc."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#193140] text-white rounded-lg py-3 text-sm font-semibold hover:bg-[#1e3d52] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Facility'}
        </button>
      </form>
    </div>
  )
}
