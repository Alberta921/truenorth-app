import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { MaintenanceRecord, Equipment, Facility, Tenant } from '@/types'
import { EQUIPMENT_TYPE_LABELS, TIER_LABELS, SEASON_LABELS } from '@/types'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2px solid #193140',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#193140',
  },
  companyTagline: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#193140',
    textAlign: 'right',
  },
  reportSubtitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  // Section
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    backgroundColor: '#193140',
    padding: '5 8',
    marginBottom: 6,
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  infoItemFull: {
    width: '100%',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 10,
    color: '#222',
    marginTop: 1,
  },
  // Measurement table
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    backgroundColor: '#f8f9fa',
  },
  tableHeader: {
    backgroundColor: '#e8ecef',
    fontFamily: 'Helvetica-Bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#333',
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#222',
  },
  // Checklist
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottom: '1px solid #f0f0f0',
  },
  checkBox: {
    width: 12,
    height: 12,
    border: '1px solid #ccc',
    marginRight: 6,
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  checkBoxIncomplete: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  checkmark: {
    fontSize: 9,
    color: '#28a745',
    marginLeft: 1,
  },
  checklistText: {
    flex: 1,
    fontSize: 9,
    color: '#333',
  },
  checklistNotes: {
    fontSize: 8,
    color: '#666',
    marginTop: 1,
  },
  // Photos
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  photoContainer: {
    width: '48%',
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderRadius: 3,
  },
  photoCaption: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  // Tier badge
  tierBadge: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    padding: '2 6',
    borderRadius: 3,
    marginLeft: 8,
  },
  tier1: { backgroundColor: '#FFD700', color: '#333' },
  tier2: { backgroundColor: '#C0C0C0', color: '#333' },
  tier3: { backgroundColor: '#CD7F32', color: '#fff' },
  // Notes
  notesBox: {
    border: '1px solid #ddd',
    padding: 8,
    borderRadius: 3,
    backgroundColor: '#fafafa',
  },
  notesText: {
    fontSize: 9,
    color: '#444',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #eee',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#999',
  },
  // Signature area
  signatureArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureLine: {
    width: '45%',
    borderBottom: '1px solid #333',
    marginBottom: 4,
    height: 30,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
  },
})

interface ReportProps {
  record: MaintenanceRecord
  equipment: Equipment
  facility: Facility
  tenant: Tenant
  tasksCompleted: Array<{ id: string; description: string; completed: boolean; notes?: string }>
}

