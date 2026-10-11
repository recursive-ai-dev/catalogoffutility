import { describe, expect, it } from "vitest";
import {
  calculateSchwarzschildPotential, calculatePotentialGradient, calculateSpatialCurvature,
  calculateShapiroDelay, calculateWordCost, calculateInputCost,
} from "../../public/math-physics.js";

const source = { x: 0, y: 0, s: 1, r: 1 };

describe("Curvature math remains finite at boundaries", () => {
  it("ignores malformed, negative and nonfinite source entries", () => {
    const sources = [null, {}, { ...source, s: -1 }, { ...source, r: Infinity }, source];
    expect(calculateSchwarzschildPotential(5, 0, sources)).toBeCloseTo(0.05);
    expect(calculatePotentialGradient(5, 0, sources).gx).toBeCloseTo(-0.01);
    expect(calculatePotentialGradient(5, 0, sources).gy).toBe(0);
  });
  it("treats missing sources and invalid coordinates as empty fields", () => {
    expect(calculateSchwarzschildPotential(0, 0, undefined)).toBe(0);
    expect(calculateSchwarzschildPotential(NaN, 0, [source])).toBe(0);
    expect(calculatePotentialGradient(Infinity, 0, [source])).toEqual({ gx: 0, gy: 0 });
    expect(calculatePotentialGradient(0, 0, null)).toEqual({ gx: 0, gy: 0 });
  });
  it("avoids squared-distance overflow for faraway finite coordinates", () => {
    expect(calculateSchwarzschildPotential(1e200, 0, [{ ...source, r: 1e200 }])).toBeCloseTo(0.25);
  });
  it("avoids overflowing source-strength products before division", () => {
    expect(calculateSchwarzschildPotential(1e200, 0, [{ ...source, s: 1e200, r: 1e100 }])).toBe(0.999);
    const grad = calculatePotentialGradient(1e200, 0, [{ ...source, s: 1e200, r: 1e200 }]);
    expect(grad.gx).toBeCloseTo(-0.25);
  });
  it("matches the derivative of the softened potential inside and outside its core", () => {
    expect(calculatePotentialGradient(0.5, 0, [source])).toEqual({ gx: 0, gy: 0 });
    const x = 3, epsilon = 1e-5;
    const numeric = (calculateSchwarzschildPotential(x + epsilon, 0, [source]) -
      calculateSchwarzschildPotential(x - epsilon, 0, [source])) / (2 * epsilon);
    expect(calculatePotentialGradient(x, 0, [source]).gx).toBeCloseTo(numeric, 8);
  });
  it("saturates extreme gradients while preserving zero perpendicular components", () => {
    const grad = calculatePotentialGradient(2, 0, [{ ...source, s: Number.MAX_VALUE, r: Number.MAX_VALUE }]);
    expect(Number.isFinite(grad.gx)).toBe(true);
    expect(grad.gx).toBeLessThan(0);
    expect(grad.gy).toBe(0);
  });
  it.each([-Infinity, -1, 1, Infinity, NaN])("bounds singular and out-of-domain potential %s", (potential) => {
    const delay = calculateShapiroDelay(potential);
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(1);
    expect(Number.isFinite(calculateSpatialCurvature(1, 0, potential, 0, 1))).toBe(true);
  });
  it("ignores invalid ray inputs and retains extreme cancellation symmetry", () => {
    expect(calculateSpatialCurvature(NaN, 0, 0, 0, 1)).toBe(0);
    expect(calculateSpatialCurvature(1e308, 1e308, 0, 1e308, 1e308)).toBe(0);
    const forward = calculateSpatialCurvature(1e308, 0, 1, 0, 1e308);
    expect(Number.isFinite(forward)).toBe(true);
    expect(calculateSpatialCurvature(-1e308, 0, 1, 0, 1e308)).toBe(-forward);
  });
});

describe("Entropy math validates dictionary and cost boundaries", () => {
  it("accepts absent dictionaries and ignores invalid or inherited frequencies", () => {
    expect(calculateWordCost("hello", null)).toBe(4);
    expect(calculateWordCost("hello", { hello: "2" })).toBe(4);
    expect(calculateWordCost("hello", { hello: -2 })).toBe(4);
    expect(calculateWordCost("hello", { hello: Infinity })).toBe(4);
    expect(calculateWordCost("constructor", {})).toBe(7);
    expect(calculateWordCost("hello", Object.create({ hello: 9 }))).toBe(4);
  });
  it("counts constructor words as regular words without prototype interference", () => {
    expect(calculateInputCost("constructor constructor", {}).totalCost).toBe(20);
    expect(calculateInputCost("tostring tostring", {}).totalCost).toBe(15);
  });
  it("rounds fractional frequencies down to complete prior occurrences", () => {
    expect(calculateWordCost("hello", { hello: 2.9 })).toBe(9);
  });
  it("falls back to defaults for invalid multipliers and escalation", () => {
    expect(calculateWordCost("hello", { hello: 2 }, NaN, -1)).toBe(9);
    expect(calculateWordCost("hello", { hello: 2 }, Infinity, Infinity)).toBe(9);
  });
  it("saturates word costs and aggregate totals at safe integers", () => {
    expect(calculateWordCost("hello", { hello: Number.MAX_VALUE }, 1.5, Number.MAX_VALUE)).toBe(Number.MAX_SAFE_INTEGER);
    expect(calculateInputCost("hello hello", { hello: Number.MAX_VALUE }, 1.5, Number.MAX_VALUE).totalCost).toBe(Number.MAX_SAFE_INTEGER);
  });
  it("supports empty and invalid text without NaN or phantom cost", () => {
    expect(calculateInputCost(undefined, undefined)).toEqual({ totalCost: 0, words: [] });
    expect(calculateInputCost("  \n \t  ", null)).toEqual({ totalCost: 0, words: [] });
    expect(calculateWordCost(null, {})).toBe(0);
    expect(calculateInputCost("!!! ???", {}).totalCost).toBe(0);
  });
  it("preserves the input dictionary while applying normalized repetition", () => {
    const frequencies = Object.freeze({ hello: 2 });
    expect(calculateInputCost("Hello hello!", frequencies).totalCost).toBe(20);
    expect(frequencies).toEqual({ hello: 2 });
  });
});
