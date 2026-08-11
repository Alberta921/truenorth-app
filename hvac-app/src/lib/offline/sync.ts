import { offlineDB, type PendingMaintenanceRecord } from './db'
import { createClient } from '@/lib/supabase/client'

// Replays everything in the outbox against Supabase. Called on:
// - app coming back online (window 'online' event)
// - a manual "Sync now" tap
// - Background Sync event, where supported (Chromium only — this
//   function is what actually runs either way, so it works even on
//   browsers without Background Sync support, just less automatically)
export async function flushOutbox(): Promise<{ synced: number; failed: number }> {
  const supabase = createClient()
  const pending = await offlineDB.pendingRecords
    .where('syncStatus')
    .anyOf(['pending', 'error'])
    .toArray()

  let synced = 0
  let failed = 0

  for (const record of pending) {
    await offlineDB.pendingRecords.update(record.localId, { syncStatus: 'syncing' })

    try {
      // Upload any photos attached to this record first, so we can
      // store real URLs instead of local blob references.
      const photos = await offlineDB.pendingPhotos.where('recordLocalId').equals(record.localId).toArray()
      const uploadedPhotos: { url: string; caption?: string }[] = []

      for (const photo of photos) {
        const path = `${record.tenantId}/${record.equipmentId}/${photo.localId}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('maintenance-photos')
          .upload(path, photo.blob, { upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('maintenance-photos').getPublicUrl(path)
        uploadedPhotos.push({ url: publicUrl, caption: photo.caption })
      }

      const numericMeasurements: Record<string, number | null> = {}
      for (const [key, val] of Object.entries(record.measurements)) {
        numericMeasurements[key] = val
      }

      const { data: insertedRecord, error: insertError } = await supabase
        .from('maintenance_records')
        .insert({
          equipment_id: record.equipmentId,
          tenant_id: record.tenantId,
          technician_id: record.technicianId,
          visit_id: record.visitId || null,
          season: record.season,
          service_date: record.serviceDate,
          maintenance_tier: record.maintenanceTier,
          tasks_completed: record.tasksCompleted,
          filter_condition: record.filterCondition || null,
          filter_size: record.filterSize || null,
          ...numericMeasurements,
          photos: uploadedPhotos,
          notes: record.notes || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Flagged during the visit → create the recommendation right away,
      // instead of that being a separate manual step in the office queue.
      if (record.flagForFollowUp && insertedRecord) {
        await supabase.from('recommendations').insert({
          tenant_id: record.tenantId,
          equipment_id: record.equipmentId,
          maintenance_record_id: insertedRecord.id,
          visit_id: record.visitId || null,
          priority: record.flagPriority || 'recommended',
          title: record.flagTitle || 'Follow-up recommended from maintenance visit',
          description: record.notes || null,
          status: 'open',
        })
      }

      await offlineDB.pendingRecords.update(record.localId, { syncStatus: 'synced' })
      await offlineDB.pendingPhotos.where('recordLocalId').equals(record.localId).delete()
      synced++
    } catch (err) {
      await offlineDB.pendingRecords.update(record.localId, {
        syncStatus: 'error',
        syncError: err instanceof Error ? err.message : String(err),
      })
      failed++
    }
  }

  return { synced, failed }
}

export async function getOutboxCount(): Promise<number> {
  return offlineDB.pendingRecords.where('syncStatus').anyOf(['pending', 'error', 'syncing']).count()
}

// Caches the equipment + checklist context a technician will likely
// need at a facility, so /maintenance/new works with zero connection
// once they've opened the facility once while online.
export async function cacheFacilityEquipment(facilityId: string, tenantId: string) {
  const supabase = createClient()
  const { data } = await supabase.from('equipment').select('*').eq('facility_id', facilityId).eq('is_active', true)
  if (!data) return
  await offlineDB.cachedEquipment.bulkPut(
    data.map((e) => ({ id: e.id, tenantId, facilityId, data: e }))
  )
}
