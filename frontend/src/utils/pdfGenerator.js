import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatDate = (val) => {
  if (!val) return '—';
  try {
    let d = typeof val === 'string' ? new Date(val) : val;
    if (d?.toDate) d = d.toDate();
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(val);
  }
};

const drawHeader = (doc, org, title, number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  if (org?.logo) {
    try {
      const imgProps = doc.getImageProperties(org.logo);
      const imgW = 20;
      const imgH = (imgProps.height * imgW) / imgProps.width;
      doc.addImage(org.logo, 'IMAGE', 20, y, imgW, imgH);
    } catch {
      // logo failed to render, skip
    }
  }

  const textX = org?.logo ? 46 : 20;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(org?.name || 'EventFlow', textX, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${title}  #${number}`, textX, y + 15);

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y + 20, pageWidth - 20, y + 20);

  return y + 28;
};

const drawClientInfo = (doc, label, data) => {
  const y0 = label.y;
  let y = y0;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Client:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName || '—', 45, y);

  if (data.clientEmail) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.clientEmail, 45, y);
  }

  if (data.clientPhone) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.clientPhone, 45, y);
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(label.dateLabel + ':', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(label.dateValue), 45, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.status || '—', 45, y);

  return y + 10;
};

const drawTotals = (doc, startY, data) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const x = pageWidth - 80;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let y = startY;

  doc.text('Subtotal', x, y);
  doc.text(formatCurrency(data.subtotal), pageWidth - 20, y, { align: 'right' });

  if (data.discountAmount > 0) {
    y += 6;
    doc.text(`Discount (${data.discountPercent}%)`, x, y);
    doc.text(`-${formatCurrency(data.discountAmount)}`, pageWidth - 20, y, { align: 'right' });
  }

  if (data.taxAmount > 0) {
    y += 6;
    doc.text(`Tax (${data.taxPercent}%)`, x, y);
    doc.text(`+${formatCurrency(data.taxAmount)}`, pageWidth - 20, y, { align: 'right' });
  }

  y += 4;
  doc.setDrawColor(0, 0, 0);
  doc.line(x, y, pageWidth - 20, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total', x, y);
  doc.text(formatCurrency(data.totalAmount), pageWidth - 20, y, { align: 'right' });

  return y + 10;
};

const drawNotes = (doc, startY, notes) => {
  if (!notes || !notes.trim()) return startY;

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Notes / Terms:', 20, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(notes, pageWidth - 40);
  doc.text(lines, 20, y);

  return y + lines.length * 4 + 6;
};

const downloadPdf = (doc, filename) => {
  doc.save(filename);
};

// ─── Quotation PDF ──────────────────────────────────────────

export const downloadQuotationPdf = (quotation, org) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawHeader(doc, org, 'QUOTATION', quotation.quotationNumber || '—');

  y = drawClientInfo(doc, {
    y,
    dateLabel: 'Valid Until',
    dateValue: quotation.validUntil,
  }, quotation);

  const rows = (quotation.lineItems || []).map((li, i) => [
    i + 1,
    li.snapshotName || '—',
    li.snapshotSize || '—',
    li.quantity,
    formatCurrency(li.snapshotPrice),
    formatCurrency((Number(li.snapshotPrice) || 0) * (Number(li.quantity) || 0)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'Size', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  y = drawTotals(doc, y, quotation);

  drawNotes(doc, y, quotation.notes);

  const filename = `${quotation.quotationNumber || 'quotation'}.pdf`;
  downloadPdf(doc, filename);
};

// ─── Invoice PDF ────────────────────────────────────────────

export const downloadInvoicePdf = (invoice, org) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawHeader(doc, org, 'INVOICE', invoice.invoiceNumber || '—');

  y = drawClientInfo(doc, {
    y,
    dateLabel: 'Due Date',
    dateValue: invoice.dueDate,
  }, invoice);

  const rows = (invoice.lineItems || []).map((li, i) => [
    i + 1,
    li.description || '—',
    li.quantity,
    formatCurrency(li.unitPrice),
    formatCurrency((Number(li.quantity) || 0) * (Number(li.unitPrice) || 0)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  y = drawTotals(doc, y, invoice);

  drawNotes(doc, y, invoice.notes);

  const filename = `${invoice.invoiceNumber || 'invoice'}.pdf`;
  downloadPdf(doc, filename);
};
