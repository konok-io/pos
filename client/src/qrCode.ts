/**
 * ZATCA Compliant QR Code
 * 
 * TLV encoder (custom) + QR renderer (qrcode library - proven, battle-tested)
 * Phase 1: 5 tags (name, VAT, timestamp, total, VAT amount)
 * Phase 2: 8 tags (+XML hash, ECDSA signature, ECDSA public key)
 */
import QRCode from 'qrcode';

// === TLV Encoder (matches PHP chr($tag).chr($length).$value pattern) ===

function tlvEncode(tag: number, value: string): string {
  const bytes = new TextEncoder().encode(value);
  const len = bytes.length;
  // Single byte length (ZATCA fields are always < 256 bytes)
  return String.fromCharCode(tag) + String.fromCharCode(len) + String.fromCharCode(...bytes);
}

function tlvEncodeBinary(tag: number, value: Uint8Array): string {
  const len = value.length;
  return String.fromCharCode(tag) + String.fromCharCode(len) + String.fromCharCode(...value);
}

export function generatePhase1QR(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: string,
  vatAmount: string
): string {
  const binary =
    tlvEncode(1, sellerName) +
    tlvEncode(2, vatNumber) +
    tlvEncode(3, timestamp) +
    tlvEncode(4, totalWithVat) +
    tlvEncode(5, vatAmount);
  return btoa(binary);
}

export function generatePhase2QR(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: string,
  vatAmount: string,
  xmlHashBase64: string,
  signatureBase64: string,
  publicKeyDerBase64: string
): string {
  const binary =
    tlvEncode(1, sellerName) +
    tlvEncode(2, vatNumber) +
    tlvEncode(3, timestamp) +
    tlvEncode(4, totalWithVat) +
    tlvEncode(5, vatAmount) +
    tlvEncodeBinary(6, base64ToUint8(xmlHashBase64)) +
    tlvEncodeBinary(7, base64ToUint8(signatureBase64)) +
    tlvEncodeBinary(8, base64ToUint8(publicKeyDerBase64));
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// === QR Rendering using qrcode library ===

export async function renderQRToSVG(base64Data: string, cellSize: number = 4): Promise<string> {
  // Generate QR matrix using proven qrcode library
  const matrix = QRCode.create(base64Data, {
    errorCorrectionLevel: 'M',
  });

  const size = matrix.modules.size;
  const quiet = 4; // 4-module quiet zone per ISO spec
  const totalSize = (size + quiet * 2) * cellSize;

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix.modules.get(r, c)) {
        rects += '<rect x="' + (c * cellSize + quiet * cellSize) +
          '" y="' + (r * cellSize + quiet * cellSize) +
          '" width="' + cellSize +
          '" height="' + cellSize +
          '" fill="#000"/>';
      }
    }
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" ' +
    'width="' + totalSize + '" height="' + totalSize + '" ' +
    'viewBox="0 0 ' + totalSize + ' ' + totalSize + '">' +
    '<rect width="' + totalSize + '" height="' + totalSize + '" fill="#fff"/>' +
    rects + '</svg>';
}

export async function renderQRToDataURL(base64Data: string, size: number = 200): Promise<string> {
  return QRCode.toDataURL(base64Data, {
    errorCorrectionLevel: 'M',
    width: size,
    margin: 1,
  });
}

export const QR = {
  generatePhase1QR,
  generatePhase2QR,
  renderQRToSVG,
  renderQRToDataURL,
};

export default QR;
