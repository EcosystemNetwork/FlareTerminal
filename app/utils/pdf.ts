import { jsPDF } from "jspdf";

export const BANK_NAME = "Skeuomorphica Bank";

/** Horizontal centre of a portrait A4 page in mm. */
export const A4_CENTER_X = 105;

export const addCenteredText = (
  doc: jsPDF,
  text: string,
  y: number,
  fontSize: number
) => {
  doc.setFontSize(fontSize);
  doc.text(text, A4_CENTER_X, y, { align: "center" });
};

/**
 * Draws a placeholder box where a QR code will eventually be rendered.
 */
export const addQRCodePlaceholder = (
  doc: jsPDF,
  { x, y, size, label }: { x: number; y: number; size: number; label: string }
) => {
  doc.rect(x, y, size, size);
  doc.text(label, x + size / 2, y + size + 5, { align: "center" });
};

export const openPDFInNewTab = (doc: jsPDF) => {
  window.open(doc.output("bloburl") as unknown as string, "_blank");
};
