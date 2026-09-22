/**
 * ZATCA Compliant QR Code Generator
 * 
 * Phase 1 (5 fields): seller name, VAT number, timestamp, total with VAT, VAT amount
 * Phase 2 (8 fields): + XML hash (SHA-256), ECDSA signature, ECDSA public key
 * 
 * Uses TLV (Tag-Length-Value) encoding → Base64 → QR matrix
 */

// === TLV Encoder ===

export interface ZatcaTLV {
  tag: number;
  value: string | Uint8Array;
}

export function tlvEncode(tag: number, value: string | Uint8Array): Uint8Array {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const len = bytes.length;

  let lengthBytes: Uint8Array;
  if (len < 128) {
    lengthBytes = new Uint8Array([len]);
  } else if (len < 256) {
    lengthBytes = new Uint8Array([0x81, len]);
  } else if (len < 65536) {
    lengthBytes = new Uint8Array([0x82, (len >> 8) & 0xff, len & 0xff]);
  } else {
    lengthBytes = new Uint8Array([0x83, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]);
  }

  const result = new Uint8Array(1 + lengthBytes.length + bytes.length);
  result[0] = tag;
  result.set(lengthBytes, 1);
  result.set(bytes, 1 + lengthBytes.length);
  return result;
}

export function tlvEncodePhase1(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: string,
  vatAmount: string
): string {
  const parts: Uint8Array[] = [];
  parts.push(tlvEncode(1, sellerName));
  parts.push(tlvEncode(2, vatNumber));
  parts.push(tlvEncode(3, timestamp));
  parts.push(tlvEncode(4, totalWithVat));
  parts.push(tlvEncode(5, vatAmount));

  let totalLen = 0;
  for (const p of parts) totalLen += p.length;
  const tlvBytes = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    tlvBytes.set(p, offset);
    offset += p.length;
  }

  let binary = '';
  for (let i = 0; i < tlvBytes.length; i++) {
    binary += String.fromCharCode(tlvBytes[i]);
  }
  return btoa(binary);
}

export function tlvEncodePhase2(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: string,
  vatAmount: string,
  xmlHashHex: string,
  ecdsaSignatureHex: string,
  ecdsaPublicKeyHex: string
): string {
  const parts: Uint8Array[] = [];
  parts.push(tlvEncode(1, sellerName));
  parts.push(tlvEncode(2, vatNumber));
  parts.push(tlvEncode(3, timestamp));
  parts.push(tlvEncode(4, totalWithVat));
  parts.push(tlvEncode(5, vatAmount));
  parts.push(tlvEncode(6, hexToBytes(xmlHashHex)));
  parts.push(tlvEncode(7, hexToBytes(ecdsaSignatureHex)));
  parts.push(tlvEncode(8, hexToBytes(ecdsaPublicKeyHex)));

  let totalLen = 0;
  for (const p of parts) totalLen += p.length;
  const tlvBytes = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    tlvBytes.set(p, offset);
    offset += p.length;
  }

  let binary = '';
  for (let i = 0; i < tlvBytes.length; i++) {
    binary += String.fromCharCode(tlvBytes[i]);
  }
  return btoa(binary);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

// === QR Code Matrix Generator (ISO 18004) ===

const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
let _gfInit = false;
function initGF() {
  if (_gfInit) return;
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP_TABLE[i] = EXP_TABLE[i - 255];
  _gfInit = true;
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function rsGeneratorPoly(nsym: number): number[] {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], EXP_TABLE[i]);
    }
    g = ng;
  }
  return g;
}

