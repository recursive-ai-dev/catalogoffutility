// QuantumAntVisualization.ts — Production-Ready, OS-Independent
// Requires: three (>=0.150.0), @types/three
//
// Import resolution uses bare specifiers so any bundler (Vite, Webpack,
// Rollup, esbuild, Parcel) on any OS resolves correctly.
// Avoid Node-path separators or .jsm extensions that break on some toolchains.

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  Vector2,
  Vector3,
  Group,
  Mesh,
  Points,
  Line,
  LineSegments,
  ShaderMaterial,
  MeshPhongMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  SphereGeometry,
  PlaneGeometry,
  RingGeometry,
  CylinderGeometry,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,
  AmbientLight,
  PointLight,
  DoubleSide,
  AdditiveBlending,
} from 'three';

// Post-processing imports — use the addons path that works with modern Three.js
// (three/addons/* is the canonical alias since r150; falls back to three/examples/jsm/*)
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Type Definitions ────────────────────────────────────────────────────────

/** Strongly-typed consciousness state replacing `any` */
export interface QuantumConsciousness {
  phase: number;       // 0..2π
  amplitude: number;   // 0..1
  coherence: number;   // 0..1
  entanglementDepth: number;
}

/** Personality matrix with bounded trait values */
export interface PersonalityMatrix {
  curiosity: number;
  aggression: number;
  empathy: number;
  creativity: number;
  leadership: number;
  instinct: number;
  wisdom: number;
  [customTrait: string]: number; // extensible
}

/** Ant memory record */
export interface AntMemory {
  id: string;
  timestamp: number;
  emotionalWeight: number;
  position: { x: number; y: number; z: number };
  type: 'experience' | 'dream' | 'cultural' | 'inherited';
}

/** Full quantum ant descriptor */
export interface QuantumAnt {
  id: string;
  consciousness: QuantumConsciousness;
  personalityMatrix: PersonalityMatrix;
  memories: AntMemory[];
  position: { x: number; y: number; z: number };
  cultureId?: string;
  dreamState?: DreamState;
}

/** Dream phase information */
export interface DreamState {
  active: boolean;
  intensity: number;   // 0..1
  phase: number;       // 0..2π
  resonanceFreq: number;
}

/** Colony-level statistics exposed by the engine */
export interface ColonyStats {
  collectiveCoherence: number;
  activeMemories: number;
  totalAnts: number;
  entanglementDensity: number;
  culturalDrift: number;
  dreamActivity: number;
}

