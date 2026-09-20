import { Order, ReceiptPaperSize } from "../types";
import { formatRupiah, formatDate } from "./export";
import jsPDF from "jspdf";

export interface ReceiptPrintOptions {
  paperSize?: ReceiptPaperSize;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  footerMessage?: string;
  cashierName?: string;
}

const DEFAULT_STORE = {
  name: "MAKAN SANTAI",
  address: "Jl. Johari Raya No. 9, kebayoran lama, Jakarta Selatan",
  phone: "0856-2408-6661",
  footer: "Terima kasih atas kunjungan Anda!\nBarang/makanan yang sudah dibeli tidak dapat ditukar.\nSimpan struk ini sebagai bukti pembayaran sah.",
  cashier: "Kasir POS 01",
};

/**
 * Generate clean HTML for 58mm or 80mm thermal receipt printing
 */
export function generateReceiptHTML(order: Order, options: ReceiptPrintOptions = {}): string {
  const paperSize = options.paperSize || "58mm";
  const storeName = options.storeName || DEFAULT_STORE.name;
  const storeAddress = options.storeAddress || DEFAULT_STORE.address;
  const storePhone = options.storePhone || DEFAULT_STORE.phone;
  const footer = options.footerMessage || DEFAULT_STORE.footer;
  const cashier = options.cashierName || DEFAULT_STORE.cashier;

  const is58 = paperSize === "58mm";
  const printWidth = is58 ? "48mm" : "72mm";
  const baseFontSize = is58 ? "11px" : "12px";

  const orderDate = formatDate(order.confirmedAt || order.createdAt);
  const orderTypeLabel =
    order.orderType === "dine_in"
      ? `DINE IN (Meja ${order.tableNumber || "-"})`
      : "TAKE AWAY (Bungkus)";

  const itemsHtml = order.items
    .map((item) => {
      const lineTotal = formatRupiah(item.price * item.quantity);
      const noteHtml = item.notes
        ? `<div style="font-size: 9px; color: #444; font-style: italic; margin-top: 1px; padding-left: 6px;">* ${item.notes}</div>`
        : "";

      return `
        <div style="margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span style="flex: 1; text-align: left; word-break: break-word;">${item.productName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #222;">
            <span>${item.quantity} x ${formatRupiah(item.price)}</span>
            <span style="font-weight: bold;">${lineTotal}</span>
          </div>
          ${noteHtml}
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Struk #${order.orderNumber}</title>
      <style>
        @page {
          size: ${paperSize} auto;
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: ${baseFontSize};
          line-height: 1.25;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 6px 8px 30px 8px;
          width: ${printWidth};
          max-width: ${printWidth};
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .divider {
          border-top: 1px dashed #000;
          margin: 5px 0;
        }
        .divider-double {
          border-top: 2px solid #000;
          margin: 6px 0;
        }
        .bold { font-weight: bold; }
        .flex-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-title {
          font-size: ${is58 ? "14px" : "16px"};
          font-weight: 900;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .header-sub {
          font-size: 9px;
          color: #333;
          margin-bottom: 4px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 2px;
        }
        .total-box {
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px dashed #000;
        }
        .grand-total {
          font-size: ${is58 ? "14px" : "15px"};
          font-weight: 900;
          margin: 4px 0;
        }
        .qris-badge {
          display: inline-block;
          border: 1px solid #000;
          padding: 2px 6px;
          font-size: 9px;
          font-weight: bold;
          margin-top: 4px;
        }
        .footer-note {
          font-size: 9px;
          text-align: center;
          margin-top: 8px;
          white-space: pre-line;
          color: #222;
        }
        .cut-space {
          height: 35px;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="header-title">${storeName}</div>
        <div class="header-sub">${storeAddress}</div>
        <div class="header-sub">Telp: ${storePhone}</div>
      </div>

      <div class="divider-double"></div>

      <div class="meta-row">
        <span>No. Struk:</span>
        <span class="bold">#${order.orderNumber}</span>
      </div>
      <div class="meta-row">
        <span>Waktu:</span>
        <span>${orderDate}</span>
      </div>
      <div class="meta-row">
        <span>Kasir:</span>
        <span>${cashier}</span>
      </div>
      <div class="meta-row">
        <span>Tipe:</span>
        <span class="bold">${orderTypeLabel}</span>
      </div>
      <div class="meta-row">
        <span>Pelanggan:</span>
        <span class="bold">${order.customerName}</span>
      </div>

      <div class="divider"></div>

      <!-- Items -->
      <div>
        ${itemsHtml}
      </div>

      <div class="divider"></div>

      <!-- Total Calculation -->
      <div class="meta-row">
        <span>Subtotal:</span>
        <span>${formatRupiah(order.totalAmount)}</span>
      </div>
      <div class="meta-row">
        <span>Diskon:</span>
        <span>Rp 0</span>
      </div>
      <div class="meta-row">
        <span>Pajak Resto (PB1):</span>
        <span>Termasuk (10%)</span>
      </div>

      <div class="divider"></div>

      <div class="flex-row grand-total">
        <span>TOTAL TAGIHAN:</span>
        <span>${formatRupiah(order.totalAmount)}</span>
      </div>

      <div class="divider"></div>

      <div class="meta-row">
        <span>Metode Pembayaran:</span>
        <span class="bold">QRIS Dinamis</span>
      </div>
      <div class="meta-row">
        <span>Status Transaksi:</span>
        <span class="bold" style="text-decoration: underline;">LUNAS / BERHASIL</span>
      </div>

      <div class="text-center" style="margin-top: 4px;">
        <span class="qris-badge">VERIFIKASI QRIS GPN SUKSES</span>
      </div>

      <div class="footer-note">
        ${footer}
      </div>

      <div class="text-center" style="font-size: 8px; color: #555; margin-top: 6px;">
        *** Terima Kasih & Selamat Menikmati ***
      </div>

      <!-- Feed space for thermal paper cutter -->
      <div class="cut-space"></div>
    </body>
    </html>
  `;
}

/**
 * Direct print execution to connected cashier printer (USB, Bluetooth, LAN, or System POS default)
 * Uses a hidden iframe so the main UI never shifts or prints the full page.
 */
export function printReceipt(
  order: Order,
  options: ReceiptPrintOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Remove any existing print iframe
      const existing = document.getElementById("pos-thermal-print-frame");
      if (existing) {
        document.body.removeChild(existing);
      }

      const iframe = document.createElement("iframe");
      iframe.id = "pos-thermal-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      iframe.setAttribute("title", "Thermal Print Receipt");

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        resolve(false);
        return;
      }

      const html = generateReceiptHTML(order, options);
      doc.open();
      doc.write(html);
      doc.close();

      const triggerPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (e) {
          console.error("Print execution failed:", e);
          resolve(false);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3000);
        }
      };

      // Wait brief moment for resources/fonts to settle inside iframe
      if (iframe.contentWindow) {
        iframe.contentWindow.onload = triggerPrint;
        setTimeout(triggerPrint, 350);
      } else {
        setTimeout(triggerPrint, 250);
      }
    } catch (err) {
      console.error("Failed to prepare receipt for printing:", err);
      resolve(false);
    }
  });
}

