import patterns from './imagePatterns.json' with { type: 'json' };

const GRID = 12;
const MIN_SCORE = 0.88;

type Pixels = { data: Uint8ClampedArray | Uint8Array; width: number; height: number };

// Compare small image patches with locally bundled visual signatures. This is
// deliberately conservative: a missed match is preferable to hiding unrelated art.
export function matchesSpoilerPattern(image: Pixels): boolean {
  return bestSpoilerPatternScore(image, MIN_SCORE) >= MIN_SCORE;
}

export function bestSpoilerPatternScore(image: Pixels, stopAt = 1): number {
  const { width, height, data } = image;
  if (width < 40 || height < 40 || data.length < width * height * 4) return 0;

  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    gray[i] = data[p]! * 0.299 + data[p + 1]! * 0.587 + data[p + 2]! * 0.114;
  }
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += gray[y * width + x]!;
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1]! + row;
    }
  }

  let best = 0;
  for (const pattern of patterns) {
    const template = pattern.gray;
    const mean = template.reduce((sum, value) => sum + value, 0) / template.length;
    const centered = template.map(value => value - mean);
    const templateEnergy = centered.reduce((sum, value) => sum + value * value, 0);
    if (templateEnergy < 1) continue;

    for (let patchWidth = 28; patchWidth <= Math.min(width, 190); patchWidth = Math.ceil(patchWidth * 1.16)) {
      const patchHeight = Math.round(patchWidth / pattern.aspect);
      if (patchHeight > height || patchHeight < 22) continue;
      const step = Math.max(2, Math.floor(patchWidth / 20));

      for (let y = 0; y <= height - patchHeight; y += step) {
        for (let x = 0; x <= width - patchWidth; x += step) {
          let sum = 0;
          let sumSquares = 0;
          let dot = 0;
          for (let row = 0; row < GRID; row++) {
            const y0 = y + Math.floor(row * patchHeight / GRID);
            const y1 = y + Math.max(1, Math.floor((row + 1) * patchHeight / GRID));
            for (let col = 0; col < GRID; col++) {
              const x0 = x + Math.floor(col * patchWidth / GRID);
              const x1 = x + Math.max(1, Math.floor((col + 1) * patchWidth / GRID));
              const area = (x1 - x0) * (y1 - y0);
              const value = (integral[y1 * stride + x1]! - integral[y0 * stride + x1]! -
                integral[y1 * stride + x0]! + integral[y0 * stride + x0]!) / area;
              const index = row * GRID + col;
              sum += value;
              sumSquares += value * value;
              dot += value * centered[index]!;
            }
          }
          const energy = sumSquares - sum * sum / template.length;
          if (energy < 1000) continue;
          const score = dot / Math.sqrt(energy * templateEnergy);
          if (score > best) best = score;
          if (best >= stopAt) return best;
        }
      }
    }
  }
  return best;
}
