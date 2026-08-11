'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye, EyeOff, Loader2, Check } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [fetchingBranding, setFetchingBranding] = useState(false)
  const [brandingError, setBrandingError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website: '',
    openai_api_key: '',
    brand_color: '#193140',
    logo_url: '',
  })

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single()
    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', profile!.tenant_id).single()
    if (tenant) {
      setForm({
        name: tenant.name || '',
        contact_email: tenant.contact_email || '',
        contact_phone: tenant.contact_phone || '',
        address: tenant.address || '',
        website: tenant.website || '',
        openai_api_key: tenant.openai_api_key || '',
        brand_color: tenant.brand_color || '#193140',
        logo_url: tenant.logo_url || '',
      })
      if (tenant.logo_url) setLogoPreview(tenant.logo_url)
    }
    setLoading(false)
  }

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleFetchBranding() {
    setFetchingBranding(true)
    setBrandingError(null)
    try {
      const res = await fetch('/api/branding/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: form.website }),
      })
      const data = await res.json()
      if (data.error) {
        setBrandingError(data.error)
      } else if (data.branding) {
        if (data.branding.logoUrl) {
          setLogoPreview(data.branding.logoUrl)
          update('logo_url', data.branding.logoUrl)
        }
        if (data.branding.brandColor) {
          update('brand_color', data.branding.brandColor)
        }
        if (!data.branding.logoUrl && !data.branding.brandColor) {
          setBrandingError('Found the site but no clear logo — upload one manually below.')
        }
      }
    } catch {
      setBrandingError('Could not reach that site. You can still upload a logo file manually below.')
    } finally {
      setFetchingBranding(false)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single()

    let logo_url = form.logo_url

    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${profile!.tenant_id}/logo.${ext}`
      const { error: uploadError } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
        logo_url = publicUrl
      }
    }

    await supabase.from('tenants').update({
      ...form,
      logo_url,
    }).eq('id', profile!.tenant_id)

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Company details, branding, and API configuration</p>
      </div>

      <div className="space-y-6">
        {/* Company Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Company Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input type="text" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
              <div className="flex gap-2">
                <input type="text" value={form.website} onChange={e => update('website', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
                  placeholder="truenorth-mechanical.com" />
                <button type="button" onClick={handleFetchBranding} disabled={fetchingBranding || !form.website}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap">
                  {fetchingBranding ? 'Fetching…' : 'Pull logo from site'}
                </button>
              </div>
              {brandingError && <p className="text-xs text-amber-600 mt-1">{brandingError}</p>}
              <p className="text-xs text-gray-400 mt-1">
                For a new company buying the app: enter their site, pull their logo/colors here, then confirm below before saving.
              </p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Report Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Company Logo</label>
              {logoPreview && (
                <div className="mb-3 p-3 border rounded-lg bg-gray-50">
                  <img src={logoPreview} alt="Logo" className="h-12 object-contain" />
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                Upload Logo
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-1">PNG or JPG, displayed on all client reports</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Brand Color (for report headers)</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.brand_color} onChange={e => update('brand_color', e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-300" />
                <input type="text" value={form.brand_color} onChange={e => update('brand_color', e.target.value)}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]" />
              </div>
            </div>
          </div>
        </div>

        {/* OpenAI */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">AI Equipment Identification</h2>
          <p className="text-xs text-gray-400 mb-4">
            Your OpenAI API key powers the automatic equipment identification from nameplate photos.
            Get yours at platform.openai.com — each photo analysis costs approximately $0.01–0.05.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">OpenAI API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={form.openai_api_key}
                onChange={e => update('openai_api_key', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#193140] font-mono"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <a href="/settings/markup" className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
          <p className="font-semibold text-gray-900">Markup & Labour Rates →</p>
          <p className="text-sm text-gray-500 mt-1">Edit the parts markup sliding scale and default labour rates</p>
        </a>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#193140] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1e3d52] disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4" />Saved!</>
          ) : (
            <><Save className="w-4 h-4" />Save Settings</>
          )}
        </button>
      </div>
    </div>
  )
}