function rsEncode(data: number[], nsym: number): number[] {
  const gen = rsGeneratorPoly(nsym);
  const res = new Array(data.length + nsym).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

// Version capacities (byte mode, EC level M)
const CAPACITIES: Record<number, number> = {
  1: 14, 2: 26, 3: 42, 4: 62, 5: 84, 6: 106,
  7: 122, 8: 152, 9: 180, 10: 213, 11: 251,
  12: 287, 13: 331, 14: 362, 15: 412, 16: 450,
  17: 504, 18: 560, 19: 624, 20: 666, 21: 711,
  22: 779, 23: 857, 24: 911, 25: 997, 26: 1059,
  27: 1125, 28: 1190, 29: 1264, 30: 1370
};

// Total codewords per block for EC level M (format: [dataPerGroup1, numGroup1, dataPerGroup2, numGroup2])
const BLOCK_INFO: Record<number, [number, number, number, number]> = {
  1: [16, 1, 0, 0], 2: [28, 1, 0, 0], 3: [44, 1, 0, 0],
  4: [32, 2, 0, 0], 5: [43, 2, 0, 0], 6: [27, 4, 0, 0],
  7: [31, 4, 0, 0], 8: [38, 2, 39, 2], 9: [36, 3, 37, 2],
  10: [43, 4, 44, 1], 11: [50, 1, 51, 4], 12: [36, 6, 37, 2],
  13: [37, 8, 38, 1], 14: [40, 4, 41, 5], 15: [36, 5, 37, 5],
  16: [38, 7, 39, 3], 17: [36, 10, 37, 1], 18: [43, 9, 44, 4],
  19: [44, 3, 45, 11], 20: [41, 3, 42, 13], 21: [42, 17, 0, 0],
  22: [46, 17, 0, 0], 23: [45, 13, 46, 6], 24: [42, 12, 43, 7],
  25: [43, 6, 44, 14], 26: [45, 17, 46, 4], 27: [45, 4, 46, 18],
  28: [45, 20, 46, 4], 29: [45, 19, 46, 6], 30: [43, 9, 44, 16]
};

// EC codewords per block for EC level M
const EC_PER_BLOCK: Record<number, number> = {
  1: 10, 2: 16, 3: 26, 4: 18, 5: 24, 6: 16,
  7: 18, 8: 22, 9: 22, 10: 26, 11: 30, 12: 22,
  13: 22, 14: 24, 15: 24, 16: 28, 17: 28, 18: 26,
  19: 26, 20: 26, 21: 26, 22: 28, 23: 28, 24: 28,
  25: 28, 26: 28, 27: 28, 28: 28, 29: 28, 30: 28
};

// Alignment pattern center positions
const ALIGN_POS: number[][] = [
  [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38],
  [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58],
  [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74],
  [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90]
];

function getVersion(dataLen: number): number {
  for (let v = 1; v <= 30; v++) {
    if (dataLen <= (CAPACITIES[v] || 9999)) return v;
  }
  return 30;
}

function getSize(version: number): number {
  return version * 4 + 17;
}

function encodeData(text: string, version: number): number[] {
  const bytes = new TextEncoder().encode(text);
  const blockInfo = BLOCK_INFO[version] || [16, 1, 0, 0];
  const g1cw = blockInfo[0], g1n = blockInfo[1], g2cw = blockInfo[2], g2n = blockInfo[3];
  const totalData = g1n * g1cw + g2n * g2cw;

  const bits: number[] = [];
  // Mode: byte (0100)
  bits.push(0, 1, 0, 0);
  // Character count indicator
  const ccBits = version <= 9 ? 8 : 16;
  for (let i = ccBits - 1; i >= 0; i--) bits.push((bytes.length >> i) & 1);
  // Data bytes
  for (const b of bytes) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  // Terminator
  for (let i = 0; i < 4 && bits.length < totalData * 8; i++) bits.push(0);
  // Byte align
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad bytes
  const pads = [0xEC, 0x11];
  let pi = 0;
  while (bits.length < totalData * 8) {
    const pb = pads[pi % 2];
    for (let i = 7; i >= 0; i--) bits.push((pb >> i) & 1);
    pi++;
  }

  const cw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | (bits[i + j] || 0);
    cw.push(v);
  }
  return cw;
}

