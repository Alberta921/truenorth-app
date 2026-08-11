import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { MaintenanceRecord, Equipment, Facility, Tenant, MaintenanceVisit } from '@/types'
import { EQUIPMENT_TYPE_LABELS, TIER_LABELS, SEASON_LABELS } from '@/types'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, paddingTop: 30, paddingBottom: 50, paddingHorizontal: 40, backgroundColor: '#ffffff' },
  coverHeader: { alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '3px solid #193140' },
  logo: { width: 160, height: 70, objectFit: 'contain', marginBottom: 10 },
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#193140' },
  coverTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#193140', marginTop: 16, textAlign: 'center' },
  coverSubtitle: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff', backgroundColor: '#193140', padding: '5 8', marginBottom: 6 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '50%', paddingVertical: 3, paddingHorizontal: 4 },
  infoLabel: { fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 10, color: '#222', marginTop: 1 },
  summaryTable: { marginTop: 4 },
  summaryRow: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 6, paddingHorizontal: 4 },
  summaryRowAlt: { backgroundColor: '#f8f9fa' },
  summaryHeader: { backgroundColor: '#e8ecef', fontFamily: 'Helvetica-Bold' },
  colUnit: { flex: 2, fontSize: 9 },
  colType: { flex: 2, fontSize: 9 },
  colTier: { flex: 1, fontSize: 9 },
  colTasks: { flex: 1, fontSize: 9 },
  colRecs: { flex: 1, fontSize: 9, color: '#c0392b' },
  unitPageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #193140' },
  unitTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#193140' },
  tierBadge: { fontSize: 9, fontFamily: 'Helvetica-Bold', padding: '2 8', borderRadius: 3 },
  tier1: { backgroundColor: '#FFD700', color: '#333' },
  tier2: { backgroundColor: '#C0C0C0', color: '#333' },
  tier3: { backgroundColor: '#CD7F32', color: '#fff' },
  checklistItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 3, paddingHorizontal: 4, borderBottom: '1px solid #f0f0f0' },
  checkBox: { width: 12, height: 12, border: '1px solid #ccc', marginRight: 6, backgroundColor: '#d4edda', borderColor: '#28a745' },
  checkBoxIncomplete: { backgroundColor: '#fff', borderColor: '#ccc' },
  checkmark: { fontSize: 9, color: '#28a745', marginLeft: 1 },
  checklistText: { flex: 1, fontSize: 9, color: '#333' },
  notesBox: { border: '1px solid #ddd', padding: 8, borderRadius: 3, backgroundColor: '#fafafa' },
  notesText: { fontSize: 9, color: '#444', lineHeight: 1.5 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  photoContainer: { width: '31%', marginBottom: 8 },
  photo: { width: '100%', height: 90, objectFit: 'cover', borderRadius: 3 },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: 6 },
  footerText: { fontSize: 8, color: '#999' },
})

interface UnitEntry {
  record: MaintenanceRecord
  equipment: Equipment
  tasksCompleted: Array<{ id: string; description: string; completed: boolean; notes?: string }>
}

interface VisitReportProps {
  visit: MaintenanceVisit
  facility: Facility
  tenant: Tenant
  units: UnitEntry[]
}

