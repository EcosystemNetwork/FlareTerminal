import { jsPDF } from 'jspdf';
import {
  BANK_NAME,
  addCenteredText,
  addQRCodePlaceholder,
  openPDFInNewTab,
} from './pdf';

export const printBanknote = async (amount: number, currency: string) => {
  const doc = new jsPDF();

  addCenteredText(doc, BANK_NAME, 20, 22);
  addCenteredText(doc, `${amount} ${currency}`, 40, 18);
  addCenteredText(doc, 'This note is backed by crypto assets', 60, 12);
  addQRCodePlaceholder(doc, { x: 80, y: 70, size: 50, label: 'QR Code' });

  openPDFInNewTab(doc);
};
