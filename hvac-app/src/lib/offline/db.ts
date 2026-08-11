import Dexie, { type Table } from 'dexie'

// Local source of truth when offline. Every write the technician makes
// goes here first — the UI never blocks on the network. A background
// sync process (or a manual "Sync now" tap) replays the outbox against
// Supabase once connectivity is back.

export interface PendingMaintenanceRecord {
  localId: string          // uuid generated on-device
  equipmentId: string
  tenantId: string
  technicianId: string
  visitId?: string
  season: string
  serviceDate: string
  maintenanceTier: number
  tasksCompleted: any[]
  filterCondition?: string
  filterSize?: string
  measurements: Record<string, number | null>
  photos: { localId: string; caption?: string }[]   // photo blobs live in pendingPhotos
  notes?: string
  flagForFollowUp?: boolean
  flagPriority?: 'urgent' | 'recommended' | 'monitor'
  flagTitle?: string
  createdAt: string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
  syncError?: string
}

export interface PendingPhoto {
  localId: string
  recordLocalId: string
  blob: Blob
  caption?: string
}

export interface CachedEquipment {
  id: string
  tenantId: string
  facilityId: string
  data: any             // full equipment row, cached for offline lookup
}

class OfflineDB extends Dexie {
  pendingRecords!: Table<PendingMaintenanceRecord, string>
  pendingPhotos!: Table<PendingPhoto, string>
  cachedEquipment!: Table<CachedEquipment, string>

  constructor() {
    super('hvac-maintenance-offline')
    this.version(1).stores({
      pendingRecords: 'localId, equipmentId, syncStatus, createdAt',
      pendingPhotos: 'localId, recordLocalId',
      cachedEquipment: 'id, facilityId',
    })
  }
}

export const offlineDB = new OfflineDB()

export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
