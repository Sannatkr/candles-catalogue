import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * A downloadable invoice, built client-side. GST is optional per invoice — with
 * it on, the title becomes "TAX INVOICE" and the tax breakup and HSN column
 * appear; with it off it is a plain invoice.
 *
 * The rupee symbol is written as "Rs." on purpose: jsPDF's built-in fonts have
 * no ₹ glyph, so the symbol would come out as a blank box.
 */

export type InvoiceLine = {
  description: string;
  hsn: string;
  qty: number;
  rate: number;
};

export type InvoiceData = {
  sellerName: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerGstin: string;

  invoiceNo: string;
  invoiceDate: string; // yyyy-mm-dd

  isGst: boolean;
  gstRate: number;
  interState: boolean;

  buyerName: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerGstin: string;

  lines: InvoiceLine[];
  discount: number;
  shipping: number;
  notes: string;
};

export function invoiceTotals(d: InvoiceData) {
  const subtotal = d.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0);
  const discount = Math.min(Math.max(0, d.discount || 0), subtotal);
  const taxable = subtotal - discount;
  const rate = d.isGst ? Math.max(0, d.gstRate || 0) : 0;
  const tax = Math.round((taxable * rate) / 100);
  const cgst = d.isGst && !d.interState ? Math.round(tax / 2) : 0;
  const sgst = cgst;
  const igst = d.isGst && d.interState ? tax : 0;
  const shipping = Math.max(0, d.shipping || 0);
  const grand = Math.round(taxable + tax + shipping);
  return { subtotal, discount, taxable, rate, tax, cgst, sgst, igst, shipping, grand };
}

// ------------------------------------------------------------ amount in words

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoWords(n: number): string {
  if (n < 20) return ONES[n];
  return (TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "")).trim();
}

function threeWords(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return ((h ? ONES[h] + " Hundred" + (r ? " " : "") : "") + (r ? twoWords(r) : "")).trim();
}

export function amountInWords(value: number): string {
  let num = Math.round(Math.max(0, value));
  if (num === 0) return "Rupees Zero Only";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  let words = "";
  if (crore) words += threeWords(crore) + " Crore ";
  if (lakh) words += twoWords(lakh) + " Lakh ";
  if (thousand) words += twoWords(thousand) + " Thousand ";
  if (hundred) words += threeWords(hundred) + " ";
  return "Rupees " + words.trim() + " Only";
}

// -------------------------------------------------------------------- the pdf

const INK: [number, number, number] = [30, 25, 19];
const GRAY: [number, number, number] = [110, 102, 92];
const ACCENT: [number, number, number] = [180, 95, 43];

const rs = (n: number) => "Rs. " + Math.round(n).toLocaleString("en-IN");

function formatDate(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split("-");
  if (parts.length !== 3) return yyyyMmDd;
  const [y, m, d] = parts.map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !d) return yyyyMmDd;
  return `${d} ${months[m - 1] ?? ""} ${y}`;
}

