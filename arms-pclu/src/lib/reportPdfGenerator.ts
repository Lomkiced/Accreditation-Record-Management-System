import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface GeneratePdfReportOptions {
  title: string
  subtitle?: string
  scopeDescription?: string
  dateRangeDescription?: string
  fileName: string
  data: Record<string, any>[]
}

export function generateInstitutionalPdfReport(options: GeneratePdfReportOptions) {
  const {
    title,
    subtitle = "Accreditation Record Management System (ARMS)",
    scopeDescription = "All Areas",
    dateRangeDescription = "All Time",
    fileName,
    data,
  } = options

  if (!data || data.length === 0) {
    throw new Error("No data available to generate report.")
  }

  // Create landscape A4 document for maximum tabular readability
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // ─── INSTITUTIONAL HEADER ───────────────────────────────────────────
  // Primary Navy Header Band
  doc.setFillColor(15, 23, 42) // #0F172A
  doc.rect(0, 0, pageWidth, 4, "F")

  // College Name & Subtitles
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text("POLYTECHNIC COLLEGE OF LA UNION", pageWidth / 2, 14, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(subtitle, pageWidth / 2, 19, { align: "center" })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(30, 64, 175) // Blue-800
  doc.text(title.toUpperCase(), pageWidth / 2, 26, { align: "center" })

  // ─── METADATA SUMMARY BAR ───────────────────────────────────────────
  const startY = 32
  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, startY, pageWidth - 28, 12, 1.5, 1.5, "FD")

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)

  const dateGenerated = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  doc.text(`Scope: ${scopeDescription}`, 18, startY + 7.5)
  doc.text(`Period: ${dateRangeDescription}`, (pageWidth / 2) - 30, startY + 7.5)
  doc.text(`Generated: ${dateGenerated}`, pageWidth - 80, startY + 7.5)

  // ─── AUTO-TABLE CONFIGURATION ───────────────────────────────────────
  const headers = Object.keys(data[0])
  const rows = data.map((row) => headers.map((key) => String(row[key] ?? "")))

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: startY + 16,
    margin: { left: 14, right: 14, top: 20, bottom: 20 },
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    styles: {
      overflow: "linebreak",
      cellWidth: "auto",
    },
    didDrawPage: (hookData) => {
      // ─── OFFICIAL FOOTER ON EVERY PAGE ──────────────────────────────
      const currentYear = new Date().getFullYear()
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)

      // Left: Certification Notice
      doc.text(
        "OFFICIAL PCLU ACCREDITATION RECORD • NON-EDITABLE DOCUMENT • CONFIDENTIAL",
        14,
        pageHeight - 8
      )

      // Right: Page Numbers
      const pageNumStr = `Page ${hookData.pageNumber}`
      doc.text(pageNumStr, pageWidth - 14, pageHeight - 8, { align: "right" })

      // Bottom Navy Accent Line
      doc.setFillColor(15, 23, 42)
      doc.rect(0, pageHeight - 2, pageWidth, 2, "F")
    },
  })

  // Save the tamper-proof PDF
  doc.save(fileName)
}