/** Quantum Memory Engine interface — decoupled from concrete impl */
export interface IQuantumMemoryEngine {
  getColonyStats(): ColonyStats;
  getAnts(): QuantumAnt[];
  getEntangledPairs(): Array<[string, string]>;
  getCulturalGroups(): Map<string, string[]>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

/** Internal render node for each ant */
interface QuantumAntNode {
  group: Group;
  core: Mesh;
  rings: Mesh[];
  traitBars: Mesh[];
  memoryTrail: Line | null;
  dreamAura: Mesh | null;
  ant: QuantumAnt;
  lastUpdate: number;
}

/** Configuration for the visualization — all optional with sane defaults */
export interface VisualizationConfig {
  container?: HTMLElement;
  width?: number;
  height?: number;
  particleCount?: number;
  maxEntanglementLines?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  enableFXAA?: boolean;
  enableOrbitControls?: boolean;
  backgroundColor?: number;
  fieldSize?: number;
  fieldSegments?: number;
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  cameraPosition?: { x: number; y: number; z: number };
  autoResize?: boolean;
  maxFps?: number;
  pixelRatioLimit?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<VisualizationConfig> = {
  container: null as unknown as HTMLElement, // resolved at runtime
  width: 0,
  height: 0,
  particleCount: 2000,
  maxEntanglementLines: 5000,
  bloomStrength: 1.2,
  bloomRadius: 0.4,
  bloomThreshold: 0.15,
  enableFXAA: true,
  enableOrbitControls: true,
  backgroundColor: 0x050510,
  fieldSize: 120,
  fieldSegments: 128,
  cameraFov: 60,
  cameraNear: 0.1,
  cameraFar: 500,
  cameraPosition: { x: 0, y: 30, z: 50 },
  autoResize: true,
  maxFps: 60,
  pixelRatioLimit: 2,
};

const TRAIT_KEYS: readonly string[] = [
  'curiosity', 'aggression', 'empathy',
  'creativity', 'leadership', 'instinct', 'wisdom',
];

const TRAIT_COLOR_MAP: Record<string, number> = {
  curiosity:  0x00ff88,
  aggression: 0xff2244,
  empathy:    0x3388ff,
  creativity: 0xff8800,
  leadership: 0x9944ff,
  instinct:   0xeeff00,
  wisdom:     0x00eeff,
};

// ─── Shader Sources ──────────────────────────────────────────────────────────
// Extracted for readability and potential hot-reloading

const QUANTUM_FIELD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uCoherence;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Dual-axis wave distortion scaled by coherence
    float wave = sin(pos.x * 0.08 + uTime * 0.7) + cos(pos.y * 0.08 + uTime * 0.5);
    pos.z += wave * uCoherence * 2.5;

    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const QUANTUM_FIELD_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uCoherence;
  uniform float uEntanglement;
  uniform float uQuantumNoise;
  uniform float uDreamActivity;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  // Improved noise — hash without sin artifacts on some mobile GPUs
  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  void main() {
    // Multi-frequency interference
    float w1 = sin(vWorldPos.x * 0.05 + uTime * 1.8) * cos(vWorldPos.y * 0.05 + uTime * 1.3);
    float w2 = sin(vWorldPos.x * 0.03 + uTime * 1.1) * cos(vWorldPos.y * 0.07 + uTime * 0.7);
    float w3 = sin(vWorldPos.x * 0.02 + vWorldPos.y * 0.02 + uTime * 0.4) * 0.5;
    float interference = (w1 + w2 + w3) * 0.33;

    // Coherence-driven color blend
    vec3 cyanTone   = vec3(0.15, 0.75, 1.0);
    vec3 magentaTone = vec3(1.0, 0.15, 0.7);
    vec3 dreamTone  = vec3(0.6, 0.2, 1.0);
    vec3 col = mix(magentaTone, cyanTone, uCoherence);
    col = mix(col, dreamTone, uDreamActivity * 0.4);

    // Subtle dithered noise (avoids banding on 8-bit displays)
    float noise = hash21(vUv * 512.0 + uTime * 0.1);
    col += (noise - 0.5) * uQuantumNoise * 0.08;

    // Entanglement brightens field edges
    float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(0.0, 0.15, 1.0 - vUv.x)
                   * smoothstep(0.0, 0.15, vUv.y) * smoothstep(0.0, 0.15, 1.0 - vUv.y);

    float alpha = (0.18 + interference * 0.22 + uEntanglement * 0.1) * edgeFade;
    gl_FragColor = vec4(col * (0.5 + interference * 0.5), alpha);
  }
`;

const PARTICLE_VERTEX = /* glsl */ `
  attribute float aIntensity;
  attribute float aPhase;
  varying float vIntensity;
  varying vec3  vColor;
  uniform float uTime;
  uniform float uResonance;

  void main() {
    vIntensity = aIntensity;
    vColor = color;

    vec3 pos = position;
    // Oscillation modulated by resonance and per-particle phase offset
    pos.y += sin(uTime * 1.5 + aPhase) * aIntensity * uResonance * 4.0;
    pos.x += cos(uTime * 0.8 + aPhase * 1.3) * aIntensity * uResonance * 1.5;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // Size attenuation — consistent across screen densities
    float baseSize = 2.0 + aIntensity * 4.0;
    gl_PointSize = baseSize * (300.0 / -mvPos.z);
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  precision highp float;
  varying float vIntensity;
  varying vec3  vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Soft radial falloff
    float alpha = smoothstep(0.5, 0.1, dist) * vIntensity;
    gl_FragColor = vec4(vColor * (0.6 + vIntensity * 0.6), alpha);
  }
`;

const DREAM_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DREAM_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uPhase;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv - 0.5;
    float r = length(uv);
    float angle = atan(uv.y, uv.x);

    // Spiraling dream ripples
    float ripple = sin(r * 20.0 - uTime * 3.0 + uPhase) * 0.5 + 0.5;
    float spiral = sin(angle * 4.0 + r * 10.0 - uTime * 2.0) * 0.5 + 0.5;
    float pattern = ripple * spiral;

    vec3 col = mix(vec3(0.3, 0.0, 0.6), vec3(0.0, 0.8, 1.0), pattern);
    float alpha = pattern * uIntensity * smoothstep(0.5, 0.1, r);

    gl_FragColor = vec4(col, alpha * 0.6);
  }
`;

const ENTANGLEMENT_VERTEX = /* glsl */ `
  attribute float aStrength;
  varying float vStrength;
  varying vec3  vColor;

  void main() {
    vStrength = aStrength;
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ENTANGLEMENT_FRAGMENT = /* glsl */ `
  precision highp float;
  varying float vStrength;
  varying vec3  vColor;