/**
 * Generate formatted plain text representation of the receipt
 * Useful for copying to WhatsApp, Telegram, or Raw POS socket
 */
export function generateReceiptText(order: Order, options: ReceiptPrintOptions = {}): string {
  const storeName = options.storeName || DEFAULT_STORE.name;
  const storeAddress = options.storeAddress || DEFAULT_STORE.address;
  const storePhone = options.storePhone || DEFAULT_STORE.phone;
  const orderDate = formatDate(order.confirmedAt || order.createdAt);
  const orderType =
    order.orderType === "dine_in"
      ? `Dine In (Meja ${order.tableNumber || "-"})`
      : "Take Away (Bungkus)";

  let text = `================================\n`;
  text += `   ${storeName}\n`;
  text += `   ${storeAddress}\n`;
  text += `   Telp: ${storePhone}\n`;
  text += `================================\n`;
  text += `No. Pesanan : #${order.orderNumber}\n`;
  text += `Tanggal     : ${orderDate}\n`;
  text += `Tipe        : ${orderType}\n`;
  text += `Pelanggan   : ${order.customerName}\n`;
  text += `Kasir       : ${options.cashierName || DEFAULT_STORE.cashier}\n`;
  text += `--------------------------------\n`;

  order.items.forEach((item) => {
    const total = formatRupiah(item.price * item.quantity);
    text += `${item.productName}\n`;
    text += `  ${item.quantity} x ${formatRupiah(item.price)} = ${total}\n`;
    if (item.notes) {
      text += `  * Catatan: ${item.notes}\n`;
    }
  });

  text += `--------------------------------\n`;
  text += `Subtotal    : ${formatRupiah(order.totalAmount)}\n`;
  text += `Diskon      : Rp 0\n`;
  text += `Pajak PB1   : Termasuk (10%)\n`;
  text += `================================\n`;
  text += `TOTAL BAYAR : ${formatRupiah(order.totalAmount)}\n`;
  text += `Metode      : QRIS Dinamis\n`;
  text += `Status      : LUNAS / BERHASIL\n`;
  text += `================================\n`;
  text += `Terima kasih atas kunjungan Anda!\n`;
  text += `Simpan struk ini sebagai bukti pembayaran yang sah.\n`;
  text += `================================\n`;

  return text;
}

