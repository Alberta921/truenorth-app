'use client'

import { useEffect } from 'react'
import { cacheFacilityEquipment } from '@/lib/offline/sync'

// Drop this on any page that shows a facility's equipment. It silently
// refreshes the offline cache in the background so /maintenance/new
// works with zero connection next time this facility is visited —
// exactly the "opened it once while online, works offline after that"
// pattern the research confirmed is the standard for field CMMS apps.
export default function CacheWarmer({ facilityId, tenantId }: { facilityId: string; tenantId: string }) {
  useEffect(() => {
    if (navigator.onLine) {
      cacheFacilityEquipment(facilityId, tenantId).catch(() => {})
    }
  }, [facilityId, tenantId])
  return null
}
