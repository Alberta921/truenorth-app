'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Download, Send, Loader2, Check, CheckSquare, XSquare } from 'lucide-react'
import { SEASON_LABELS, EQUIPMENT_TYPE_LABELS, TIER_LABELS } from '@/types'
import type { MaintenanceRecord, Equipment, Facility, Tenant } from '@/types'

export default function ReportPage() {
  const params = useParams()
  const supabase = createClient()
  const [record, setRecord] = useState<MaintenanceRecord | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [facility, setFacility] = useState<Facility | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [sendEmail, setSendEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => { loadReport() }, [params.id])

  async function loadReport() {
    const { data: rec } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', params.id as string)
      .single()

    if (!rec) { setLoading(false); return }
    setRecord(rec)

    const [{ data: eq }, { data: userProfile }] = await Promise.all([
      supabase.from('equipment').select('*, facilities(*)').eq('id', rec.equipment_id).single(),
      supabase.auth.getUser().then(({ data: { user } }) =>
        supabase.from('users').select('tenant_id').eq('id', user!.id).single()
      ),
    ])

    if (eq) {
      setEquipment(eq as Equipment)
      setFacility((eq as any).facilities as Facility)
    }

    if (userProfile) {
      const { data: t } = await supabase.from('tenants').select('*').eq('id', userProfile.tenant_id).single()
      if (t) setTenant(t)
    }

    if (rec.report_pdf_url) setPdfUrl(rec.report_pdf_url)
    setLoading(false)
  }

  async function generateReport() {
    if (!record || !equipment || !facility || !tenant) return
    setGenerating(true)

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: record.id,
          record,
          equipment,
          facility,
          tenant,
        }),
      })

      if (!response.ok) throw new Error('Report generation failed')

      const { pdfUrl: url } = await response.json()
      setPdfUrl(url)
      setGenerated(true)

      await supabase
        .from('maintenance_records')
        .update({ report_pdf_url: url })
        .eq('id', record.id)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!record || !equipment || !facility) {
    return <div className="p-6"><p className="text-gray-500">Report not found.</p></div>
  }

  const completedTasks = (record.tasks_completed as any[]).filter(t => t.completed)
  const totalTasks = record.tasks_completed.length

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reports" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{equipment.name} — Report</h1>
          <p className="text-sm text-gray-500">{SEASON_LABELS[record.season]} Service • {record.service_date}</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-[#193140] rounded-xl p-5 mb-5 text-white">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-wide">Facility</p>
            <p className="font-semibold mt-0.5">{facility.name}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-wide">Equipment</p>
            <p className="font-semibold mt-0.5">{equipment.name}</p>
            <p className="text-xs text-blue-200">{EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-wide">Service</p>
            <p className="font-semibold mt-0.5">{SEASON_LABELS[record.season]}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-wide">Tasks</p>
            <p className="font-semibold mt-0.5">{completedTasks.length}/{totalTasks} completed</p>
          </div>
        </div>
      </div>

      {/* Checklist Summary */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Completed Tasks</h2>
        </div>
        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {(record.tasks_completed as any[]).map((task: any) => (
            <div key={task.id} className="flex items-start gap-3 p-3">
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XSquare className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm ${task.completed ? 'text-gray-800' : 'text-gray-400'}`}>
                  {/* We store the description too if needed */}
                  Task: {task.id.replace(/_/g, ' ')}
                </p>
                {task.notes && <p className="text-xs text-gray-500 mt-0.5">Note: {task.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Measurements Summary */}
      {hasAnyMeasurement(record) && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recorded Measurements</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {getMeasurementDisplay(record).map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 text-xs">{label}</span>
                <span className="font-medium text-gray-900 text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {record.notes && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Technician Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.notes}</p>
        </div>
      )}

      {/* Generate PDF */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Client Report</h2>

        {pdfUrl ? (
          <div className="space-y-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </a>
            <p className="text-xs text-gray-400 text-center">
              Professional branded report ready for client delivery
            </p>
          </div>
        ) : (
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center justify-center gap-2 w-full bg-[#193140] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1e3d52] disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating PDF...</>
            ) : (
              'Generate PDF Report'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function hasAnyMeasurement(record: MaintenanceRecord): boolean {
  return !!(
    record.supply_fan_amp_l1 || record.suction_pressure || record.discharge_pressure ||
    record.supply_air_temp || record.gas_pressure_in_wc || record.temp_rise
  )
}

function getMeasurementDisplay(record: MaintenanceRecord): [string, string][] {
  const items: [string, string][] = []
  if (record.supply_fan_amp_l1) items.push(['Supply Fan L1', `${record.supply_fan_amp_l1}A`])
  if (record.supply_fan_amp_l2) items.push(['Supply Fan L2', `${record.supply_fan_amp_l2}A`])
  if (record.supply_fan_amp_l3) items.push(['Supply Fan L3', `${record.supply_fan_amp_l3}A`])
  if (record.condenser_fan_amp_l1) items.push(['Cond Fan L1', `${record.condenser_fan_amp_l1}A`])
  if (record.suction_pressure) items.push(['Suction', `${record.suction_pressure} psig`])
  if (record.discharge_pressure) items.push(['Discharge', `${record.discharge_pressure} psig`])
  if (record.superheat) items.push(['Superheat', `${record.superheat}°F`])
  if (record.subcooling) items.push(['Subcooling', `${record.subcooling}°F`])
  if (record.supply_air_temp) items.push(['Supply Air', `${record.supply_air_temp}°F`])
  if (record.return_air_temp) items.push(['Return Air', `${record.return_air_temp}°F`])
  if (record.gas_pressure_in_wc) items.push(['Gas Pressure', `${record.gas_pressure_in_wc}" W.C.`])
  if (record.temp_rise) items.push(['Temp Rise', `${record.temp_rise}°F`])
  return items
}
