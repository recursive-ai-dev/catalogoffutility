/** Shared, bounded math for the curvature and entropy simulations. */
const MAX_POTENTIAL = 0.999;
const MAX_COST = Number.MAX_SAFE_INTEGER;

function finiteNonnegative(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function boundedPotential(value) {
  return typeof value === 'number' && !Number.isNaN(value)
    ? Math.max(0, Math.min(MAX_POTENTIAL, value)) : 0;
}

function validSources(sources) {
  return Array.isArray(sources) ? sources : [];
}

function validSource(source) {
  return source !== null && typeof source === 'object' &&
    Number.isFinite(source.x) && Number.isFinite(source.y) &&
    Number.isFinite(source.s) && source.s >= 0 &&
    Number.isFinite(source.r) && source.r >= 0;
}

export function calculateSchwarzschildPotential(x, y, sources) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
  let potential = 0;
  for (const source of validSources(sources)) {
    if (!validSource(source)) continue;
    const distance = Math.max(1, Math.hypot(x - source.x, y - source.y));
    // Divide before multiplying so large finite source strengths do not overflow.
    const contribution = (source.s / distance) * (source.r / 4);
    if (Number.isNaN(contribution)) continue;
    potential += contribution;
    if (potential >= MAX_POTENTIAL) return MAX_POTENTIAL;
  }
  return potential;
}

export function calculatePotentialGradient(x, y, sources) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { gx: 0, gy: 0 };
  let gx = 0;
  let gy = 0;
  for (const source of validSources(sources)) {
    if (!validSource(source)) continue;
    const dx = x - source.x;
    const dy = y - source.y;
    const distance = Math.hypot(dx, dy);
    // The softened potential is constant inside its unit-radius core.
    if (distance <= 1 || !Number.isFinite(distance)) continue;
    const magnitude = (source.s / distance) * (source.r / distance) / 4;
    const nextX = gx - (dx === 0 ? 0 : magnitude * (dx / distance));
    const nextY = gy - (dy === 0 ? 0 : magnitude * (dy / distance));
    // Saturate extreme fields without allowing Infinity or NaN into ray tracing.
    gx = Number.isFinite(nextX) ? nextX : Math.sign(nextX || -dx) * Number.MAX_VALUE;
    gy = Number.isFinite(nextY) ? nextY : Math.sign(nextY || -dy) * Number.MAX_VALUE;
  }
  return { gx, gy };
}

export function calculateSpatialCurvature(vx, vy, potential, gx, gy) {
  if (![vx, vy, gx, gy].every(Number.isFinite)) return 0;
  const I = boundedPotential(potential);
  const factor = (4 - 2 * I) / (1 - I * I);
  const velocityScale = Math.max(Math.abs(vx), Math.abs(vy));
  const gradientScale = Math.max(Math.abs(gx), Math.abs(gy));
  if (velocityScale === 0 || gradientScale === 0) return 0;
  const determinant = (vx / velocityScale) * (gy / gradientScale) -
    (vy / velocityScale) * (gx / gradientScale);
  const curvature = factor * determinant * velocityScale * gradientScale;
  return Number.isFinite(curvature) ? curvature : Math.sign(curvature || 1) * Number.MAX_VALUE;
}

export function calculateShapiroDelay(potential) {
  const I = boundedPotential(potential);
  return (1 - I) / Math.pow(1 + I, 3);
}

function normalizeWord(word) {
  return typeof word === 'string' ? word.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

function frequencyOf(wordFrequency, word) {
  if (wordFrequency === null || typeof wordFrequency !== 'object' ||
    !Object.hasOwn(wordFrequency, word)) return 0;
  return Math.min(MAX_COST, Math.floor(finiteNonnegative(wordFrequency[word])));
}

export function calculateWordCost(word, wordFrequency, baseMultiplier = 1.5, escalation = 0.5) {
  const normalized = normalizeWord(word);
  if (!normalized) return 0;
  const frequency = frequencyOf(wordFrequency, normalized);
  const cost = 1 + normalized.length * 0.5;
  const multiplier = frequency > 0
    ? finiteNonnegative(baseMultiplier, 1.5) + frequency * finiteNonnegative(escalation, 0.5)
    : 1;
  return Math.min(MAX_COST, Math.ceil(cost * multiplier));
}

export function calculateInputCost(text, wordFrequency, baseMultiplier, escalation) {
  const words = typeof text === 'string' ? text.trim().split(/\s+/).filter(Boolean) : [];
  const currentFrequencies = Object.create(null);
  let totalCost = 0;
  for (const word of words) {
    const normalized = normalizeWord(word);
    if (!normalized) continue;
    if (!Object.hasOwn(currentFrequencies, normalized)) {
      currentFrequencies[normalized] = frequencyOf(wordFrequency, normalized);
    }
    totalCost = Math.min(MAX_COST,
      totalCost + calculateWordCost(word, currentFrequencies, baseMultiplier, escalation));
    currentFrequencies[normalized] = Math.min(MAX_COST, currentFrequencies[normalized] + 1);
  }
  return { totalCost, words };
}
