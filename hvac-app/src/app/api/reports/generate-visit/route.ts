import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { MaintenanceReportPDF } from '@/lib/pdf/generate-report'
import type { MaintenanceRecord, Equipment, Facility, Tenant } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { recordId, record, equipment, facility, tenant } = body as {
      recordId: string
      record: MaintenanceRecord
      equipment: Equipment
      facility: Facility
      tenant: Tenant
    }

    // Build task list with descriptions
    // We store task IDs in tasks_completed — map them back to descriptions
    const { getChecklist } = await import('@/lib/maintenance/checklists')
    const allTasks = getChecklist(equipment.equipment_type, record.season, record.maintenance_tier)
    const taskMap = Object.fromEntries(allTasks.map(t => [t.id, t.description]))

    const tasksWithDescriptions = (record.tasks_completed as any[]).map(task => ({
      id: task.id,
      description: taskMap[task.id] || task.id.replace(/_/g, ' '),
      completed: task.completed,
      notes: task.notes,
    }))

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(MaintenanceReportPDF, {
        record,
        equipment,
        facility,
        tenant,
        tasksCompleted: tasksWithDescriptions,
      }) as any
    )

    // Upload to Supabase storage
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const fileName = `report-${recordId}-${Date.now()}.pdf`
    const path = `${profile!.tenant_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(path, pdfBuffer, { contentType: 'application/pdf' })

    if (uploadError) throw new Error('Failed to save PDF: ' + uploadError.message)

    // Get signed URL (reports bucket is private)
    const { data: signedUrlData } = await supabase.storage
      .from('reports')
      .createSignedUrl(path, 60 * 60 * 24 * 30) // 30 days
    const signedUrl = signedUrlData?.signedUrl

    // Update record with PDF URL
    await supabase
      .from('maintenance_records')
      .update({ report_pdf_url: signedUrl })
      .eq('id', recordId)

    return NextResponse.json({ pdfUrl: signedUrl })
  } catch (err: any) {
    console.error('Report generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