export function FacilityVisitReportPDF({ visit, facility, tenant, units }: VisitReportProps) {
  const allPhotos = units.flatMap((u) =>
    (u.record.photos ?? []).map((p) => ({ ...p, equipmentName: u.equipment.name }))
  )
  const totalRecommendations = units.reduce(
    (sum, u) => sum + (u.record.notes && u.record.notes.trim().length > 0 ? 1 : 0),
    0
  )

  return (
    <Document>
      {/* COVER PAGE — summary of everything serviced this visit */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.coverHeader}>
          {tenant.logo_url ? <Image src={tenant.logo_url} style={styles.logo} /> : <Text style={styles.companyName}>{tenant.name}</Text>}
          <Text style={styles.coverTitle}>{SEASON_LABELS[visit.season]} Maintenance Visit Report</Text>
          <Text style={styles.coverSubtitle}>{facility.name} \u2014 {visit.scheduled_date || visit.completed_date}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facility</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Facility</Text><Text style={styles.infoValue}>{facility.name}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Address</Text><Text style={styles.infoValue}>{[facility.address, facility.city].filter(Boolean).join(', ')}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Serviced This Visit \u2014 {units.length} Unit(s)</Text>
          <View style={styles.summaryTable}>
            <View style={[styles.summaryRow, styles.summaryHeader]}>
              <Text style={styles.colUnit}>Unit</Text>
              <Text style={styles.colType}>Type</Text>
              <Text style={styles.colTier}>Tier</Text>
              <Text style={styles.colTasks}>Tasks</Text>
              <Text style={styles.colRecs}>Flag</Text>
            </View>
            {units.map((u, i) => (
              <View key={u.equipment.id} style={[styles.summaryRow, i % 2 === 1 ? styles.summaryRowAlt : {}]}>
                <Text style={styles.colUnit}>{u.equipment.name}</Text>
                <Text style={styles.colType}>{EQUIPMENT_TYPE_LABELS[u.equipment.equipment_type]}</Text>
                <Text style={styles.colTier}>{TIER_LABELS[u.record.maintenance_tier]}</Text>
                <Text style={styles.colTasks}>{u.tasksCompleted.filter((t) => t.completed).length}/{u.tasksCompleted.length}</Text>
                <Text style={styles.colRecs}>{u.record.notes ? '\u2022' : ''}</Text>
              </View>
            ))}
          </View>
        </View>

        {totalRecommendations > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technician Notes This Visit</Text>
            {units.filter((u) => u.record.notes).map((u) => (
              <View key={u.equipment.id} style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#193140' }}>{u.equipment.name}</Text>
                <View style={styles.notesBox}><Text style={styles.notesText}>{u.record.notes}</Text></View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{tenant.name} \u2014 Visit Report</Text>
          <Text style={styles.footerText}>{facility.name} \u2014 {visit.scheduled_date}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ONE PAGE PER UNIT */}
      {units.map((u) => {
        const tierStyle = u.record.maintenance_tier === 1 ? styles.tier1 : u.record.maintenance_tier === 2 ? styles.tier2 : styles.tier3
        return (
          <Page key={u.equipment.id} size="LETTER" style={styles.page}>
            <View style={styles.unitPageHeader}>
              <View>
                <Text style={styles.unitTitle}>{u.equipment.name}</Text>
                <Text style={{ fontSize: 9, color: '#666' }}>{EQUIPMENT_TYPE_LABELS[u.equipment.equipment_type]}</Text>
              </View>
              <Text style={[styles.tierBadge, tierStyle]}>{TIER_LABELS[u.record.maintenance_tier]}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipment Details</Text>
              <View style={styles.infoGrid}>
                {u.equipment.manufacturer && <View style={styles.infoItem}><Text style={styles.infoLabel}>Manufacturer</Text><Text style={styles.infoValue}>{u.equipment.manufacturer}</Text></View>}
                {u.equipment.model_number && <View style={styles.infoItem}><Text style={styles.infoLabel}>Model</Text><Text style={styles.infoValue}>{u.equipment.model_number}</Text></View>}
                {u.equipment.serial_number && <View style={styles.infoItem}><Text style={styles.infoLabel}>Serial</Text><Text style={styles.infoValue}>{u.equipment.serial_number}</Text></View>}
                {u.equipment.location_in_facility && <View style={styles.infoItem}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{u.equipment.location_in_facility}</Text></View>}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Checklist \u2014 {u.tasksCompleted.filter((t) => t.completed).length}/{u.tasksCompleted.length} Completed</Text>
              {u.tasksCompleted.map((task, i) => (
                <View key={task.id} style={styles.checklistItem}>
                  <View style={[styles.checkBox, !task.completed ? styles.checkBoxIncomplete : {}]}>
                    {task.completed && <Text style={styles.checkmark}>\u2713</Text>}
                  </View>
                  <Text style={styles.checklistText}>{task.description}</Text>
                </View>
              ))}
            </View>

            {u.record.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Technician Notes</Text>
                <View style={styles.notesBox}><Text style={styles.notesText}>{u.record.notes}</Text></View>
              </View>
            )}

            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>{tenant.name} \u2014 {facility.name}</Text>
              <Text style={styles.footerText}>{u.equipment.name}</Text>
              <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
            </View>
          </Page>
        )
      })}

      {/* PHOTOS PAGE */}
      {allPhotos.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Service Photos</Text>
            <View style={styles.photosGrid}>
              {allPhotos.map((photo, i) => (
                <View key={i} style={styles.photoContainer}>
                  <Image src={photo.url} style={styles.photo} />
                  <Text style={{ fontSize: 7, color: '#666', marginTop: 2, textAlign: 'center' }}>{photo.equipmentName}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>{tenant.name} \u2014 Service Photos</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      )}
    </Document>
  )
}
