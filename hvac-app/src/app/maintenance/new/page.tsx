'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Camera, CheckSquare, Square, FileText, Loader2, Send } from 'lucide-react'
import { getChecklist, getCurrentSeason } from '@/lib/maintenance/checklists'
import VoiceTextarea from '@/components/voice/VoiceTextarea'
import { offlineDB, generateLocalId } from '@/lib/offline/db'
import { flushOutbox } from '@/lib/offline/sync'
import { SEASON_LABELS, EQUIPMENT_TYPE_LABELS } from '@/types'
import type { Equipment, Season, MaintenanceTier, MaintenanceTask, TaskRecord, PhotoRecord } from '@/types'

function NewMaintenancePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const equipmentId = searchParams.get('equipment')
  const visitId = searchParams.get('visit')
  const supabase = createClient()

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const [season, setSeason] = useState<Season>(getCurrentSeason())
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [taskRecords, setTaskRecords] = useState<Record<string, TaskRecord>>({})
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [activePhotoCaption, setActivePhotoCaption] = useState('')

  const [measurements, setMeasurements] = useState({
    supply_fan_amp_l1: '',
    supply_fan_amp_l2: '',
    supply_fan_amp_l3: '',
    condenser_fan_amp_l1: '',
    condenser_fan_amp_l2: '',
    inducer_amp: '',
    voltage_l1_l2: '',
    voltage_l2_l3: '',
    voltage_l1_l3: '',
    suction_pressure: '',
    discharge_pressure: '',
    suction_temp: '',
    liquid_line_temp: '',
    superheat: '',
    subcooling: '',
    supply_air_temp: '',
    return_air_temp: '',
    temp_differential: '',
    gas_pressure_in_wc: '',
    supply_air_temp_heat: '',
    return_air_temp_heat: '',
    temp_rise: '',
  })

  const [filterCondition, setFilterCondition] = useState<string>('clean')
  const [filterSize, setFilterSize] = useState('')
  const [notes, setNotes] = useState('')
  const [flagForFollowUp, setFlagForFollowUp] = useState(false)
  const [flagPriority, setFlagPriority] = useState<'urgent' | 'recommended' | 'monitor'>('recommended')
  const [flagTitle, setFlagTitle] = useState('')

  useEffect(() => {
    if (!equipmentId) return
    loadEquipment()
  }, [equipmentId])

  useEffect(() => {
    if (!equipment) return
    const checklist = getChecklist(equipment.equipment_type, season, equipment.maintenance_tier)
    setTasks(checklist)
    const records: Record<string, TaskRecord> = {}
    checklist.forEach(task => {
      records[task.id] = { id: task.id, completed: false }
    })
    setTaskRecords(records)
  }, [equipment, season])

  async function loadEquipment() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('equipment')
        .select('*, facilities(*)')
        .eq('id', equipmentId!)
        .single()
      if (data) {
        setEquipment(data as Equipment)
        if (data.filter_size) setFilterSize(data.filter_size)
        // Refresh the offline cache for next time there's no signal
        await offlineDB.cachedEquipment.put({ id: data.id, tenantId: data.tenant_id, facilityId: data.facility_id, data })
      }
    } catch {
      // No connection — fall back to whatever was cached the last
      // time this facility was opened while online.
      const cached = await offlineDB.cachedEquipment.get(equipmentId!)
      if (cached) {
        setEquipment(cached.data as Equipment)
        if (cached.data.filter_size) setFilterSize(cached.data.filter_size)
      } else {
        setError('This equipment hasn\u2019t been loaded on this device before — connect once to cache it, then it will work offline.')
      }
    }
    setLoading(false)
  }

  function toggleTask(taskId: string) {
    setTaskRecords(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], completed: !prev[taskId]?.completed },
    }))
  }

  function updateTaskNote(taskId: string, note: string) {
    setTaskRecords(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], notes: note },
    }))
  }

  function updateMeasurement(field: string, value: string) {
    setMeasurements(prev => ({ ...prev, [field]: value }))
  }

  function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setPhotos((prev) => [...prev, { url: previewUrl, caption: activePhotoCaption }])
    setPhotoFiles((prev) => [...prev, file])
    setActivePhotoCaption('')
    e.target.value = ''
  }

  async function handleSave() {
    if (!equipment) return
    setSaving(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Not signed in — sign in once with a connection, then this page works offline.')
      setSaving(false)
      return
    }

    const tasksArray = Object.values(taskRecords)
    const numericMeasurements: Record<string, number | null> = {}
    for (const [key, val] of Object.entries(measurements)) {
      numericMeasurements[key] = val !== '' ? parseFloat(val) : null
    }

    const localId = generateLocalId()

    await offlineDB.pendingRecords.add({
      localId,
      equipmentId: equipment.id,
      tenantId: equipment.tenant_id,
      technicianId: session.user.id,
      visitId: visitId || undefined,
      season,
      serviceDate: new Date().toISOString().split('T')[0],
      maintenanceTier: equipment.maintenance_tier,
      tasksCompleted: tasksArray,
      filterCondition,
      filterSize: filterSize || undefined,
      measurements: numericMeasurements,
      photos: [],
      notes: notes || undefined,
      flagForFollowUp,
      flagPriority,
      flagTitle: flagTitle || undefined,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    })

    for (const file of photoFiles) {
      await offlineDB.pendingPhotos.add({
        localId: generateLocalId(),
        recordLocalId: localId,
        blob: file,
        caption: activePhotoCaption,
      })
    }

    if (navigator.onLine) {
      const result = await flushOutbox()
      if (result.failed === 0 && result.synced > 0) {
        router.push(visitId ? `/visits/${visitId}` : `/facilities/${equipment.facility_id}`)
        return
      }
    }

    router.push((visitId ? `/visits/${visitId}` : `/facilities/${equipment.facility_id}`) + '?saved=offline')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Start Maintenance</h1>
        <p className="text-gray-500 mb-6">Select which equipment you are servicing:</p>
        <Link href="/facilities" className="inline-flex items-center gap-2 bg-[#193140] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3d52]">
          Browse Facilities
        </Link>
      </div>
    )
  }

  const completedCount = Object.values(taskRecords).filter(t => t.completed).length
  const totalCount = tasks.length

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/equipment/${equipment.id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">{equipment.name}</h1>
          <p className="text-sm text-gray-500">{EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Season / Service Type</label>
        <div className="grid grid-cols-4 gap-2">
          {(['spring', 'summer', 'fall', 'winter'] as Season[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={`py-2 rounded-lg border text-xs font-medium transition-all capitalize ${
                season === s
                  ? 'border-[#193140] bg-[#193140] text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {SEASON_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Checklist Progress</span>
          <span className="text-sm font-bold text-gray-900">{completedCount}/{totalCount}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            {SEASON_LABELS[season]} Checklist — Tier {equipment.maintenance_tier}
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {tasks.map(task => {
            const record = taskRecords[task.id]
            const isCompleted = record?.completed || false
            const categoryColors: Record<string, string> = {
              filter: 'bg-blue-100 text-blue-700',
              coil: 'bg-cyan-100 text-cyan-700',
              electrical: 'bg-yellow-100 text-yellow-700',
              refrigeration: 'bg-purple-100 text-purple-700',
              combustion: 'bg-orange-100 text-orange-700',
              mechanical: 'bg-gray-100 text-gray-700',
              controls: 'bg-green-100 text-green-700',
              safety: 'bg-red-100 text-red-700',
              general: 'bg-slate-100 text-slate-700',
            }

            return (
              <div key={task.id} className={`p-3 transition-colors ${isCompleted ? 'bg-green-50/50' : ''}`}>
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-3 w-full text-left"
                >
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {isCompleted && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${isCompleted ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                      {task.description}
                    </p>
                    <span className={`inline-block text-xs px-1.5 py-0.5 rounded mt-1 ${categoryColors[task.category] || 'bg-gray-100 text-gray-600'}`}>
                      {task.category}
                    </span>
                  </div>
                </button>
                {isCompleted && (
                  <input
                    type="text"
                    placeholder="Add notes (optional)..."
                    value={record?.notes || ''}
                    onChange={e => updateTaskNote(task.id, e.target.value)}
                    className="mt-2 ml-8 w-full text-xs border border-green-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                    onClick={e => e.stopPropagation()}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Service</h3>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {['clean', 'dirty', 'replaced', 'n/a'].map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterCondition(status === 'n/a' ? 'n_a' : status)}
              className={`py-1.5 rounded border text-xs font-medium capitalize transition-all ${
                filterCondition === (status === 'n/a' ? 'n_a' : status)
                  ? 'border-[#193140] bg-[#193140] text-white'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={filterSize}
          onChange={e => setFilterSize(e.target.value)}
          placeholder="Filter size (e.g. 16x25x4)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#193140]"
        />
        {equipment?.filter_size && (
          <p className="text-xs text-gray-500 mt-2 bg-blue-50 rounded-lg px-3 py-2">
            On file for this unit: <strong>{equipment.filter_size}</strong> × {equipment.filter_quantity ?? 1}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Electrical Readings</h3>
        {equipment && !equipment.has_blower_motor && !equipment.has_venter_motor && (
          <p className="text-xs text-gray-400 mb-2">This unit has no blower or venter motor on file — amp fields hidden. Edit the unit's motors in Equipment settings if that's wrong.</p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ...(equipment?.has_blower_motor !== false ? [
                ['supply_fan_amp_l1', 'Blower Motor L1 (A)'],
                ['supply_fan_amp_l2', 'Blower Motor L2 (A)'],
                ['supply_fan_amp_l3', 'Blower Motor L3 (A)'],
              ] : []),
              ['condenser_fan_amp_l1', 'Cond Fan L1 (A)'],
              ['condenser_fan_amp_l2', 'Cond Fan L2 (A)'],
              ...(equipment?.has_venter_motor ? [
                ['inducer_amp', 'Venter/Inducer Motor (A)'],
              ] : []),
              ['voltage_l1_l2', 'Voltage L1-L2'],
              ['voltage_l2_l3', 'Voltage L2-L3'],
              ['voltage_l1_l3', 'Voltage L1-L3'],
            ] as [string, string][]
          ).map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                value={measurements[field as keyof typeof measurements]}
                onChange={e => updateMeasurement(field, e.target.value)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#193140]"
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Refrigeration Readings</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['suction_pressure', 'Suction (psig)'],
            ['discharge_pressure', 'Discharge (psig)'],
            ['suction_temp', 'Suction Temp (°F)'],
            ['liquid_line_temp', 'Liquid Line (°F)'],
            ['superheat', 'Superheat (°F)'],
            ['subcooling', 'Subcooling (°F)'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                value={measurements[field as keyof typeof measurements]}
                onChange={e => updateMeasurement(field, e.target.value)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#193140]"
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Air & Heating Readings</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['supply_air_temp', 'Supply Air (°F)'],
            ['return_air_temp', 'Return Air (°F)'],
            ['temp_differential', 'Temp Diff (°F)'],
            ['gas_pressure_in_wc', 'Gas Pressure (" W.C.)'],
            ['supply_air_temp_heat', 'Supply Heat (°F)'],
            ['return_air_temp_heat', 'Return Heat (°F)'],
            ['temp_rise', 'Temp Rise (°F)'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                value={measurements[field as keyof typeof measurements]}
                onChange={e => updateMeasurement(field, e.target.value)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#193140]"
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Service Photos</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative">
              <img src={photo.url} alt={photo.caption} className="w-full h-20 object-cover rounded-lg" />
              {photo.caption && (
                <p className="text-xs text-gray-500 mt-1 truncate">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={activePhotoCaption}
          onChange={e => setActivePhotoCaption(e.target.value)}
          placeholder="Photo caption (optional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#193140]"
        />
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer hover:border-blue-400 transition-colors">
          <Camera className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Add Photo</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleAddPhoto} className="hidden" />
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Technician Notes & Recommendations</h3>
        <p className="text-xs text-gray-400 mb-2">Tap "Talk to app" and describe what you found — the app will clean it up into report language.</p>
        <VoiceTextarea
          value={notes}
          onChange={setNotes}
          rows={4}
          placeholder="Equipment condition, recommendations, issues found, items for follow-up..."
          cleanupContext={equipment ? `${EQUIPMENT_TYPE_LABELS[equipment.equipment_type]} — ${equipment.name}` : undefined}
        />

        <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={flagForFollowUp}
            onChange={(e) => setFlagForFollowUp(e.target.checked)}
          />
          This needs a quote or follow-up — send to the office
        </label>

        {flagForFollowUp && (
          <div className="mt-2 space-y-2">
            <input
              placeholder="Short title (e.g. &quot;Compressor contactor pitted, recommend replacement&quot;)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={flagTitle}
              onChange={(e) => setFlagTitle(e.target.value)}
            />
            <div className="flex gap-2">
              {(['urgent', 'recommended', 'monitor'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFlagPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize ${
                    flagPriority === p
                      ? p === 'urgent' ? 'bg-red-500 text-white' : p === 'recommended' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-[#193140] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#1e3d52] disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
          ) : (
            <><FileText className="w-4 h-4" />Save & Generate Report</>
          )}
        </button>
      </div>
    </div>
  )
}

export default function NewMaintenancePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400">Loading…</div>}>
      <NewMaintenancePageInner />
    </Suspense>
  )
}