export function MaintenanceReportPDF({
  record,
  equipment,
  facility,
  tenant,
  tasksCompleted,
}: ReportProps) {
  const tierStyle = record.maintenance_tier === 1 ? styles.tier1 : record.maintenance_tier === 2 ? styles.tier2 : styles.tier3

  const hasMeasurements =
    record.supply_fan_amp_l1 ||
    record.condenser_fan_amp_l1 ||
    record.suction_pressure ||
    record.discharge_pressure ||
    record.gas_pressure_in_wc ||
    record.supply_air_temp ||
    record.return_air_temp

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {tenant.logo_url ? (
              <Image src={tenant.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>{tenant.name}</Text>
            )}
            {tenant.contact_phone && (
              <Text style={styles.companyTagline}>{tenant.contact_phone} • {tenant.contact_email}</Text>
            )}
          </View>
          <View>
            <Text style={styles.reportTitle}>Maintenance Report</Text>
            <Text style={styles.reportSubtitle}>
              {SEASON_LABELS[record.season]} Service — {record.service_date}
            </Text>
            <Text style={styles.reportSubtitle}>
              {TIER_LABELS[record.maintenance_tier]}
            </Text>
          </View>
        </View>

        {/* FACILITY INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facility Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Facility Name</Text>
              <Text style={styles.infoValue}>{facility.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {[facility.address, facility.city, facility.province].filter(Boolean).join(', ')}
              </Text>
            </View>
            {facility.contact_name && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{facility.contact_name}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Service Date</Text>
              <Text style={styles.infoValue}>{record.service_date}</Text>
            </View>
          </View>
        </View>

        {/* EQUIPMENT INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Details</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Unit Name</Text>
              <Text style={styles.infoValue}>{equipment.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Equipment Type</Text>
              <Text style={styles.infoValue}>{EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}</Text>
            </View>
            {equipment.manufacturer && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Manufacturer</Text>
                <Text style={styles.infoValue}>{equipment.manufacturer}</Text>
              </View>
            )}
            {equipment.model_number && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Model Number</Text>
                <Text style={styles.infoValue}>{equipment.model_number}</Text>
              </View>
            )}
            {equipment.serial_number && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Serial Number</Text>
                <Text style={styles.infoValue}>{equipment.serial_number}</Text>
              </View>
            )}
            {equipment.tonnage && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Capacity</Text>
                <Text style={styles.infoValue}>{equipment.tonnage} Ton</Text>
              </View>
            )}
            {equipment.location_in_facility && (
              <View style={styles.infoItemFull}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{equipment.location_in_facility}</Text>
              </View>
            )}
          </View>
        </View>

        {/* MEASUREMENTS */}
        {hasMeasurements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Measurements & Readings</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellBold}>Reading</Text>
                <Text style={styles.tableCellBold}>Value</Text>
                <Text style={styles.tableCellBold}>Reading</Text>
                <Text style={styles.tableCellBold}>Value</Text>
              </View>
              {getMeasurementRows(record).map((row, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={styles.tableCellBold}>{row[0]}</Text>
                  <Text style={styles.tableCell}>{row[1]}</Text>
                  <Text style={styles.tableCellBold}>{row[2] || ''}</Text>
                  <Text style={styles.tableCell}>{row[3] || ''}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CHECKLIST */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Service Checklist — {tasksCompleted.filter(t => t.completed).length}/{tasksCompleted.length} Tasks Completed
          </Text>
          {tasksCompleted.map((task, i) => (
            <View key={task.id} style={[styles.checklistItem, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <View style={[styles.checkBox, !task.completed ? styles.checkBoxIncomplete : {}]}>
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checklistText}>{task.description}</Text>
                {task.notes && <Text style={styles.checklistNotes}>Note: {task.notes}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* FILTER INFO */}
        {(record.filter_condition && record.filter_condition !== 'n_a') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filter Service</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Filter Condition</Text>
                <Text style={styles.infoValue}>{record.filter_condition?.toUpperCase()}</Text>
              </View>
              {record.filter_size && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Filter Size</Text>
                  <Text style={styles.infoValue}>{record.filter_size}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TECHNICIAN NOTES */}
        {record.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technician Notes & Recommendations</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{record.notes}</Text>
            </View>
          </View>
        )}

        {/* SIGNATURE */}
        <View style={styles.signatureArea}>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Technician Signature</Text>
          </View>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Client Signature (if applicable)</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{tenant.name} — Maintenance Report</Text>
          <Text style={styles.footerText}>
            {equipment.name} @ {facility.name} — {record.service_date}
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>

      {/* PHOTOS PAGE (if photos exist) */}
      {record.photos && record.photos.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.companyName}>{tenant.name}</Text>
            <Text style={styles.reportSubtitle}>Service Photos — {equipment.name}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Photos</Text>
            <View style={styles.photosGrid}>
              {record.photos.map((photo, i) => (
                <View key={i} style={styles.photoContainer}>
                  <Image src={photo.url} style={styles.photo} />
                  {photo.caption && (
                    <Text style={styles.photoCaption}>{photo.caption}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>{tenant.name} — Service Photos</Text>
            <Text style={styles.footerText}>{record.service_date}</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}

function getMeasurementRows(record: MaintenanceRecord): string[][] {
  const rows: string[][] = []
  const measurements = [
    ['Supply Fan Amps L1', record.supply_fan_amp_l1, 'Supply Fan Amps L2', record.supply_fan_amp_l2],
    ['Supply Fan Amps L3', record.supply_fan_amp_l3, 'Cond. Fan Amps L1', record.condenser_fan_amp_l1],
    ['Voltage L1-L2', record.voltage_l1_l2, 'Voltage L2-L3', record.voltage_l2_l3],
    ['Voltage L1-L3', record.voltage_l1_l3, 'Cond. Fan Amps L2', record.condenser_fan_amp_l2],
    ['Suction Pressure', record.suction_pressure ? `${record.suction_pressure} psig` : null, 'Discharge Pressure', record.discharge_pressure ? `${record.discharge_pressure} psig` : null],
    ['Suction Temp', record.suction_temp ? `${record.suction_temp}°F` : null, 'Liquid Line Temp', record.liquid_line_temp ? `${record.liquid_line_temp}°F` : null],
    ['Superheat', record.superheat ? `${record.superheat}°F` : null, 'Subcooling', record.subcooling ? `${record.subcooling}°F` : null],
    ['Supply Air Temp', record.supply_air_temp ? `${record.supply_air_temp}°F` : null, 'Return Air Temp', record.return_air_temp ? `${record.return_air_temp}°F` : null],
    ['Temp Differential', record.temp_differential ? `${record.temp_differential}°F` : null, 'Gas Pressure', record.gas_pressure_in_wc ? `${record.gas_pressure_in_wc}" W.C.` : null],
    ['Supply Air Temp (Heat)', record.supply_air_temp_heat ? `${record.supply_air_temp_heat}°F` : null, 'Return Air Temp (Heat)', record.return_air_temp_heat ? `${record.return_air_temp_heat}°F` : null],
    ['Temperature Rise', record.temp_rise ? `${record.temp_rise}°F` : null, '', null],
  ]

  for (const row of measurements) {
    const hasData = row[1] !== null && row[1] !== undefined
    const hasData2 = row[3] !== null && row[3] !== undefined
    if (hasData || hasData2) {
      rows.push([
        row[0] as string,
        hasData ? String(row[1]) : '—',
        row[2] as string || '',
        hasData2 ? String(row[3]) : (row[2] ? '—' : ''),
      ])
    }
  }

  return rows
}