  void main() {
    gl_FragColor = vec4(vColor * (0.4 + vStrength * 0.6), vStrength * 0.5);
  }
`;

// ─── Main Class ──────────────────────────────────────────────────────────────

export class QuantumAntVisualization {
  // Core Three.js
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private composer: EffectComposer;
  private clock: Clock;
  private controls: OrbitControls | null = null;

  // Engine reference
  private engine: IQuantumMemoryEngine;

  // Config
  private config: Required<VisualizationConfig>;

  // Scene objects
  private quantumFieldMesh!: Mesh;
  private quantumFieldMaterial!: ShaderMaterial;
  private memoryResonanceParticles!: Points;
  private particleMaterial!: ShaderMaterial;
  private entanglementLines!: LineSegments;
  private entanglementGeometry!: BufferGeometry;
  private entanglementMaterial!: ShaderMaterial;
  private dreamGroup!: Group;
  private cultureGroup!: Group;

  // Pre-allocated entanglement buffers (avoid GC churn)
  private entanglementPositions!: Float32Array;
  private entanglementColors!: Float32Array;
  private entanglementStrengths!: Float32Array;

  // Ant nodes
  private antNodes: Map<string, QuantumAntNode> = new Map();
  private consciousnessFlows: Map<string, Line> = new Map();

  // Lifecycle
  private animFrameId: number = 0;
  private disposed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private boundEventHandlers: Map<string, (...args: unknown[]) => void> = new Map();
  private frameInterval: number = 0;
  private lastFrameTime: number = 0;

  // Geometry/material pools for disposal
  private disposables: Set<{ dispose(): void }> = new Set();

  constructor(engine: IQuantumMemoryEngine, config: Partial<VisualizationConfig> = {}) {
    this.engine = engine;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.clock = new Clock();

    if (this.config.maxFps > 0 && this.config.maxFps < 1000) {
      this.frameInterval = 1000 / this.config.maxFps;
    }

    // Resolve container
    if (!this.config.container) {
      this.config.container = document.body;
    }

    // Resolve dimensions
    if (!this.config.width) {
      this.config.width = this.config.container.clientWidth || window.innerWidth;
    }
    if (!this.config.height) {
      this.config.height = this.config.container.clientHeight || window.innerHeight;
    }

    // Build the pipeline
    this.scene = new Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.composer = this.createPostProcessing();

    this.addLighting();
    this.createQuantumField();
    this.createMemoryResonanceSystem();
    this.createDreamVisualization();
    this.createCultureMutationEffects();
    this.createEntanglementSystem();

    if (this.config.enableOrbitControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.minDistance = 10;
      this.controls.maxDistance = 200;
    }

    if (this.config.autoResize) {
      this.setupResizeHandling();
    }

    this.bindQuantumEvents();
    this.syncAntsFromEngine();
    this.startLoop();
  }

  // ─── Renderer & Camera ───────────────────────────────────────────────────

  private createCamera(): PerspectiveCamera {
    const { cameraFov, cameraNear, cameraFar, width, height, cameraPosition } = this.config;
    const cam = new PerspectiveCamera(cameraFov, width / height, cameraNear, cameraFar);
    cam.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    cam.lookAt(0, 0, 0);
    return cam;
  }

  private createRenderer(): WebGLRenderer {
    const { width, height, backgroundColor, pixelRatioLimit, container } = this.config;

    // Detect WebGL support (OS-independent)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      throw new Error(
        'WebGL is not supported in this environment. ' +
        'Ensure hardware acceleration is enabled in your browser settings.'
      );
    }

    const renderer = new WebGLRenderer({
      antialias: false,  // handled by FXAA pass instead (cheaper on mobile)
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    });

    // Clamp pixel ratio — prevents perf collapse on 3×/4× HiDPI screens
    const dpr = Math.min(window.devicePixelRatio || 1, pixelRatioLimit);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(backgroundColor, 1);

    container.appendChild(renderer.domElement);

    // Touch action for mobile — prevents scroll-hijack
    renderer.domElement.style.touchAction = 'none';

    return renderer;
  }

  private createPostProcessing(): EffectComposer {
    const { width, height, bloomStrength, bloomRadius, bloomThreshold, enableFXAA } = this.config;

    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));

    const bloomPass = new UnrealBloomPass(
      new Vector2(width, height),
      bloomStrength,
      bloomRadius,
      bloomThreshold,
    );
    composer.addPass(bloomPass);
    this.disposables.add(bloomPass);

    if (enableFXAA) {
      const fxaaPass = new ShaderPass(FXAAShader);
      const dpr = this.renderer.getPixelRatio();
      fxaaPass.material.uniforms['resolution'].value.set(
        1 / (width * dpr),
        1 / (height * dpr),
      );
      composer.addPass(fxaaPass);
    }

    return composer;
  }

  private addLighting(): void {
    const ambient = new AmbientLight(0x222244, 0.8);
    this.scene.add(ambient);

    const point1 = new PointLight(0x00ccff, 1.2, 100);
    point1.position.set(20, 30, 20);
    this.scene.add(point1);

    const point2 = new PointLight(0xff00aa, 0.8, 80);
    point2.position.set(-20, 20, -20);
    this.scene.add(point2);
  }

  // ─── Quantum Field ───────────────────────────────────────────────────────

  private createQuantumField(): void {
    const { fieldSize, fieldSegments } = this.config;

    this.quantumFieldMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCoherence: { value: 0.5 },
        uEntanglement: { value: 0.3 },
        uQuantumNoise: { value: 0.15 },
        uDreamActivity: { value: 0 },
      },
      vertexShader: QUANTUM_FIELD_VERTEX,
      fragmentShader: QUANTUM_FIELD_FRAGMENT,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });

    const geo = new PlaneGeometry(fieldSize, fieldSize, fieldSegments, fieldSegments);
    this.quantumFieldMesh = new Mesh(geo, this.quantumFieldMaterial);
    this.quantumFieldMesh.rotation.x = -Math.PI / 2;
    this.quantumFieldMesh.position.y = -5;
    this.scene.add(this.quantumFieldMesh);

    this.disposables.add(geo);
    this.disposables.add(this.quantumFieldMaterial);
  }

  // ─── Memory Resonance Particles ──────────────────────────────────────────

  private createMemoryResonanceSystem(): void {
    const count = this.config.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const intensities = new Float32Array(count);
    const phases = new Float32Array(count);
    const spread = this.config.fieldSize * 0.45;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = Math.random() * spread * 0.5;
      positions[i3 + 2] = (Math.random() - 0.5) * spread;

      // Hue-shifted palette
      const hue = Math.random();
      const c = new Color().setHSL(hue, 0.7 + Math.random() * 0.3, 0.5 + Math.random() * 0.3);
      colors[i3]     = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      intensities[i] = 0.2 + Math.random() * 0.8;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    geo.setAttribute('color', new BufferAttribute(colors, 3));
    geo.setAttribute('aIntensity', new BufferAttribute(intensities, 1));
    geo.setAttribute('aPhase', new BufferAttribute(phases, 1));

    this.particleMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResonance: { value: 0.5 },
      },
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.memoryResonanceParticles = new Points(geo, this.particleMaterial);
    this.scene.add(this.memoryResonanceParticles);

    this.disposables.add(geo);
    this.disposables.add(this.particleMaterial);
  }

  // ─── Entanglement Lines (Pre-allocated) ──────────────────────────────────

  private createEntanglementSystem(): void {
    const maxLines = this.config.maxEntanglementLines;
    const maxVerts = maxLines * 2;

    this.entanglementPositions = new Float32Array(maxVerts * 3);
    this.entanglementColors = new Float32Array(maxVerts * 3);
    this.entanglementStrengths = new Float32Array(maxVerts);

    this.entanglementGeometry = new BufferGeometry();
    this.entanglementGeometry.setAttribute('position', new Float32BufferAttribute(this.entanglementPositions, 3));
    this.entanglementGeometry.setAttribute('color', new Float32BufferAttribute(this.entanglementColors, 3));
    this.entanglementGeometry.setAttribute('aStrength', new Float32BufferAttribute(this.entanglementStrengths, 1));
    this.entanglementGeometry.setDrawRange(0, 0); // nothing visible initially

    this.entanglementMaterial = new ShaderMaterial({
      vertexShader: ENTANGLEMENT_VERTEX,
      fragmentShader: ENTANGLEMENT_FRAGMENT,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.entanglementLines = new LineSegments(this.entanglementGeometry, this.entanglementMaterial);
    this.scene.add(this.entanglementLines);

    this.disposables.add(this.entanglementGeometry);
    this.disposables.add(this.entanglementMaterial);
  }

  // ─── Dream Visualization ─────────────────────────────────────────────────

  private createDreamVisualization(): void {
    this.dreamGroup = new Group();
    this.scene.add(this.dreamGroup);
  }

  private getOrCreateDreamAura(node: QuantumAntNode): Mesh {
    if (node.dreamAura) return node.dreamAura;

    const geo = new SphereGeometry(2.5, 24, 24);
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uPhase: { value: 0 },
      },
      vertexShader: DREAM_VERTEX,
      fragmentShader: DREAM_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    });

    const mesh = new Mesh(geo, mat);
    node.group.add(mesh);
    node.dreamAura = mesh;

    this.disposables.add(geo);
    this.disposables.add(mat);

    return mesh;
  }

  // ─── Culture Mutation Effects ────────────────────────────────────────────

  private createCultureMutationEffects(): void {
    this.cultureGroup = new Group();
    this.scene.add(this.cultureGroup);
  }

  private updateCultureVisuals(): void {
    const culturalGroups = this.engine.getCulturalGroups();

    // Clear previous
    while (this.cultureGroup.children.length > 0) {
      const child = this.cultureGroup.children[0];
      this.cultureGroup.remove(child);
      this.disposeObject3D(child);
    }

    culturalGroups.forEach((antIds, cultureId) => {
      if (antIds.length < 2) return;

      // Compute centroid of culture group
      let cx = 0, cy = 0, cz = 0, count = 0;
      for (const id of antIds) {
        const node = this.antNodes.get(id);
        if (node) {
          cx += node.group.position.x;
          cy += node.group.position.y;
          cz += node.group.position.z;
          count++;
        }
      }
      if (count === 0) return;
      cx /= count; cy /= count; cz /= count;

      // Culture boundary sphere
      let maxDist = 0;
      for (const id of antIds) {
        const node = this.antNodes.get(id);
        if (node) {
          const d = node.group.position.distanceTo(new Vector3(cx, cy, cz));
          if (d > maxDist) maxDist = d;
        }
      }

      const radius = Math.max(maxDist + 1, 2);
      const hue = hashStringToFloat(cultureId);

      const geo = new SphereGeometry(radius, 16, 16);
      const mat = new MeshBasicMaterial({
        color: new Color().setHSL(hue, 0.6, 0.4),
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
        wireframe: true,
      });

      const sphere = new Mesh(geo, mat);
      sphere.position.set(cx, cy, cz);
      this.cultureGroup.add(sphere);

      // These are transient — don't add to main disposables, handled on next update
    });
  }

  // ─── Ant Node Management ─────────────────────────────────────────────────

  private syncAntsFromEngine(): void {
    const engineAnts = this.engine.getAnts();
    const currentIds = new Set(engineAnts.map(a => a.id));

    // Remove departed ants
    for (const [id, node] of this.antNodes) {
      if (!currentIds.has(id)) {
        this.scene.remove(node.group);
        this.disposeObject3D(node.group);
        this.antNodes.delete(id);

        const flow = this.consciousnessFlows.get(id);
        if (flow) {
          this.scene.remove(flow);
          this.disposeObject3D(flow);
          this.consciousnessFlows.delete(id);
        }
      }
    }

    // Add/update ants
    for (const ant of engineAnts) {
      let node = this.antNodes.get(ant.id);
      if (!node) {
        node = this.createQuantumAntNode(ant);
        this.antNodes.set(ant.id, node);
        this.scene.add(node.group);
      } else {
        node.ant = ant;
      }
    }
  }

  private createQuantumAntNode(ant: QuantumAnt): QuantumAntNode {
    const group = new Group();
    group.position.set(ant.position.x, ant.position.y, ant.position.z);

    // Core sphere — consciousness representation
    const coreGeo = new SphereGeometry(0.5, 16, 16);
    const coreMat = new MeshPhongMaterial({
      color: this.getQuantumStateColor(ant.consciousness),
      transparent: true,
      opacity: Math.max(ant.consciousness.coherence, 0.15),
      emissive: this.getQuantumStateColor(ant.consciousness),
      emissiveIntensity: 0.3,
    });
    const core = new Mesh(coreGeo, coreMat);
    group.add(core);
    this.disposables.add(coreGeo);
    this.disposables.add(coreMat);

    // Orbital rings
    const rings: Mesh[] = [];
    const ringGeo = new RingGeometry(1, 1.15, 32);
    this.disposables.add(ringGeo);

    for (let i = 0; i < 3; i++) {
      const ringMat = new MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.15 + ant.consciousness.coherence * 0.2,
        side: DoubleSide,
      });
      const ring = new Mesh(ringGeo, ringMat);
      // Deterministic initial rotation from ant id hash
      const seed = hashStringToFloat(ant.id + i.toString());
      ring.rotation.x = seed * Math.PI;
      ring.rotation.y = (seed * 1.618) * Math.PI; // golden ratio spread
      ring.scale.setScalar(0.6 + i * 0.25);
      group.add(ring);
      rings.push(ring);
      this.disposables.add(ringMat);
    }

    // Personality trait bars
    const traitBars = this.createPersonalityBars(group, ant.personalityMatrix);

    // Memory trail
    const memoryTrail = this.createMemoryTrail(group, ant.memories);

    return {
      group,
      core,
      rings,
      traitBars,
      memoryTrail,
      dreamAura: null,
      ant,
      lastUpdate: performance.now(),
    };
  }

  private createPersonalityBars(group: Group, personality: PersonalityMatrix): Mesh[] {
    const bars: Mesh[] = [];
    const traits = TRAIT_KEYS.filter(t => personality[t] !== undefined);

    traits.forEach((trait, idx) => {
      const value = clamp01(personality[trait]);
      if (value < 0.01) return; // skip invisible bars

      const angle = (idx / traits.length) * Math.PI * 2;
      const height = value * 2;

      const geo = new CylinderGeometry(0.05, 0.05, height, 6);
      const mat = new MeshPhongMaterial({
        color: TRAIT_COLOR_MAP[trait] ?? 0xffffff,
        transparent: true,
        opacity: 0.65,
        emissive: TRAIT_COLOR_MAP[trait] ?? 0xffffff,
        emissiveIntensity: 0.15,
      });

      const mesh = new Mesh(geo, mat);
      mesh.position.x = Math.cos(angle) * 1.8;
      mesh.position.z = Math.sin(angle) * 1.8;
      mesh.position.y = height * 0.5;
      group.add(mesh);
      bars.push(mesh);

      this.disposables.add(geo);
      this.disposables.add(mat);
    });

    return bars;
  }

  private createMemoryTrail(group: Group, memories: AntMemory[]): Line | null {
    if (memories.length < 2) return null;

    const recent = memories.slice(-12);
    const points = recent.map((mem, i) => {
      // Spiral based on actual memory positions if available, fallback to generated
      if (mem.position) {
        return new Vector3(
          mem.position.x * 0.3,
          i * 0.15 + mem.emotionalWeight * 0.5,
          mem.position.z * 0.3,
        );
      }
      return new Vector3(
        Math.cos(i * 0.5) * 2.5,
        i * 0.15,
        Math.sin(i * 0.5) * 2.5,
      );
    });

    const geo = new BufferGeometry().setFromPoints(points);
    const mat = new LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });

    const line = new Line(geo, mat);
    group.add(line);

    this.disposables.add(geo);
    this.disposables.add(mat);

    return line;
  }

  // ─── Per-Frame Updates ───────────────────────────────────────────────────

  private updateAntQuantumStates(time: number, dt: number): void {
    for (const [_id, node] of this.antNodes) {
      const { ant, core, rings, group } = node;

      // Position interpolation (smooth movement)
      group.position.lerp(
        new Vector3(ant.position.x, ant.position.y, ant.position.z),
        Math.min(dt * 3, 1),
      );

      // Core color & opacity from consciousness
      if (core.material instanceof MeshPhongMaterial) {
        const col = this.getQuantumStateColor(ant.consciousness);
        core.material.color.setHex(col);
        core.material.emissive.setHex(col);
        core.material.opacity = Math.max(ant.consciousness.coherence, 0.15);
      }

      // Spin rings based on phase
      const phaseDt = ant.consciousness.phase + time * 0.3;
      rings.forEach((ring, i) => {
        ring.rotation.x += (0.005 + i * 0.003) * ant.consciousness.amplitude;
        ring.rotation.z += (0.003 + i * 0.002) * ant.consciousness.amplitude;
        if (ring.material instanceof MeshBasicMaterial) {
          ring.material.opacity = 0.1 + ant.consciousness.coherence * 0.25 +
            Math.sin(phaseDt + i) * 0.05;
        }
      });

      // Dream aura
      if (ant.dreamState?.active) {
        const aura = this.getOrCreateDreamAura(node);
        if (aura.material instanceof ShaderMaterial) {
          aura.material.uniforms.uTime.value = time;
          aura.material.uniforms.uIntensity.value = ant.dreamState.intensity;
          aura.material.uniforms.uPhase.value = ant.dreamState.phase;
        }
        aura.visible = true;
      } else if (node.dreamAura) {
        node.dreamAura.visible = false;
      }
    }
  }

  private updateEntanglementVisualization(): void {
    const pairs = this.engine.getEntangledPairs();
    const maxLines = this.config.maxEntanglementLines;
    let vertIdx = 0;
    const limit = Math.min(pairs.length, maxLines);

    for (let p = 0; p < limit; p++) {
      const [id1, id2] = pairs[p];
      const n1 = this.antNodes.get(id1);
      const n2 = this.antNodes.get(id2);
      if (!n1 || !n2) continue;

      const p1 = n1.group.position;
      const p2 = n2.group.position;
      const strength = this.calculateEntanglement(n1.ant, n2.ant);

      if (strength < 0.01) continue; // cull invisible connections

      const vi = vertIdx * 3;

      this.entanglementPositions[vi]     = p1.x;
      this.entanglementPositions[vi + 1] = p1.y;
      this.entanglementPositions[vi + 2] = p1.z;
      this.entanglementPositions[vi + 3] = p2.x;
      this.entanglementPositions[vi + 4] = p2.y;
      this.entanglementPositions[vi + 5] = p2.z;

      // Color: magenta→cyan gradient based on strength
      const r = strength;
      const g = 0.3 + strength * 0.3;
      const b = 1.0 - strength * 0.5;

      this.entanglementColors[vi]     = r;
      this.entanglementColors[vi + 1] = g;
      this.entanglementColors[vi + 2] = b;
      this.entanglementColors[vi + 3] = r;
      this.entanglementColors[vi + 4] = g;
      this.entanglementColors[vi + 5] = b;

      this.entanglementStrengths[vertIdx]     = strength;
      this.entanglementStrengths[vertIdx + 1] = strength;

      vertIdx += 2;
    }

    // Upload only the used portion
    const posAttr = this.entanglementGeometry.getAttribute('position') as BufferAttribute;
    const colAttr = this.entanglementGeometry.getAttribute('color') as BufferAttribute;
    const strAttr = this.entanglementGeometry.getAttribute('aStrength') as BufferAttribute;

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    strAttr.needsUpdate = true;

    this.entanglementGeometry.setDrawRange(0, vertIdx);
  }

  // ─── Physics / Math ──────────────────────────────────────────────────────

  private calculateEntanglement(ant1: QuantumAnt, ant2: QuantumAnt): number {
    const s1 = ant1.consciousness;
    const s2 = ant2.consciousness;

    const phaseDiff = Math.abs(s1.phase - s2.phase);
    const amplitudeFactor = Math.sqrt(s1.amplitude * s2.amplitude);
    const coherenceFactor = (s1.coherence + s2.coherence) * 0.5;
    const depthFactor = Math.min(s1.entanglementDepth, s2.entanglementDepth) /
      Math.max(s1.entanglementDepth, s2.entanglementDepth, 1);

    // Cosine similarity of phase, scaled by amplitude and coherence
    return clamp01(amplitudeFactor * coherenceFactor * depthFactor * Math.cos(phaseDiff));
  }

  private getQuantumStateColor(c: QuantumConsciousness): number {
    const hue = c.phase / (Math.PI * 2);
    const sat = clamp01(c.coherence * 0.8 + 0.2);
    const lit = clamp01(c.amplitude * 0.6 + 0.2);
    return new Color().setHSL(hue, sat, lit).getHex();
  }

  // ─── Event Binding ───────────────────────────────────────────────────────

  private bindQuantumEvents(): void {
    const onAntAdded = () => this.syncAntsFromEngine();
    const onAntRemoved = () => this.syncAntsFromEngine();
    const onCultureShift = () => this.updateCultureVisuals();

    this.engine.on('antAdded', onAntAdded);
    this.engine.on('antRemoved', onAntRemoved);
    this.engine.on('cultureShift', onCultureShift);

    this.boundEventHandlers.set('antAdded', onAntAdded);
    this.boundEventHandlers.set('antRemoved', onAntRemoved);
    this.boundEventHandlers.set('cultureShift', onCultureShift);
  }

  private unbindQuantumEvents(): void {
    for (const [event, handler] of this.boundEventHandlers) {
      this.engine.off(event, handler);
    }
    this.boundEventHandlers.clear();
  }

  // ─── Resize Handling (OS-independent) ────────────────────────────────────

  private setupResizeHandling(): void {
    // Prefer ResizeObserver — works in all modern browsers, not OS-specific
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.handleResize(Math.floor(width), Math.floor(height));
          }
        }
      });
      this.resizeObserver.observe(this.config.container);
    } else {
      // Fallback for older environments
      const onResize = () => {
        const w = this.config.container.clientWidth || window.innerWidth;
        const h = this.config.container.clientHeight || window.innerHeight;
        this.handleResize(w, h);
      };
      window.addEventListener('resize', onResize, { passive: true });
      this.boundEventHandlers.set('__windowResize', onResize as any);
    }
  }

  private handleResize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, this.config.pixelRatioLimit);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    // Update FXAA resolution uniform if present
    const passes = (this.composer as any).passes;
    if (passes) {
      for (const pass of passes) {
        if (pass.material?.uniforms?.resolution) {
          pass.material.uniforms.resolution.value.set(
            1 / (width * dpr),
            1 / (height * dpr),
          );
        }
      }
    }
  }

  // ─── Animation Loop ──────────────────────────────────────────────────────

  private startLoop(): void {
    const tick = (timestamp: number) => {
      if (this.disposed) return;
      this.animFrameId = requestAnimationFrame(tick);

      // Frame throttle
      if (this.frameInterval > 0) {
        const elapsed = timestamp - this.lastFrameTime;
        if (elapsed < this.frameInterval) return;
        this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      }

      this.update();
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private update(): void {
    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    const stats = this.engine.getColonyStats();

    // Quantum field uniforms
    this.quantumFieldMaterial.uniforms.uTime.value = time;
    this.quantumFieldMaterial.uniforms.uCoherence.value = stats.collectiveCoherence;
    this.quantumFieldMaterial.uniforms.uEntanglement.value = stats.entanglementDensity;
    this.quantumFieldMaterial.uniforms.uDreamActivity.value = stats.dreamActivity;

    // Particle uniforms
    this.particleMaterial.uniforms.uTime.value = time;
    this.particleMaterial.uniforms.uResonance.value =
      clamp01(stats.activeMemories / Math.max(stats.totalAnts * 5, 1));

    // Ant state updates
    this.updateAntQuantumStates(time, dt);

    // Entanglement lines
    this.updateEntanglementVisualization();

    // Orbit controls
    if (this.controls) {
      this.controls.update();
    }

    // Render
    this.composer.render();
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /** Force a full re-sync with the engine (e.g. after bulk ant mutations) */
  public refresh(): void {
    this.syncAntsFromEngine();
    this.updateCultureVisuals();
  }

  /** Get the canvas element for external DOM manipulation */
  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /** Get the Three.js scene for external extension */
  public getScene(): Scene {
    return this.scene;
  }

  /** Get the camera for external manipulation */
  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  /** Pause rendering without disposal */
  public pause(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  /** Resume rendering after pause */
  public resume(): void {
    if (!this.animFrameId && !this.disposed) {
      this.clock.start();
      this.startLoop();
    }
  }

  /** Take a snapshot as a data URL */
  public takeSnapshot(mimeType: string = 'image/png', quality: number = 0.92): string {
    this.update(); // ensure frame is current
    return this.renderer.domElement.toDataURL(mimeType, quality);
  }

  /** Full cleanup — call when the visualization is no longer needed */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // Stop animation
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    // Unbind engine events
    this.unbindQuantumEvents();

    // Resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Window resize fallback
    const winResize = this.boundEventHandlers.get('__windowResize');
    if (winResize) {
      window.removeEventListener('resize', winResize as any);
    }

    // Orbit controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Dispose all tracked resources
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables.clear();

    // Dispose ant nodes
    for (const [, node] of this.antNodes) {
      this.disposeObject3D(node.group);
    }
    this.antNodes.clear();

    // Consciousness flows
    for (const [, flow] of this.consciousnessFlows) {
      this.disposeObject3D(flow);
    }
    this.consciousnessFlows.clear();

    // Culture group children
    while (this.cultureGroup.children.length > 0) {
      const child = this.cultureGroup.children[0];
      this.cultureGroup.remove(child);
      this.disposeObject3D(child);
    }

    // Scene
    this.scene.clear();

    // Renderer
    this.renderer.dispose();
    this.renderer.forceContextLoss();

    // Remove canvas from DOM
    const canvas = this.renderer.domElement;
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }

  /** Recursively dispose an Object3D and its materials/geometries */
  private disposeObject3D(obj: any): void {
    if (!obj) return;

    if (obj.geometry) {
      obj.geometry.dispose();
    }

    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m: any) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }

    if (obj.children) {
      for (let i = obj.children.length - 1; i >= 0; i--) {
        this.disposeObject3D(obj.children[i]);
      }
    }
  }
}

// ─── Utility Functions ─────────────────────────────────────────────────────

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Deterministic string → [0, 1) float hash for consistent visual identity */
function hashStringToFloat(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

