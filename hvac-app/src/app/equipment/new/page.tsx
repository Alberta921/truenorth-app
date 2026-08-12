'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Camera, Sparkles, Loader2, Check } from 'lucide-react'
import { EQUIPMENT_TYPE_LABELS, TIER_LABELS, HVAC_EQUIPMENT_TYPES, PLUMBING_EQUIPMENT_TYPES } from '@/types'
import type { EquipmentType, MaintenanceTier, EquipmentIdentificationResult } from '@/types'

const EQUIPMENT_TYPES = Object.entries(EQUIPMENT_TYPE_LABELS) as [EquipmentType, string][]
const TIERS: [MaintenanceTier, string][] = [[1, 'Tier 1 — Premium'], [2, 'Tier 2 — Standard'], [3, 'Tier 3 — Basic']]

function NewEquipmentPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const facilityId = searchParams.get('facility')
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiSuccess, setAiSuccess] = useState(false)

  const [unitPhotoPreview, setUnitPhotoPreview] = useState<string | null>(null)
  const [nameplatePhotoPreview, setNameplatePhotoPreview] = useState<string | null>(null)
  const [unitPhotoFile, setUnitPhotoFile] = useState<File | null>(null)
  const [nameplatePhotoFile, setNameplatePhotoFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: '',
    equipment_type: 'RTU' as EquipmentType,
    manufacturer: '',
    model_number: '',
    serial_number: '',
    tonnage: '',
    btu_capacity: '',
    voltage: '',
    refrigerant_type: '',
    year_installed: '',
    location_in_facility: '',
    maintenance_tier: 2 as MaintenanceTier,
    has_blower_motor: true,
    has_venter_motor: false,
    filter_size: '',
    filter_quantity: 1,
    notes: '',
  })

  function update(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'unit' | 'nameplate'
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    if (type === 'unit') setUnitPhotoFile(file)
    else setNameplatePhotoFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      if (type === 'unit') setUnitPhotoPreview(reader.result as string)
      else setNameplatePhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleIdentifyWithAI() {
    if (!nameplatePhotoFile && !nameplatePhotoPreview) {
      setError('Please take a photo of the equipment nameplate first')
      return
    }
    setAiLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      if (nameplatePhotoFile) formData.append('image', nameplatePhotoFile)
      if (nameplatePhotoPreview) formData.append('imageData', nameplatePhotoPreview)

      const response = await fetch('/api/equipment/identify', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'AI identification failed')
      }

      const result: EquipmentIdentificationResult = await response.json()

      setForm(prev => ({
        ...prev,
        equipment_type: result.equipment_type || prev.equipment_type,
        manufacturer: result.manufacturer || prev.manufacturer,
        model_number: result.model_number || prev.model_number,
        serial_number: result.serial_number || prev.serial_number,
        tonnage: result.tonnage ? String(result.tonnage) : prev.tonnage,
        btu_capacity: result.btu_capacity ? String(result.btu_capacity) : prev.btu_capacity,
        voltage: result.voltage || prev.voltage,
        refrigerant_type: result.refrigerant_type || prev.refrigerant_type,
        year_installed: result.year || prev.year_installed,
        notes: result.notes
          ? prev.notes
            ? `${prev.notes}\n\nAI note: ${result.notes}`
            : `AI note: ${result.notes}`
          : prev.notes,
      }))

      setAiSuccess(true)
      setTimeout(() => setAiSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'AI identification failed. Please fill in details manually.')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Equipment name is required'); return }
    if (!facilityId) { setError('No facility selected'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single()

    let unit_photo_url: string | undefined
    let nameplate_photo_url: string | undefined

    for (const [file, bucket, field] of [
      [unitPhotoFile, 'equipment-photos', 'unit'],
      [nameplatePhotoFile, 'equipment-photos', 'nameplate'],
    ] as [File | null, string, string][]) {
      if (!file) continue
      const ext = file.name.split('.').pop()
      const path = `${profile!.tenant_id}/${Date.now()}-${field}.${ext}`
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
        if (field === 'unit') unit_photo_url = publicUrl
        else nameplate_photo_url = publicUrl
      }
    }

    const { data: equipment, error: insertError } = await supabase
      .from('equipment')
      .insert({
        facility_id: facilityId,
        tenant_id: profile!.tenant_id,
        name: form.name,
        equipment_type: form.equipment_type,
        manufacturer: form.manufacturer || null,
        model_number: form.model_number || null,
        serial_number: form.serial_number || null,
        tonnage: form.tonnage ? parseFloat(form.tonnage) : null,
        btu_capacity: form.btu_capacity ? parseInt(form.btu_capacity) : null,
        voltage: form.voltage || null,
        refrigerant_type: form.refrigerant_type || null,
        year_installed: form.year_installed ? parseInt(form.year_installed) : null,
        location_in_facility: form.location_in_facility || null,
        maintenance_tier: form.maintenance_tier,
        has_blower_motor: form.has_blower_motor,
        has_venter_motor: form.has_venter_motor,
        filter_size: form.filter_size || null,
        filter_quantity: form.filter_quantity,
        notes: form.notes || null,
        unit_photo_url,
        nameplate_photo_url,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/equipment/${equipment.id}`)
  }

  return (
    <div className="p-4 max-w-xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href={facilityId ? `/facilities/${facilityId}` : '/facilities'} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Add Equipment</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {aiSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Equipment identified! Review and confirm the details below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Unit Photo</label>
            <label className="cursor-pointer block">
              {unitPhotoPreview ? (
                <div className="relative rounded-xl overflow-hidden h-28">
                  <img src={unitPhotoPreview} alt="Unit" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl h-28 flex flex-col items-center justify-center hover:border-blue-400 transition-colors">
                  <Camera className="w-6 h-6 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-400">Unit photo</p>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={e => handlePhotoChange(e, 'unit')} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Nameplate Photo
              <span className="ml-1 text-blue-600">(AI reads this)</span>
            </label>
            <label className="cursor-pointer block">
              {nameplatePhotoPreview ? (
                <div className="relative rounded-xl overflow-hidden h-28">
                  <img src={nameplatePhotoPreview} alt="Nameplate" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-blue-200 rounded-xl h-28 flex flex-col items-center justify-center hover:border-blue-400 transition-colors bg-blue-50/30">
                  <Camera className="w-6 h-6 text-blue-400 mb-1" />
                  <p className="text-xs text-blue-500">Nameplate photo</p>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={e => handlePhotoChange(e, 'nameplate')} className="hidden" />
            </label>
          </div>
        </div>

        {nameplatePhotoPreview && (
          <button
            type="button"
            onClick={handleIdentifyWithAI}
            disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reading nameplate with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Identify Equipment with AI
              </>
            )}
          </button>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name / Label *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
            placeholder="e.g. RTU-1, Rooftop Unit North"
          />
          <p className="text-xs text-gray-400 mt-1">Your label for this unit (e.g. RTU-1, Furnace 2)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type *</label>
          <select
            value={form.equipment_type}
            onChange={e => update('equipment_type', e.target.value as EquipmentType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140] bg-white"
          >
            <optgroup label="HVAC / Refrigeration">
              {EQUIPMENT_TYPES.filter(([type]) => HVAC_EQUIPMENT_TYPES.includes(type)).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </optgroup>
            <optgroup label="Plumbing / Gas">
              {EQUIPMENT_TYPES.filter(([type]) => PLUMBING_EQUIPMENT_TYPES.includes(type)).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </optgroup>
            <optgroup label="Other">
              {EQUIPMENT_TYPES.filter(([type]) => !HVAC_EQUIPMENT_TYPES.includes(type) && !PLUMBING_EQUIPMENT_TYPES.includes(type)).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Tier</label>
          <div className="grid grid-cols-3 gap-2">
            {TIERS.map(([tier, label]) => (
              <button
                key={tier}
                type="button"
                onClick={() => update('maintenance_tier', tier)}
                className={`py-2.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                  form.maintenance_tier === tier
                    ? 'border-[#193140] bg-[#193140] text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {form.maintenance_tier === 1 && 'Premium: Full comprehensive service on every visit'}
            {form.maintenance_tier === 2 && 'Standard: Core seasonal maintenance tasks'}
            {form.maintenance_tier === 3 && 'Basic: Essential inspection and filter service'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Motors on This Unit</label>
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border text-sm cursor-pointer ${form.has_blower_motor ? 'border-[#193140] bg-[#193140]/5' : 'border-gray-200'}`}>
              <input type="checkbox" checked={form.has_blower_motor} onChange={e => update('has_blower_motor', e.target.checked as any)} />
              Blower / supply fan motor
            </label>
            <label className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border text-sm cursor-pointer ${form.has_venter_motor ? 'border-[#193140] bg-[#193140]/5' : 'border-gray-200'}`}>
              <input type="checkbox" checked={form.has_venter_motor} onChange={e => update('has_venter_motor', e.target.checked as any)} />
              Venter / inducer motor
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Controls whether the maintenance form asks the tech for an amp reading on each motor. Most furnaces/condensing units have a venter motor; straight AC condensers usually don't.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Size</label>
            <input
              type="text"
              value={form.filter_size}
              onChange={e => update('filter_size', e.target.value)}
              placeholder="16x25x4"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"># of Filters</label>
            <input
              type="number"
              min={1}
              value={form.filter_quantity}
              onChange={e => update('filter_quantity', parseInt(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
            <input
              type="text"
              value={form.manufacturer}
              onChange={e => update('manufacturer', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="York, Carrier..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
            <input
              type="text"
              value={form.model_number}
              onChange={e => update('model_number', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="ZP060KCEA"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input
              type="text"
              value={form.serial_number}
              onChange={e => update('serial_number', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="Serial #"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tonnage</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              value={form.tonnage}
              onChange={e => update('tonnage', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voltage</label>
            <input
              type="text"
              value={form.voltage}
              onChange={e => update('voltage', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="208/230V 3-phase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Refrigerant</label>
            <input
              type="text"
              value={form.refrigerant_type}
              onChange={e => update('refrigerant_type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="R-410A"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Installed</label>
            <input
              type="number"
              min="1980"
              max={new Date().getFullYear()}
              value={form.year_installed}
              onChange={e => update('year_installed', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="2018"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location_in_facility}
              onChange={e => update('location_in_facility', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
              placeholder="Roof - North side"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140] resize-none"
            placeholder="Known issues, special considerations, previous repairs..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#193140] text-white rounded-lg py-3 text-sm font-semibold hover:bg-[#1e3d52] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Equipment'}
        </button>
      </form>
    </div>
  )
}

export default function NewEquipmentPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400">Loading…</div>}>
      <NewEquipmentPageInner />
    </Suspense>
  )
}
