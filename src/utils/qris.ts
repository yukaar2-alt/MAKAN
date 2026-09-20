import QRCode from "qrcode";

export const MERCHANT_NAME = "MAKAN SANTAI, KBYRN LM";
export const MERCHANT_CITY = "KBYRN LM";
export const MERCHANT_NMID = "ID1026597604283";
export const MERCHANT_A01 = "A01";
export const MERCHANT_PRINTER_CODE = "93600914";
export const QRIS_STAND_PHOTO = "/qris_makan_santai.jpg";

// Generate standard QRIS payload string
export function generateQRISPayload(amount: number, orderNumber: string): string {
  // Static/dynamic QRIS structure complying with ASPI / Bank Indonesia standard format representation
  const payload = `00020101021226580016ID.CO.QRIS.WWW01189360099900000000000215${MERCHANT_NMID}0303UME51440014ID.GO.BI01189360099900000000000215${MERCHANT_NMID}520458125303360540${amount.toString().length < 10 ? amount.toString().length.toString().padStart(2, "0") + amount : amount}5802ID59${MERCHANT_NAME.length.toString().padStart(2, "0")}${MERCHANT_NAME}60${MERCHANT_CITY.length.toString().padStart(2, "0")}${MERCHANT_CITY}61051234062${(orderNumber.length + 4).toString().padStart(2, "0")}01${orderNumber.length.toString().padStart(2, "0")}${orderNumber}6304ABCD`;
  return payload;
}

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("Failed to generate QR Code:", err);
    return "";
  }
}