function addEC(data: number[], version: number): number[] {
  const blockInfo = BLOCK_INFO[version] || [16, 1, 0, 0];
  const g1cw = blockInfo[0], g1n = blockInfo[1], g2cw = blockInfo[2], g2n = blockInfo[3];
  const ecPerBlock = EC_PER_BLOCK[version] || 10;
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let off = 0;

  for (let i = 0; i < g1n; i++) {
    const b = data.slice(off, off + g1cw);
    blocks.push(b);
    ecBlocks.push(rsEncode(b, ecPerBlock));
    off += g1cw;
  }
  for (let i = 0; i < g2n; i++) {
    const b = data.slice(off, off + g2cw);
    blocks.push(b);
    ecBlocks.push(rsEncode(b, ecPerBlock));
    off += g2cw;
  }

  const result: number[] = [];
  const maxD = Math.max(g1cw, g2cw || 0);
  for (let i = 0; i < maxD; i++) {
    for (const b of blocks) if (i < b.length) result.push(b[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const e of ecBlocks) if (i < e.length) result.push(e[i]);
  }
  return result;
}

function createGrid(size: number) {
  const matrix: number[][] = [];
  const reserved: boolean[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = new Array(size).fill(0);
    reserved[i] = new Array(size).fill(false);
  }
  return { matrix, reserved };
}

function placeFinder(m: number[][], r: boolean[][], row: number, col: number) {
  const sz = m.length;
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const rr = row + dr, cc = col + dc;
      if (rr < 0 || rr >= sz || cc < 0 || cc >= sz) continue;
      const edge = dr === -1 || dr === 7 || dc === -1 || dc === 7;
      const border = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const inner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      m[rr][cc] = (edge ? 0 : (border || inner) ? 1 : 0);
      r[rr][cc] = true;
    }
  }
}

function placeAlignment(m: number[][], r: boolean[][], cr: number, cc: number) {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const rr = cr + dr, c = cc + dc;
      if (rr >= 0 && rr < m.length && c >= 0 && c < m.length && !r[rr][c]) {
        const edge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
        const center = dr === 0 && dc === 0;
        m[rr][c] = (edge || center) ? 1 : 0;
        r[rr][c] = true;
      }
    }
  }
}

function placeTiming(m: number[][], r: boolean[][]) {
  const sz = m.length;
  for (let i = 8; i < sz - 8; i++) {
    if (!r[6][i]) { m[6][i] = i % 2 === 0 ? 1 : 0; r[6][i] = true; }
    if (!r[i][6]) { m[i][6] = i % 2 === 0 ? 1 : 0; r[i][6] = true; }
  }
}

function placeData(m: number[][], r: boolean[][], cw: number[]) {
  const sz = m.length;
  const bits: number[] = [];
  for (const c of cw) for (let i = 7; i >= 0; i--) bits.push((c >> i) & 1);
  let bi = 0;
  let col = sz - 1;
  while (col >= 0) {
    if (col === 6) col--;
    for (let upward = 0; upward < 2; upward++) {
      for (let i = 0; i < sz; i++) {
        const row = upward === 0 ? sz - 1 - i : i;
        if (!r[row][col]) {
          m[row][col] = bi < bits.length ? bits[bi] : 0;
          bi++;
        }
      }
    }
    col -= 2;
  }
}

function placeFormat(m: number[][], r: boolean[][], mask: number) {
  const sz = m.length;
  let data = (0b01 << 3) | mask; // EC level M = 01
  let rem = data << 10;
  for (let i = 4; i >= 0; i--) {
    if (rem & (1 << (i + 10))) rem ^= 0x537 << i;
  }
  const fmt = ((data << 10) | rem) ^ 0x5412;

  const pos1: [number, number][] = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  const pos2: [number, number][] = [];
  for (let i = 0; i < 7; i++) pos2.push([sz - 1 - i, 8]);
  for (let i = 0; i < 8; i++) pos2.push([8, sz - 8 + i]);

  for (let i = 0; i < 15; i++) {
    const bit = ((fmt >> (14 - i)) & 1) === 1;
    if (i < pos1.length) { m[pos1[i][0]][pos1[i][1]] = bit ? 1 : 0; r[pos1[i][0]][pos1[i][1]] = true; }
    if (i < pos2.length) { m[pos2[i][0]][pos2[i][1]] = bit ? 1 : 0; r[pos2[i][0]][pos2[i][1]] = true; }
  }
  m[sz - 8][8] = 1;
  r[sz - 8][8] = true;
}

