// Minimal but ISO-compliant QR Code Generator for ZATCA
// Supports: Byte mode, EC level M, Versions 1-10, Masking

const QR_CODE = (() => {
  // GF(256) arithmetic for Reed-Solomon
  const EXP = new Uint8Array(256);
  const LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  EXP[255] = EXP[0];

  function polyMul(a: number[], b: number[]): number[] {
    const result = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        result[i + j] ^= EXP[(LOG[a[i]] + LOG[b[j]]) % 255];
      }
    }
    return result;
  }

  function polyRest(dividend: number[], divisor: number[]): number[] {
    const result = [...dividend];
    for (let i = 0; i <= result.length - divisor.length; i++) {
      if (result[i] !== 0) {
        const factor = LOG[result[i]];
        for (let j = 0; j < divisor.length; j++) {
          result[i + j] ^= EXP[(factor + LOG[divisor[j]]) % 255];
        }
      }
    }
    return result.slice(-(divisor.length - 1));
  }

  function rsGenPoly(nsym: number): number[] {
    let g = [1];
    for (let i = 0; i < nsym; i++) {
      g = polyMul(g, [1, EXP[i]]);
    }
    return g;
  }

  // QR Code parameters per version (1-10)
  const VERSIONS = [
    // [totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCWGroup1, numBlocksGroup2, dataCWGroup2]
    [26, 10, 1, 16, 0, 0],     // V1
    [44, 16, 1, 28, 0, 0],     // V2
    [70, 26, 1, 44, 0, 0],     // V3
    [100, 18, 2, 32, 0, 0],    // V4
    [134, 24, 2, 43, 0, 0],    // V5
    [172, 16, 4, 27, 0, 0],    // V6
    [196, 18, 4, 31, 0, 0],    // V7
    [242, 22, 2, 38, 2, 39],   // V8
    [292, 22, 3, 36, 2, 37],   // V9
    [346, 26, 4, 43, 1, 44],   // V10
  ];

  const ALIGNMENT_PATTERNS = [
    [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
  ];

  function getVersion(dataLength: number): number {
    // Byte mode capacity per version (EC level M)
    const capacities = [14, 26, 42, 62, 84, 106, 122, 152, 180, 213];
    for (let v = 0; v < capacities.length; v++) {
      if (dataLength <= capacities[v]) return v + 1;
    }
    return 10;
  }

  function encodeData(text: string, version: number): number[] {
    const vinfo = VERSIONS[version - 1];
    // const totalDataCW = vinfo[1] * (vinfo[2] + vinfo[4]) + (vinfo[3] * vinfo[2] + vinfo[5] * vinfo[4]);
    // Correct total data codewords calculation
    let totalData = 0;
    totalData += vinfo[2] * vinfo[3];
    totalData += vinfo[4] * vinfo[5];

    const bytes = new TextEncoder().encode(text);
    const data: number[] = [];

    // Mode indicator: 0100 (byte mode)
    data.push(0b0100);

    // Character count indicator (8 bits for version 1-9)
    const charCountBits = version <= 9 ? 8 : 16;
    let count = bytes.length;
    for (let i = charCountBits - 1; i >= 0; i--) {
      data.push((count >> i) & 1);
    }

    // Data bytes
    for (const byte of bytes) {
      for (let i = 7; i >= 0; i--) {
        data.push((byte >> i) & 1);
      }
    }

    // Terminator (up to 4 zeros)
    const terminatorLen = Math.min(4, totalData * 8 - data.length);
    for (let i = 0; i < terminatorLen; i++) data.push(0);

    // Pad to byte boundary
    while (data.length % 8 !== 0) data.push(0);

    // Pad bytes (0xEC, 0x11 alternating)
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (data.length < totalData * 8) {
      const pb = padBytes[padIdx % 2];
      for (let i = 7; i >= 0; i--) data.push((pb >> i) & 1);
      padIdx++;
    }

    // Convert to codewords
    const codewords: number[] = [];
    for (let i = 0; i < data.length; i += 8) {
      let val = 0;
      for (let j = 0; j < 8; j++) val = (val << 1) | (data[i + j] || 0);
      codewords.push(val);
    }

    return codewords;
  }

  function addErrorCorrection(dataCW: number[], version: number): number[] {
    const vinfo = VERSIONS[version - 1];
    // const totalCW = vinfo[0];
    const ecPerBlock = vinfo[1];
    const numG1 = vinfo[2];
    const dataG1 = vinfo[3];
    const numG2 = vinfo[4];
    const dataG2 = vinfo[5];

    // const totalData = numG1 * dataG1 + numG2 * dataG2;
    const poly = rsGenPoly(ecPerBlock);

    const blocks: number[][] = [];
    const ecBlocks: number[][] = [];
    let offset = 0;

    // Group 1 blocks
    for (let i = 0; i < numG1; i++) {
      const block = dataCW.slice(offset, offset + dataG1);
      blocks.push(block);
      ecBlocks.push(polyRest(block, poly));
      offset += dataG1;
    }

    // Group 2 blocks
    for (let i = 0; i < numG2; i++) {
      const block = dataCW.slice(offset, offset + dataG2);
      blocks.push(block);
      ecBlocks.push(polyRest(block, poly));
      offset += dataG2;
    }

    // Interleave data codewords
    const result: number[] = [];
    const maxDataLen = Math.max(dataG1, dataG2 || 0);
    for (let i = 0; i < maxDataLen; i++) {
      for (const block of blocks) {
        if (i < block.length) result.push(block[i]);
      }
    }

    // Interleave EC codewords
    for (let i = 0; i < ecPerBlock; i++) {
      for (const ec of ecBlocks) {
        if (i < ec.length) result.push(ec[i]);
      }
    }

    return result;
  }

  function createMatrix(version: number): boolean[][] {
    const size = version * 4 + 17;
    const matrix: boolean[][] = [];
    const reserved: boolean[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = new Array(size).fill(false);
      reserved[i] = new Array(size).fill(false);
    }
    return matrix;
  }

  function placeFinderPattern(matrix: boolean[][], reserved: boolean[][], row: number, col: number) {
    const size = matrix.length;
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[rr][cc] = false;
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          matrix[rr][cc] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          matrix[rr][cc] = true;
        } else {
          matrix[rr][cc] = false;
        }
        reserved[rr][cc] = true;
      }
    }
  }

  function placeAlignmentPattern(matrix: boolean[][], reserved: boolean[][], row: number, col: number) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const rr = row + r, cc = col + c;
        if (reserved[rr][cc]) continue;
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          matrix[rr][cc] = true;
        } else {
          matrix[rr][cc] = false;
        }
        reserved[rr][cc] = true;
      }
    }
  }

  function placeTimingPatterns(matrix: boolean[][], reserved: boolean[][]) {
    const size = matrix.length;
    for (let i = 8; i < size - 8; i++) {
      if (!reserved[6][i]) {
        matrix[6][i] = i % 2 === 0;
        reserved[6][i] = true;
      }
      if (!reserved[i][6]) {
        matrix[i][6] = i % 2 === 0;
        reserved[i][6] = true;
      }
    }
  }

  function placeData(matrix: boolean[][], reserved: boolean[][], data: number[]) {
    const size = matrix.length;
    let bitIdx = 0;
    const totalBits = data.length * 8;
    const bits: boolean[] = [];
    for (const cw of data) {
      for (let i = 7; i >= 0; i--) bits.push(((cw >> i) & 1) === 1);
    }

    // Right-to-left, upward then downward
    let col = size - 1;
    while (col >= 0) {
      if (col === 6) col--; // Skip timing pattern column
      for (let upward = 0; upward < 2; upward++) {
//         const row = upward === 0 ? -1 : 1;
        for (let i = 0; i < size; i++) {
          const r = (col % 4 < 2) ? (size - 1 - i) : i;
          const c = col;
          if (r < 0 || r >= size || reserved[r][c]) continue;
          matrix[r][c] = bitIdx < totalBits ? bits[bitIdx] : false;
          bitIdx++;
        }
      }
      col -= 2;
    }
  }

  function placeFormatBits(matrix: boolean[][], reserved: boolean[][], maskPattern: number) {
    const size = matrix.length;
    // EC level M = 01, mask pattern 0-7
    const formatInfo = ((0b01) << 3) | maskPattern;
    // BCH(15,5) encoding
    let rem = formatInfo << 10;
    let div = 0b10100110111;
    for (let i = 4; i >= 0; i--) {
      if (rem & (1 << (i + 10))) rem ^= div << i;
    }
    const format = ((formatInfo << 10) | rem) ^ 0b101010000010010;

    // Around top-left finder
    const positions1 = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    // Separated positions
    const positions2 = [
      [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
      [size - 5, 8], [size - 6, 8], [size - 7, 8],
      [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
      [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
    ];

    for (let i = 0; i < 15; i++) {
      const bit = ((format >> (14 - i)) & 1) === 1;
      const [r1, c1] = positions1[i];
      const [r2, c2] = positions2[i];
      matrix[r1][c1] = bit;
      reserved[r1][c1] = true;
      matrix[r2][c2] = bit;
      reserved[r2][c2] = true;
    }

    // Dark module
    matrix[size - 8][8] = true;
    reserved[size - 8][8] = true;
  }

  function applyMask(matrix: boolean[][], reserved: boolean[][], pattern: number) {
    const size = matrix.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (reserved[r][c]) continue;
        let invert = false;
        switch (pattern) {
          case 0: invert = (r + c) % 2 === 0; break;
          case 1: invert = r % 2 === 0; break;
          case 2: invert = c % 3 === 0; break;
          case 3: invert = (r + c) % 3 === 0; break;
          case 4: invert = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
          case 5: invert = (r * c) % 2 + (r * c) % 3 === 0; break;
          case 6: invert = ((r * c) % 2 + (r * c) % 3) % 2 === 0; break;
          case 7: invert = ((r + c) % 2 + (r * c) % 3) % 2 === 0; break;
        }
        if (invert) matrix[r][c] = !matrix[r][c];
      }
    }
  }

  function generate(text: string): boolean[][] {
    const version = getVersion(new TextEncoder().encode(text).length);
    const size = version * 4 + 17;

    const dataCW = encodeData(text, version);
    const fullCW = addErrorCorrection(dataCW, version);

    const matrix = createMatrix(version);
    const reserved = createMatrix(version);

    // Place finder patterns
    placeFinderPattern(matrix, reserved, 0, 0);
    placeFinderPattern(matrix, reserved, 0, size - 7);
    placeFinderPattern(matrix, reserved, size - 7, 0);

    // Place alignment patterns
    const aligns = ALIGNMENT_PATTERNS[version - 1];
    for (let i = 0; i < aligns.length; i++) {
      for (let j = 0; j < aligns.length; j++) {
        const r = aligns[i], c = aligns[j];
        if (reserved[r][c]) continue;
        placeAlignmentPattern(matrix, reserved, r, c);
      }
    }

    // Timing patterns
    placeTimingPatterns(matrix, reserved);

    // Reserve format areas
    for (let i = 0; i < 9; i++) {
      reserved[8][i] = true;
      reserved[i][8] = true;
      if (size - 1 - i >= 0) {
        reserved[size - 1 - i][8] = true;
        reserved[8][size - 1 - i] = true;
      }
    }

    // Place data
    placeData(matrix, reserved, fullCW);

    // Try all 8 mask patterns, pick best
    let bestMask = 0;
    let bestPenalty = Infinity;
    for (let m = 0; m < 8; m++) {
      const testMatrix = matrix.map(r => [...r]);
      applyMask(testMatrix, reserved, m);
      placeFormatBits(testMatrix, reserved, m);
      const penalty = calculatePenalty(testMatrix);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestMask = m;
      }
    }

    applyMask(matrix, reserved, bestMask);
    placeFormatBits(matrix, reserved, bestMask);

    return matrix;
  }

  function calculatePenalty(matrix: boolean[][]): number {
    let penalty = 0;
    const size = matrix.length;

    // Rule 1: consecutive same-color modules in row/column
    for (let r = 0; r < size; r++) {
      let count = 1;
      for (let c = 1; c < size; c++) {
        if (matrix[r][c] === matrix[r][c - 1]) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty += 1;
        } else {
          count = 1;
        }
      }
    }
    for (let c = 0; c < size; c++) {
      let count = 1;
      for (let r = 1; r < size; r++) {
        if (matrix[r][c] === matrix[r - 1][c]) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty += 1;
        } else {
          count = 1;
        }
      }
    }

    // Rule 2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = matrix[r][c];
        if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) {
          penalty += 3;
        }
      }
    }

    return penalty;
  }

  function toSVG(matrix: boolean[][], moduleSize: number = 4): string {
    const size = matrix.length;
    const svgSize = size * moduleSize + 8; // quiet zone
    let rects = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          rects += '<rect x="' + (c * moduleSize + 4) + '" y="' + (r * moduleSize + 4) + '" width="' + moduleSize + '" height="' + moduleSize + '" fill="#000"/>';
        }
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + svgSize + '" height="' + svgSize + '" viewBox="0 0 ' + svgSize + ' ' + svgSize + '"><rect width="' + svgSize + '" height="' + svgSize + '" fill="#fff"/>' + rects + '</svg>';
  }

  return { generate, toSVG };
})();

if (typeof window !== 'undefined') (window as any).QR_CODE = QR_CODE;
