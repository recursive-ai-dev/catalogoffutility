import { describe, it, expect } from 'vitest';
import {
  calculateSchwarzschildPotential,
  calculatePotentialGradient,
  calculateSpatialCurvature,
  calculateShapiroDelay,
  calculateWordCost,
  calculateInputCost
} from '../../public/math-physics.js';

describe('General Relativity Mathematical Rigor', () => {

  it('Maintains Schwarzschild Potential invariants under rigorous stress', () => {
    // Generate thousands of randomized sources and coordinates to test stability
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 1000;
        const y = (Math.random() - 0.5) * 1000;

        const sources = Array.from({length: Math.floor(Math.random() * 5) + 1}, () => ({
            x: (Math.random() - 0.5) * 1000,
            y: (Math.random() - 0.5) * 1000,
            s: Math.random() * 5 + 0.1,
            r: Math.random() * 200 + 10
        }));

        const I = calculateSchwarzschildPotential(x, y, sources);
        // Invariant: I is strictly bounded [0, 0.999]
        expect(I).toBeGreaterThanOrEqual(0);
        expect(I).toBeLessThanOrEqual(0.999);
    }
  });

  it('Computes valid gradients even very close to sources', () => {
    // Specifically test near-singularities
    for (let i = 0; i < 1000; i++) {
        const x = 0;
        const y = 0;
        // source extremely close
        const sources = [{ x: 0.1, y: -0.1, s: 2, r: 50 }];
        const grad = calculatePotentialGradient(x, y, sources);
        expect(Number.isNaN(grad.gx)).toBe(false);
        expect(Number.isNaN(grad.gy)).toBe(false);
        expect(Number.isFinite(grad.gx)).toBe(true);
        expect(Number.isFinite(grad.gy)).toBe(true);
    }
  });

  it('Verifies Shapiro delay scales correctly and limits to bounded delay', () => {
     for(let i=0; i<1000; i++) {
        const I = Math.random() * 0.999;
        const delay = calculateShapiroDelay(I);
        // Delay factor must decrease as potential approaches 1 (slower light coordinate speed)
        expect(delay).toBeGreaterThan(0);
        expect(delay).toBeLessThanOrEqual(1.0);

        // Prove monotonicity
        const I_larger = Math.min(0.999, I + 0.01);
        const delay_larger = calculateShapiroDelay(I_larger);
        expect(delay_larger).toBeLessThan(delay);
     }
  });

  it('Verifies spatial curvature calculation behaves symmetrically', () => {
      // test with normalized velocities
      for(let i=0; i<100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle);
        const vy = Math.sin(angle);
        const I = Math.random() * 0.9;
        const gx = (Math.random() - 0.5) * 0.1;
        const gy = (Math.random() - 0.5) * 0.1;

        const k = calculateSpatialCurvature(vx, vy, I, gx, gy);
        expect(Number.isFinite(k)).toBe(true);

        // Anti-symmetry of reversing velocity should negate curvature
        const k_rev = calculateSpatialCurvature(-vx, -vy, I, gx, gy);
        expect(k_rev).toBeCloseTo(-k, 5);
      }
  });
});

describe('Entropy Budget Mathematical Rigor', () => {
   it('Applies correct scaling and escalation costs to words', () => {
      const freq = { 'hello': 2, 'world': 0, 'void': 5 };

      // cost: 1.0 + (5*0.5) = 3.5
      // hello freq 2 => multiplier = 1.5 + (2*0.5) = 2.5
      // 3.5 * 2.5 = 8.75 => 9
      expect(calculateWordCost('hello', freq)).toBe(9);

      // cost: 1.0 + (5*0.5) = 3.5 => 4
      expect(calculateWordCost('world', freq)).toBe(4);

      // cost: 1.0 + (4*0.5) = 3.0
      // void freq 5 => multiplier = 1.5 + (5*0.5) = 4.0
      // 3.0 * 4.0 = 12
      expect(calculateWordCost('void', freq)).toBe(12);
   });

   it('Accumulates input costs with intra-input repetition penalty', () => {
      const freq = { 'hello': 2, 'world': 0 };
      const text = "hello   world. hello!!!";
      // Expected total: 9 (hello @ freq 2) + 4 (world) + 11 (hello @ freq 3) = 24
      const res = calculateInputCost(text, freq, 1.5, 0.5);
      expect(res.totalCost).toBe(24);
      expect(res.words.length).toBe(3);
   });

   it('Maintains cost logic invariants under randomized spam input', () => {
       for(let i=0; i<5000; i++) {
           const len = Math.floor(Math.random() * 50) + 1;
           const char = String.fromCharCode(97 + Math.floor(Math.random()*26));
           const str = new Array(len).fill(char).join('');
           const cost = calculateWordCost(str, {});
           expect(cost).toBe(Math.ceil(1.0 + len * 0.5));

           // Ensure large frequency doesn't cause overflow or negative costs
           const extremeFreq = {'test': 1000000};
           const extremeCost = calculateWordCost('test', extremeFreq);
           expect(extremeCost).toBeGreaterThan(100000);
           expect(Number.isFinite(extremeCost)).toBe(true);
       }
   });
});