export function generateInvoicePdf(d: InvoiceData) {
  const t = invoiceTotals(d);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 42;
  const rightX = pageW - margin;

  // ---- header: seller (left) + title/meta (right) ----
  let y = margin + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(d.sellerName || "Invoice", margin, y);

  doc.setFontSize(20);
  doc.setTextColor(...ACCENT);
  doc.text(d.isGst ? "TAX INVOICE" : "INVOICE", rightX, y, { align: "right" });

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  for (const line of d.sellerAddress.split("\n").map((l) => l.trim()).filter(Boolean)) {
    doc.text(line, margin, y);
    y += 12;
  }
  if (d.sellerPhone) { doc.text("Phone: " + d.sellerPhone, margin, y); y += 12; }
  if (d.sellerEmail) { doc.text("Email: " + d.sellerEmail, margin, y); y += 12; }
  if (d.isGst && d.sellerGstin) { doc.text("GSTIN: " + d.sellerGstin, margin, y); y += 12; }

  // meta block under the title
  let metaY = margin + 4 + 30;
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  const meta = [
    ["Invoice No", d.invoiceNo || "—"],
    ["Date", formatDate(d.invoiceDate)],
  ];
  for (const [label, val] of meta) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(label, rightX - 150, metaY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(String(val), rightX, metaY, { align: "right" });
    metaY += 15;
  }

  y = Math.max(y, metaY) + 6;
  doc.setDrawColor(220, 214, 205);
  doc.line(margin, y, rightX, y);
  y += 20;

  // ---- bill to ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text("BILL TO", margin, y);
  y += 14;
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(d.buyerName || "—", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  for (const line of d.buyerAddress.split("\n").map((l) => l.trim()).filter(Boolean)) {
    doc.text(line, margin, y);
    y += 12;
  }
  if (d.buyerPhone) { doc.text("Phone: " + d.buyerPhone, margin, y); y += 12; }
  if (d.isGst && d.buyerGstin) { doc.text("GSTIN: " + d.buyerGstin, margin, y); y += 12; }
  y += 10;

  // ---- items table ----
  const head = d.isGst
    ? [["#", "Description", "HSN", "Qty", "Rate", "Amount"]]
    : [["#", "Description", "Qty", "Rate", "Amount"]];
  const body = d.lines
    .filter((l) => l.description.trim() || l.qty || l.rate)
    .map((l, i) => {
      const amount = (Number(l.qty) || 0) * (Number(l.rate) || 0);
      return d.isGst
        ? [String(i + 1), l.description, l.hsn || "", String(l.qty || 0), rs(l.rate || 0), rs(amount)]
        : [String(i + 1), l.description, String(l.qty || 0), rs(l.rate || 0), rs(amount)];
    });

  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: margin, right: margin },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: INK, lineColor: [225, 219, 210], lineWidth: 0.5 },
    headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], fontStyle: "bold", halign: "left" },
    columnStyles: d.isGst
      ? {
          0: { cellWidth: 26, halign: "center" },
          2: { cellWidth: 52, halign: "center" },
          3: { cellWidth: 40, halign: "right" },
          4: { cellWidth: 70, halign: "right" },
          5: { cellWidth: 80, halign: "right" },
        }
      : {
          0: { cellWidth: 26, halign: "center" },
          2: { cellWidth: 46, halign: "right" },
          3: { cellWidth: 80, halign: "right" },
          4: { cellWidth: 90, halign: "right" },
        },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  y = finalY + 18;

  // ---- totals (right column) ----
  const labelX = rightX - 190;
  const valX = rightX;
  const row = (label: string, val: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(...(bold ? INK : GRAY));
    doc.text(label, labelX, y);
    doc.setTextColor(...INK);
    doc.text(val, valX, y, { align: "right" });
    y += bold ? 20 : 15;
  };

  row("Subtotal", rs(t.subtotal));
  if (t.discount > 0) row("Discount", "- " + rs(t.discount));
  if (d.isGst) {
    row("Taxable value", rs(t.taxable));
    if (t.igst > 0) row(`IGST (${t.rate}%)`, rs(t.igst));
    else {
      row(`CGST (${t.rate / 2}%)`, rs(t.cgst));
      row(`SGST (${t.rate / 2}%)`, rs(t.sgst));
    }
  }
  if (t.shipping > 0) row("Delivery", rs(t.shipping));

  doc.setDrawColor(220, 214, 205);
  doc.line(labelX, y - 6, valX, y - 6);
  row("Total", rs(t.grand), true);

  // ---- amount in words ----
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(amountInWords(t.grand), margin, y, { maxWidth: pageW - margin * 2 });
  y += 22;

  // ---- notes ----
  if (d.notes.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text("NOTES", margin, y);
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    const noteLines = doc.splitTextToSize(d.notes.trim(), pageW - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 12 + 8;
  }

  // ---- footer ----
  const footY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(230, 225, 217);
  doc.line(margin, footY - 12, rightX, footY - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("This is a computer-generated invoice.", margin, footY);
  doc.text("Thank you for your order.", rightX, footY, { align: "right" });

  const safeName = (d.invoiceNo || "invoice").replace(/[^\w-]+/g, "-");
  doc.save(`${safeName}.pdf`);
}