function applyMask(m: number[][], r: boolean[][], pattern: number) {
  const sz = m.length;
  for (let row = 0; row < sz; row++) {
    for (let col = 0; col < sz; col++) {
      if (r[row][col]) continue;
      let inv = false;
      switch (pattern) {
        case 0: inv = (row + col) % 2 === 0; break;
        case 1: inv = row % 2 === 0; break;
        case 2: inv = col % 3 === 0; break;
        case 3: inv = (row + col) % 3 === 0; break;
        case 4: inv = (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0; break;
        case 5: inv = (row * col) % 2 + (row * col) % 3 === 0; break;
        case 6: inv = ((row * col) % 2 + (row * col) % 3) % 2 === 0; break;
        case 7: inv = ((row + col) % 2 + (row * col) % 3) % 2 === 0; break;
      }
      if (inv) m[row][col] = m[row][col] === 0 ? 1 : 0;
    }
  }
}

function generate(text: string): number[][] {
  initGF();

  const version = getVersion(text.length);
  const size = getSize(version);

  const dataCW = encodeData(text, version);
  const fullCW = addEC(dataCW, version);

  const { matrix, reserved } = createGrid(size);

  placeFinder(matrix, reserved, 0, 0);
  placeFinder(matrix, reserved, 0, size - 7);
  placeFinder(matrix, reserved, size - 7, 0);

  const aligns = ALIGN_POS[version - 1] || [];
  for (let i = 0; i < aligns.length; i++) {
    for (let j = 0; j < aligns.length; j++) {
      if (!reserved[aligns[i]][aligns[j]]) {
        placeAlignment(matrix, reserved, aligns[i], aligns[j]);
      }
    }
  }

  placeTiming(matrix, reserved);

  for (let i = 0; i <= 8; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
    reserved[size - 1 - i][8] = true;
    reserved[8][size - 1 - i] = true;
  }

  placeData(matrix, reserved, fullCW);

  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const test = matrix.map(r => [...r]);
    const testR = reserved.map(r => [...r]);
    applyMask(test, testR, mask);
    placeFormat(test, testR, mask);
    let penalty = 0;
    for (let row = 0; row < size; row++) {
      let run = 1;
      for (let col = 1; col < size; col++) {
        if (test[row][col] === test[row][col - 1]) { run++; if (run === 5) penalty += 3; else if (run > 5) penalty++; }
        else run = 1;
      }
    }
    for (let col = 0; col < size; col++) {
      let run = 1;
      for (let row = 1; row < size; row++) {
        if (test[row][col] === test[row - 1][col]) { run++; if (run === 5) penalty += 3; else if (run > 5) penalty++; }
        else run = 1;
      }
    }
    if (penalty < bestPenalty) { bestPenalty = penalty; bestMask = mask; }
  }

  applyMask(matrix, reserved, bestMask);
  placeFormat(matrix, reserved, bestMask);

  return matrix;
}

function toSVG(matrix: number[][], moduleSize: number = 5): string {
  const size = matrix.length;
  const quiet = 20;
  const total = size * moduleSize + quiet * 2;
  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        rects += '<rect x="' + (c * moduleSize + quiet) + '" y="' + (r * moduleSize + quiet) + '" width="' + moduleSize + '" height="' + moduleSize + '" fill="#000"/>';
      }
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + total + '" height="' + total + '" viewBox="0 0 ' + total + ' ' + total + '"><rect width="' + total + '" height="' + total + '" fill="#fff"/>' + rects + '</svg>';
}

export const QR_CODE = { generate, toSVG, tlvEncodePhase1, tlvEncodePhase2 };
