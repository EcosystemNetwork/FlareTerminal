import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export const BANKNOTE_DENOMINATIONS = [2, 5, 10, 20, 50, 100] as const;

/** Banknote size in mm (US currency proportions). */
const NOTE_WIDTH = 156;
const NOTE_HEIGHT = 66;

/** Group lengths used when rendering a private key as human readable text. */
const PRIVATE_KEY_GROUPS = [4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 1];

/**
 * Generates a 64 character hex string. This is a placeholder for a securely
 * generated burner key.
 */
export const generateBanknotePrivateKey = (): string =>
  Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

export const formatPrivateKey = (key: string): string => {
  let formatted = "";
  let index = 0;
  for (const groupLength of PRIVATE_KEY_GROUPS) {
    if (formatted) formatted += "-";
    formatted += key.slice(index, index + groupLength);
    index += groupLength;
  }
  return formatted;
};

export interface BanknoteDetails {
  denomination: number | string;
  tokenSymbol: string;
  /** Identifier printed on the note (banknote id or unique identifier). */
  id: number | string;
  privateKey: string;
}

export const buildBanknotePDF = async ({
  denomination,
  tokenSymbol,
  id,
  privateKey,
}: BanknoteDetails): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [NOTE_WIDTH, NOTE_HEIGHT],
  });

  const img = new Image();
  img.src = "/banknote_1.png";
  doc.addImage(img, "PNG", 0, 0, NOTE_WIDTH, NOTE_HEIGHT);

  doc.setFontSize(24);
  doc.setTextColor(44, 62, 80);
  doc.text(`${denomination} ${tokenSymbol}`, NOTE_WIDTH - 42, 8 + 24 / 2, {
    align: "left",
    baseline: "middle",
  });

  const qr = await QRCode.toDataURL(privateKey);
  const qrSize = 36;
  doc.addImage(qr, "PNG", NOTE_WIDTH - 9 - qrSize, 55 / 2, qrSize, qrSize);

  doc.setFontSize(6);
  doc.setTextColor(168, 168, 168);
  doc.text(`PK: ${formatPrivateKey(privateKey)}`, 10, NOTE_HEIGHT - 5, {
    maxWidth: 136,
  });

  doc.setFontSize(8);
  doc.setTextColor(44, 62, 80);
  doc.text(`Unique ID: ${id}`, 10, NOTE_HEIGHT - 10, { maxWidth: 136 });

  return doc;
};

export const generateAndSaveBanknotePDF = async (details: BanknoteDetails) => {
  const doc = await buildBanknotePDF(details);
  doc.save(`banknote_${details.denomination}_${details.tokenSymbol}.pdf`);
};
