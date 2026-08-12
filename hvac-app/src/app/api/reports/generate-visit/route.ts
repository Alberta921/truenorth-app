import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { FacilityVisitReportPDF } from '@/lib/pdf/generate-visit-report'
import { getChecklist } from '@/lib/maintenance/checklists'
import { sendEmail, buildReportEmailHTML, buildManagerNotificationHTML } from '@/lib/email/send-email'

// POST { visitId } — bundles every equipment's maintenance record for
// this visit into one branded PDF, emails it to the client, flags the
// office if anything urgent came up, and marks the visit completed.
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { visitId } = await request.json()

    const { data: visit } = await supabase
      .from('maintenance_visits')
      .select('*, facility:facilities(*)')
      .eq('id', visitId)
      .single()
    if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', visit.tenant_id).single()

    const { data: records } = await supabase
      .from('maintenance_records')
      .select('*, equipment(*)')
      .eq('visit_id', visitId)

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'No completed equipment records for this visit yet' }, { status: 400 })
    }

    const units = records.map((r: any) => {
      const allTasks = getChecklist(r.equipment.equipment_type, r.season, r.maintenance_tier)
      const taskMap = Object.fromEntries(allTasks.map((t) => [t.id, t.description]))
      const tasksCompleted = (r.tasks_completed as any[]).map((t) => ({
        id: t.id,
        description: taskMap[t.id] || t.id.replace(/_/g, ' '),
        completed: t.completed,
        notes: t.notes,
      }))
      return { record: r, equipment: r.equipment, tasksCompleted }
    })

    const pdfBuffer = await renderToBuffer(
      React.createElement(FacilityVisitReportPDF, { visit, facility: visit.facility, tenant, units }) as any
    )

    const fileName = `visit-report-${visitId}-${Date.now()}.pdf`
    const path = `${visit.tenant_id}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('reports').upload(path, pdfBuffer, { contentType: 'application/pdf' })
    if (uploadError) throw new Error('Failed to save PDF: ' + uploadError.message)

    const { data: { signedUrl } } = await supabase.storage.from('reports').createSignedUrl(path, 60 * 60 * 24 * 90)

    if (visit.facility?.contact_email && signedUrl) {
      await sendEmail({
        to: visit.facility.contact_email,
        fromName: tenant?.name ?? 'Maintenance Manager',
        subject: `${visit.season} maintenance report — ${visit.facility.name}`,
        html: buildReportEmailHTML({
          facilityName: visit.facility.name,
          season: visit.season,
          equipmentCount: units.length,
          portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/portal`,
        }),
        attachments: [{ filename: `${visit.facility.name}-${visit.season}-report.pdf`, content: pdfBuffer }],
      })
    }

    // Any unit with notes gets flagged to the manager as worth a look —
    // this is the bridge until techs are creating recommendation rows
    // directly from the maintenance form.
    const flaggedUnits = units.filter((u) => u.record.notes && u.record.notes.trim().length > 0)
    if (flaggedUnits.length > 0 && tenant?.manager_email) {
      await sendEmail({
        to: tenant.manager_email,
        fromName: tenant.name,
        subject: `${flaggedUnits.length} item(s) flagged — ${visit.facility.name}`,
        html: buildManagerNotificationHTML({
          facilityName: visit.facility.name,
          flaggedCount: flaggedUnits.length,
          visitUrl: `${process.env.NEXT_PUBLIC_APP_URL}/visits/${visitId}`,
        }),
      })
    }

    await supabase.from('maintenance_visits').update({ status: 'completed', completed_date: new Date().toISOString().split('T')[0] }).eq('id', visitId)

    return NextResponse.json({ pdfUrl: signedUrl })
  } catch (err: any) {
    console.error('Visit report generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
