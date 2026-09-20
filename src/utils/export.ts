import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Order } from "../types";

export function formatRupiah(amount: number): string {
  return "Rp " + (amount || 0).toLocaleString("id-ID");
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// Export Daily / Monthly Sales Report to PDF
export function exportOrdersToPDF(orders: Order[], title = "Laporan Pendapatan & Penjualan"): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();
  const printDateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Calculate metrics
  const validOrders = orders.filter((o) => o.status !== "DIBATALKAN");
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCompleted = orders.filter((o) => o.status === "SELESAI").length;
  const totalCancelled = orders.filter((o) => o.status === "DIBATALKAN").length;

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("MAKAN SANTAI", 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(title + " — Sistem Kasir Digital & Pembukuan Otomatis", 14, 21);
  doc.text(`Dicetak: ${printDateStr} | Status: Resmi`, 14, 27);

  // Summary Metrics Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 22, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL PENDAPATAN", 20, 44);
  doc.text("TOTAL TRANSAKSI", 85, 44);
  doc.text("SELESAI / DIBATALKAN", 145, 44);

  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(formatRupiah(totalRevenue), 20, 53);

  doc.setTextColor(15, 23, 42);
  doc.text(`${validOrders.length} Pesanan Sah`, 85, 53);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`${totalCompleted} Selesai | ${totalCancelled} Batal`, 145, 53);

  // Table Data
  const tableRows = orders.map((order, idx) => {
    const itemSummary = order.items
      .map((i) => `${i.productName} (x${i.quantity})`)
      .join(", ");
    return [
      idx + 1,
      order.orderNumber,
      formatDate(order.createdAt),
      order.customerName,
      itemSummary,
      formatRupiah(order.totalAmount),
      order.status,
    ];
  });

  autoTable(doc, {
    startY: 66,
    head: [["No", "No. Pesanan", "Tanggal & Waktu", "Pelanggan", "Item Menu", "Total", "Status"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 26 },
      2: { cellWidth: 32 },
      3: { cellWidth: 30 },
      4: { cellWidth: 44 },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 20, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        const val = data.cell.raw as string;
        if (val === "SELESAI") {
          data.cell.styles.textColor = [16, 185, 129]; // emerald
          data.cell.styles.fontStyle = "bold";
        } else if (val === "DIBATALKAN") {
          data.cell.styles.textColor = [239, 68, 68]; // red
        } else if (val === "DIPROSES") {
          data.cell.styles.textColor = [59, 130, 246]; // blue
        } else {
          data.cell.styles.textColor = [245, 158, 11]; // amber
        }
      }
    },
  });

  // Save the PDF
  const filename = `Laporan_Kasir_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// Export Orders Report to Excel (.xlsx)
export function exportOrdersToExcel(orders: Order[], title = "Laporan_Penjualan"): void {
  const validOrders = orders.filter((o) => o.status !== "DIBATALKAN");
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Prepare sheet rows
  const rows: Record<string, any>[] = orders.map((order, idx) => ({
    "No": idx + 1,
    "Nomor Pesanan": order.orderNumber,
    "Tanggal": formatDate(order.createdAt),
    "Nama Pelanggan": order.customerName,
    "Email Akun Google": order.customerEmail,
    "ID Unik Pengguna": order.customerId,
    "Tipe Pesanan": order.orderType === "dine_in" ? `Dine In (Meja ${order.tableNumber || "-"})` : "Take Away",
    "Daftar Item": order.items.map((i) => `${i.productName} (x${i.quantity})`).join("; "),
    "Total Nominal (Rp)": order.totalAmount,
    "Metode Pembayaran": "QRIS Resmi",
    "Status": String(order.status),
    "Waktu Konfirmasi": order.confirmedAt ? formatDate(order.confirmedAt) : "-",
    "Waktu Selesai": order.completedAt ? formatDate(order.completedAt) : "-",
    "Catatan/Alasan Batal": order.cancelReason || "-",
  }));

  // Append summary row
  rows.push({
    "No": "" as any,
    "Nomor Pesanan": "TOTAL PENDAPATAN RESMI",
    "Tanggal": "",
    "Nama Pelanggan": "",
    "Email Akun Google": "",
    "ID Unik Pengguna": "",
    "Tipe Pesanan": "",
    "Daftar Item": "",
    "Total Nominal (Rp)": totalRevenue,
    "Metode Pembayaran": "",
    "Status": `${validOrders.length} Pesanan Sah`,
    "Waktu Konfirmasi": "",
    "Waktu Selesai": "",
    "Catatan/Alasan Batal": "",
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  const colWidths = [
    { wch: 6 },  // No
    { wch: 18 }, // OrderNumber
    { wch: 20 }, // Tanggal
    { wch: 22 }, // Nama
    { wch: 26 }, // Email
    { wch: 20 }, // ID Pengguna
    { wch: 16 }, // Tipe
    { wch: 40 }, // Items
    { wch: 18 }, // Total
    { wch: 16 }, // Metode
    { wch: 18 }, // Status
    { wch: 20 }, // Waktu Konfirmasi
    { wch: 20 }, // Waktu Selesai
    { wch: 24 }, // Alasan Batal
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${title}_${todayStr}.xlsx`);
}