/**
 * Generate and download a roll PDF of the receipt
 */
export function downloadReceiptPDF(order: Order, paperSize: ReceiptPaperSize = "58mm") {
  const widthMm = paperSize === "58mm" ? 58 : 80;
  // Estimate height: header (30mm) + items (10mm each) + totals (40mm) + footer (25mm)
  const estHeight = Math.max(120, 95 + order.items.length * 10);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [widthMm, estHeight],
  });

  const centerX = widthMm / 2;
  let y = 8;

  // Header
  doc.setFont("courier", "bold");
  doc.setFontSize(paperSize === "58mm" ? 10 : 12);
  doc.text("MAKAN SANTAI", centerX, y, { align: "center" });

  y += 4;
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.text("Jl. Nusantara Raya No. 88, Menteng", centerX, y, { align: "center" });

  y += 3.5;
  doc.text("Telp: 0812-3456-7890", centerX, y, { align: "center" });

  y += 3;
  doc.text("-".repeat(paperSize === "58mm" ? 32 : 45), centerX, y, { align: "center" });

  // Metadata
  y += 4;
  doc.setFontSize(7.5);
  doc.text(`No. Struk: #${order.orderNumber}`, 4, y);
  y += 3.5;
  doc.text(`Waktu    : ${formatDate(order.confirmedAt || order.createdAt)}`, 4, y);
  y += 3.5;
  const orderType =
    order.orderType === "dine_in"
      ? `Dine In (Meja ${order.tableNumber || "-"})`
      : "Take Away (Bungkus)";
  doc.text(`Tipe     : ${orderType}`, 4, y);
  y += 3.5;
  doc.text(`Customer : ${order.customerName.slice(0, 22)}`, 4, y);

  y += 3;
  doc.text("-".repeat(paperSize === "58mm" ? 32 : 45), centerX, y, { align: "center" });

  // Items
  y += 4;
  order.items.forEach((item) => {
    doc.setFont("courier", "bold");
    doc.text(item.productName.slice(0, paperSize === "58mm" ? 22 : 32), 4, y);
    y += 3.5;
    doc.setFont("courier", "normal");
    const qtyPrice = `${item.quantity} x ${formatRupiah(item.price)}`;
    const lineTotal = formatRupiah(item.price * item.quantity);
    doc.text(qtyPrice, 4, y);
    doc.text(lineTotal, widthMm - 4, y, { align: "right" });
    if (item.notes) {
      y += 3;
      doc.setFontSize(6.5);
      doc.text(`* ${item.notes.slice(0, 26)}`, 4, y);
      doc.setFontSize(7.5);
    }
    y += 4;
  });

  doc.text("-".repeat(paperSize === "58mm" ? 32 : 45), centerX, y, { align: "center" });

  // Total
  y += 4;
  doc.setFont("courier", "bold");
  doc.setFontSize(paperSize === "58mm" ? 9 : 10);
  doc.text("TOTAL BAYAR:", 4, y);
  doc.text(formatRupiah(order.totalAmount), widthMm - 4, y, { align: "right" });

  y += 4;
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.text("Metode: QRIS Resmi (LUNAS)", 4, y);

  y += 4;
  doc.text("=".repeat(paperSize === "58mm" ? 32 : 45), centerX, y, { align: "center" });

  y += 4;
  doc.setFontSize(6.5);
  doc.text("Terima kasih atas kunjungan Anda!", centerX, y, { align: "center" });
  y += 3;
  doc.text("Simpan struk ini sebagai bukti sah.", centerX, y, { align: "center" });

  doc.save(`Struk_${order.orderNumber}.pdf`);
}
