import { Resend } from 'resend'

interface SendEmailArgs {
  to: string
  fromName: string
  subject: string
  html: string
  text?: string
  attachments?: { filename: string; content: Buffer | string }[]
  replyTo?: string
}

export async function sendEmail(args: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping send:', args.subject)
    return { skipped: true }
  }
  const resend = new Resend(apiKey)
  const from = `${args.fromName} <${process.env.EMAIL_FROM || 'reports@truenorth-mechanical.com'}>`

  return resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    reply_to: args.replyTo,
    attachments: args.attachments,
  })
}

export function buildSupplierOrderEmail(opts: {
  tenantName: string
  accountNumber?: string
  facilityName: string
  neededByDate: string
  items: { name: string; quantity: number; part_number?: string }[]
}) {
  const rows = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px">${i.name}</td><td style="padding:4px 8px">${i.part_number ?? ''}</td><td style="padding:4px 8px">${i.quantity}</td></tr>`
    )
    .join('')
  return `
    <div style="font-family:sans-serif">
      <h2>Parts order — ${opts.tenantName}</h2>
      <p>Account: ${opts.accountNumber ?? 'On file'}</p>
      <p>Needed by: <strong>${opts.neededByDate}</strong> (for scheduled maintenance at ${opts.facilityName})</p>
      <table style="border-collapse:collapse;width:100%">
        <thead><tr><th align="left">Part</th><th align="left">Part #</th><th align="left">Qty</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Please confirm PO / availability by reply.</p>
    </div>
  `
}

export function buildManagerProcurementEmail(opts: {
  supplierName: string
  supplierPhone?: string
  accountNumber?: string
  facilityName: string
  confirmUrl: string
}) {
  return `
    <div style="font-family:sans-serif">
      <h2>Parts ordered — call in your PO</h2>
      <p>An order was sent to <strong>${opts.supplierName}</strong> for the upcoming visit at ${opts.facilityName}.</p>
      <p>Phone: ${opts.supplierPhone ?? 'n/a'} | Account: ${opts.accountNumber ?? 'on file'}</p>
      <p><a href="${opts.confirmUrl}">Enter PO number</a> once confirmed.</p>
    </div>
  `
}

export function buildManagerNotificationHTML(opts: {
  facilityName: string
  flaggedCount: number
  visitUrl: string
}) {
  return `
    <div style="font-family:sans-serif">
      <h2>${opts.flaggedCount} item(s) flagged during today's visit</h2>
      <p>A technician left notes worth a look on <strong>${opts.facilityName}</strong>'s visit report.</p>
      <p><a href="${opts.visitUrl}">Review the visit</a> and build a quote from Recommendations if needed.</p>
    </div>
  `
}

export function buildReportEmailHTML(opts: {
  facilityName: string
  season: string
  equipmentCount: number
  portalUrl: string
}) {
  return `
    <div style="font-family:sans-serif">
      <h2>Your ${opts.season} maintenance report is ready</h2>
      <p>${opts.equipmentCount} piece(s) of equipment were serviced at ${opts.facilityName}.</p>
      <p>The full report is attached, and always available in your <a href="${opts.portalUrl}">client portal</a>.</p>
    </div>
  `
}

export function buildQuoteEmailHTML(opts: {
  facilityName: string
  lineItems: { description: string; quantity: number; unit_price: number; total: number }[]
  subtotal: number
  gst: number
  total: number
  portalUrl: string
}) {
  const rows = opts.lineItems
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px">${i.description}</td><td style="padding:4px 8px">${i.quantity}</td><td style="padding:4px 8px">$${i.unit_price.toFixed(2)}</td><td style="padding:4px 8px">$${i.total.toFixed(2)}</td></tr>`
    )
    .join('')
  return `
    <div style="font-family:sans-serif">
      <h2>Quote for ${opts.facilityName}</h2>
      <table style="border-collapse:collapse;width:100%">
        <thead><tr><th align="left">Description</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Subtotal: $${opts.subtotal.toFixed(2)}<br/>GST: $${opts.gst.toFixed(2)}<br/><strong>Total: $${opts.total.toFixed(2)}</strong></p>
      <p><a href="${opts.portalUrl}">Review and approve in your client portal</a></p>
    </div>
  `
}
