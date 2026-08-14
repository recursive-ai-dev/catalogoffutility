/**
 * Isolated Mathematical and Physics Logic
 * Extracted for rigorous testing and modularity.
 */

// ==========================================
// General Relativity: Spacetime Curvature
// ==========================================

export function calculateSchwarzschildPotential(x, y, sources) {
  let I = 0;
  for (const source of sources) {
    const dx = x - source.x;
    const dy = y - source.y;
    const d2 = dx * dx + dy * dy;
    const rs = source.s * source.r;
    I += rs / (4 * Math.max(1.0, Math.sqrt(d2)));
  }
  return Math.min(I, 0.999);
}

export function calculatePotentialGradient(x, y, sources) {
  let gx = 0;
  let gy = 0;
  for (const source of sources) {
    const dx = x - source.x;
    const dy = y - source.y;
    const d = Math.max(1.0, Math.hypot(dx, dy));
    const rs = source.s * source.r;
    const f = -rs / (4 * d * d * d);
    gx += f * dx;
    gy += f * dy;
  }
  return { gx, gy };
}

export function calculateSpatialCurvature(vx, vy, I, gx, gy) {
  const n_grad_factor = (4 - 2 * I) / (1 - I * I);
  return vx * (n_grad_factor * gy) - vy * (n_grad_factor * gx);
}

export function calculateShapiroDelay(I) {
  return (1 - I) / Math.pow(1 + I, 3);
}

// ==========================================
// Entropy Budget
// ==========================================

export function calculateWordCost(word, wordFrequency, baseMultiplier = 1.5, escalation = 0.5) {
  const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.length === 0) return 0;

  let cost = 1.0 + (normalized.length * 0.5);

  const freq = wordFrequency[normalized] || 0;
  if (freq > 0) {
    const repMultiplier = baseMultiplier + (freq * escalation);
    cost *= repMultiplier;
  }

  return Math.ceil(cost);
}

export function calculateInputCost(text, wordFrequency, baseMultiplier, escalation) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  let totalCost = 0;
  const currentFrequencies = { ...wordFrequency };
  for (const word of words) {
    totalCost += calculateWordCost(word, currentFrequencies, baseMultiplier, escalation);
    const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length > 0) {
      currentFrequencies[normalized] = (currentFrequencies[normalized] || 0) + 1;
    }
  }
  return { totalCost, words };
}
