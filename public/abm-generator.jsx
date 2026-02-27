import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

/* ═══════════════════════════════════════════════════════════════════
   MUSICAL CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const SCALES = {
  "Natural Minor": [0,2,3,5,7,8,10],
  "Harmonic Minor": [0,2,3,5,7,8,11],
  "Dorian":         [0,2,3,5,7,9,10],
  "Phrygian":       [0,1,3,5,7,8,10],
};
const PROGRESSIONS = [
  [0,5,2,6],[0,3,6,2],[0,6,5,3],[0,4,5,6],[0,5,3,6],[0,3,5,6],[0,2,5,3],
];

const MODES = {
  "Frozen Tundra":   { bpm:68,  drum:"ambient",  guitar:"arpeggio", prog:5, mixG:0.25, mixB:0.2, mixD:0.15, mixP:0.8, mixW:0.7 },
  "Twilight March":  { bpm:115, drum:"halftime",  guitar:"melodic",  prog:0, mixG:0.6,  mixB:0.5, mixD:0.5,  mixP:0.5, mixW:0.35 },
  "Boreal Storm":    { bpm:172, drum:"blast",     guitar:"tremolo",  prog:1, mixG:0.8,  mixB:0.65,mixD:0.7,  mixP:0.35,mixW:0.2 },
  "Grief Eternal":   { bpm:78,  drum:"doom",      guitar:"doom",     prog:3, mixG:0.7,  mixB:0.7, mixD:0.45, mixP:0.6, mixW:0.4 },
  "Pale Autumn":     { bpm:140, drum:"drive",     guitar:"tremolo",  prog:6, mixG:0.75, mixB:0.55,mixD:0.6,  mixP:0.45,mixW:0.3 },
};

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════════ */

const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const pick  = arr => arr[Math.floor(Math.random()*arr.length)];

function midiToNote(midi) {
  return NOTE_NAMES[((midi%12)+12)%12] + (Math.floor(midi/12)-1);
}

function buildExtendedScale(intervals) {
  const ext = [];
  for (let o=0;o<3;o++) for (const i of intervals) ext.push(i+o*12);
  return ext;
}

function getChordIntervals(intervals, degree) {
  const ext = buildExtendedScale(intervals);
  return [ext[degree], ext[degree+2], ext[degree+4]];
}

function scaleNotesInRange(pitchClass, intervals, lo, hi) {
  const notes = [];
  for (let o=-1;o<8;o++) {
    for (const i of intervals) {
      const midi = pitchClass + (o+1)*12 + i;
      if (midi >= lo && midi <= hi) notes.push(midi);
    }
  }
  return [...new Set(notes)].sort((a,b)=>a-b);
}

function findClosestIdx(arr, target) {
  let best=0;
  for (let i=1;i<arr.length;i++) {
    if (Math.abs(arr[i]-target) < Math.abs(arr[best]-target)) best=i;
  }
  return best;
}

/* ═══════════════════════════════════════════════════════════════════
   PATTERN GENERATION
   ═══════════════════════════════════════════════════════════════════ */

function generateGuitarPattern(pc, scaleKey, progIdx, style) {
  const intervals = SCALES[scaleKey];
  const prog = PROGRESSIONS[clamp(progIdx,0,PROGRESSIONS.length-1)];
  const bars = 4;
  const pattern = [];
  const range = style==="doom" ? [44,62] : style==="arpeggio" ? [50,74] : [50,72];
  const sNotes = scaleNotesInRange(pc, intervals, range[0], range[1]);
  if (sNotes.length < 3) return new Array(bars*16).fill(null);
  
  let prevIdx = Math.floor(sNotes.length/2);

  for (let bar=0; bar<bars; bar++) {
    const deg = prog[bar % prog.length];
    const chordInts = getChordIntervals(intervals, deg);
    const chordMidi = chordInts.map(i => pc + 3*12 + i); // octave 3 base
    const notesPerBar = 16;

    // Choose bar pattern type
    const pType = Math.random();

    if (style === "arpeggio") {
      // Slow arpeggiated chord tones
      const cInRange = chordMidi.filter(m => m >= range[0] && m <= range[1]);
      const arpNotes = cInRange.length >= 2 ? cInRange : [sNotes[prevIdx], sNotes[clamp(prevIdx+2,0,sNotes.length-1)]];
      for (let i=0; i<notesPerBar; i++) {
        pattern.push(i % 4 < 2 ? midiToNote(arpNotes[i % arpNotes.length]) : null);
      }
      prevIdx = findClosestIdx(sNotes, arpNotes[0]);
    } else if (style === "doom") {
      // Slow power-chord stabs
      const root = chordMidi[0] < range[1] ? chordMidi[0] : sNotes[Math.floor(sNotes.length/3)];
      for (let i=0; i<notesPerBar; i++) {
        if (i === 0 || i === 8) pattern.push(midiToNote(root));
        else if (i === 4 || i === 12) pattern.push(Math.random()<0.5 ? midiToNote(root+7) : null);
        else pattern.push(null);
      }
      prevIdx = findClosestIdx(sNotes, root);
    } else {
      // Tremolo or melodic
      if (pType < 0.3) {
        // Ascending/descending run toward a chord tone
        const target = findClosestIdx(sNotes, pick(chordMidi.filter(m=>m>=range[0]&&m<=range[1])) || sNotes[prevIdx]);
        const dir = target > prevIdx ? 1 : target < prevIdx ? -1 : (Math.random()<0.5?1:-1);
        for (let i=0; i<notesPerBar; i++) {
          pattern.push(midiToNote(sNotes[prevIdx]));
          if (i%2===0) prevIdx = clamp(prevIdx+dir, 0, sNotes.length-1);
        }
      } else if (pType < 0.55) {
        // Pedal tone alternating with scale melody
        const pedal = sNotes[clamp(findClosestIdx(sNotes, chordMidi[0]||sNotes[0]),0,sNotes.length-1)];
        let melIdx = clamp(findClosestIdx(sNotes, pedal)+3, 0, sNotes.length-1);
        for (let i=0; i<notesPerBar; i++) {
          if (i%2===0) { pattern.push(midiToNote(pedal)); }
          else {
            pattern.push(midiToNote(sNotes[melIdx]));
            melIdx = clamp(melIdx + (Math.random()<0.6?1:-1), Math.max(0,findClosestIdx(sNotes,pedal)), sNotes.length-1);
          }
        }
        prevIdx = findClosestIdx(sNotes, pedal);
      } else {
        // 4-note motif repeated with variation
        const motif = [];
        let mIdx = prevIdx;
        for (let i=0;i<4;i++) {
          motif.push(sNotes[mIdx]);
          mIdx = clamp(mIdx + (Math.random()<0.5?1:-1), 0, sNotes.length-1);
        }
        for (let i=0; i<notesPerBar; i++) {
          let base = motif[i%4];
          if (i>=8 && Math.random()<0.25) {
            const bIdx = clamp(findClosestIdx(sNotes,base) + (Math.random()<0.5?1:-1), 0, sNotes.length-1);
            base = sNotes[bIdx];
          }
          pattern.push(midiToNote(base));
        }
        prevIdx = findClosestIdx(sNotes, motif[3]);
      }
    }
  }
  return pattern;
}

function generateBassPattern(pc, scaleKey, progIdx) {
  const intervals = SCALES[scaleKey];
  const prog = PROGRESSIONS[clamp(progIdx,0,PROGRESSIONS.length-1)];
  const sNotes = scaleNotesInRange(pc, intervals, 28, 48);
  const pattern = [];
  for (let bar=0; bar<4; bar++) {
    const deg = prog[bar % prog.length];
    const chordInts = getChordIntervals(intervals, deg);
    const root = pc + 2*12 + chordInts[0]; // octave 2
    const fifth = pc + 2*12 + chordInts[2];
    const rIdx = findClosestIdx(sNotes, root);
    const r = sNotes[rIdx] || root;
    const fIdx = findClosestIdx(sNotes, fifth);
    const f = sNotes[fIdx] || fifth;
    // 8 eighth notes per bar
    for (let i=0; i<8; i++) {
      if (i===0) pattern.push(midiToNote(r));
      else if (i===4) pattern.push(Math.random()<0.6 ? midiToNote(f) : midiToNote(r));
      else if (i===6 && Math.random()<0.3) pattern.push(midiToNote(sNotes[clamp(rIdx+1,0,sNotes.length-1)]));
      else pattern.push(null);
    }
  }
  return pattern;
}

function generateDrumPattern(style, bars=4) {
  const patterns = [];
  const b = (k,s,h,c) => ({k,s,h,c});

  for (let bar=0; bar<bars; bar++) {
    if (style === "blast") {
      for (let i=0;i<16;i++) {
        patterns.push(b(
          i%4===0?1:0,     // kick on quarter notes
          i%4===2?1:0,     // snare on "and"
          i%2===0?1:0,     // hihat on eighths
          i===0&&bar===0?1:0
        ));
      }
    } else if (style === "halftime") {
      for (let i=0;i<16;i++) {
        patterns.push(b(
          i===0||i===12?1:0,
          i===8?1:0,
          i%4===0?1: i%4===2&&Math.random()<0.3?1:0,
          i===0&&bar%2===0?1:0
        ));
      }
    } else if (style === "doom") {
      for (let i=0;i<16;i++) {
        patterns.push(b(
          i===0?1: i===10&&Math.random()<0.4?1:0,
          i===8?1:0,
          0,
          i===0&&bar%4===0?1:0
        ));
      }
    } else if (style === "drive") {
      for (let i=0;i<16;i++) {
        patterns.push(b(
          i===0||i===6||i===12?1:0,
          i===4||i===12?1:0,
          i%2===0?1:0,
          i===0&&bar===0?1:0
        ));
      }
    } else { // ambient
      for (let i=0;i<16;i++) {
        patterns.push(b(
          i===0&&bar%2===0?1:0,
          0,
          0,
          i===0&&bar===0?1:0
        ));
      }
    }
  }
  return patterns;
}

function generatePadChords(pc, scaleKey, progIdx) {
  const intervals = SCALES[scaleKey];
  const prog = PROGRESSIONS[clamp(progIdx,0,PROGRESSIONS.length-1)];
  return prog.map((deg, i) => {
    const chordInts = getChordIntervals(intervals, deg);
    const notes = chordInts.map(ci => midiToNote(pc + 3*12 + ci));
    return { time: `${i}:0:0`, notes, duration: "1m" };
  });
}

/* ═══════════════════════════════════════════════════════════════════
   AUDIO ENGINE
   ═══════════════════════════════════════════════════════════════════ */

function createEngine() {
  // Master bus
  const masterComp = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.01, release: 0.2 });
  const masterLim = new Tone.Limiter(-2);
  masterComp.chain(masterLim, Tone.getDestination());

  // Volume nodes
  const vols = {
    guitar: new Tone.Volume(-6).connect(masterComp),
    bass:   new Tone.Volume(-8).connect(masterComp),
    drums:  new Tone.Volume(-6).connect(masterComp),
    pad:    new Tone.Volume(-10).connect(masterComp),
    wind:   new Tone.Volume(-18).connect(masterComp),
  };

  // === GUITAR ===
  const gDist = new Tone.Distortion({ distortion: 0.85, oversample: "4x" });
  const gChorus = new Tone.Chorus({ frequency: 0.5, delayTime: 3.5, depth: 0.6, wet: 0.3 }).start();
  const gDelay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.2, wet: 0.15 });
  const gReverb = new Tone.Freeverb({ roomSize: 0.85, dampening: 3000, wet: 0.45 });
  gDist.chain(gChorus, gDelay, gReverb, vols.guitar);

  const guitar = new Tone.MonoSynth({
    oscillator: { type: "fatsawtooth", spread: 25, count: 3 },
    envelope:   { attack: 0.003, decay: 0.08, sustain: 0.4, release: 0.1 },
    filterEnvelope: { attack: 0.003, decay: 0.15, sustain: 0.35, release: 0.15, baseFrequency: 250, octaves: 2.5 },
  }).connect(gDist);

  // === BASS ===
  const bDist = new Tone.Distortion({ distortion: 0.3, oversample: "2x" });
  const bFilter = new Tone.Filter(400, "lowpass");
  const bReverb = new Tone.Freeverb({ roomSize: 0.5, dampening: 2000, wet: 0.2 });
  bDist.chain(bFilter, bReverb, vols.bass);

  const bass = new Tone.MonoSynth({
    oscillator: { type: "fatsquare", spread: 10, count: 2 },
    envelope:   { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
    filterEnvelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.3, baseFrequency: 80, octaves: 2 },
  }).connect(bDist);

  // === DRUMS ===
  const drumReverb = new Tone.Freeverb({ roomSize: 0.6, dampening: 4000, wet: 0.25 });
  drumReverb.connect(vols.drums);

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05, octaves: 5,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.3 },
  }).connect(drumReverb);

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.08 },
  }).connect(drumReverb);

  const hihatFilter = new Tone.Filter(8500, "highpass");
  hihatFilter.connect(drumReverb);
  const hihat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.015 },
  }).connect(hihatFilter);

  const crashFilter = new Tone.Filter(5000, "highpass");
  const crashReverb = new Tone.Freeverb({ roomSize: 0.9, dampening: 2000, wet: 0.6 });
  crashFilter.chain(crashReverb, vols.drums);
  const crash = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.6 },
  }).connect(crashFilter);

  // === PAD ===
  const padReverb = new Tone.Freeverb({ roomSize: 0.92, dampening: 1500, wet: 0.7 });
  const padChorus = new Tone.Chorus({ frequency: 0.15, delayTime: 5, depth: 0.8, wet: 0.4 }).start();
  padChorus.chain(padReverb, vols.pad);

  const pad = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    options: {
      oscillator: { type: "fattriangle", spread: 40, count: 3 },
      envelope: { attack: 2.5, decay: 1.5, sustain: 0.8, release: 5 },
    },
  }).connect(padChorus);

  // === WIND AMBIENCE ===
  const windFilter = new Tone.AutoFilter({ frequency: 0.08, baseFrequency: 150, octaves: 4, type: "sine", wet: 1 }).start();
  const windFilter2 = new Tone.Filter(800, "lowpass");
  const windReverb = new Tone.Freeverb({ roomSize: 0.95, dampening: 1000, wet: 0.8 });
  windFilter.chain(windFilter2, windReverb, vols.wind);

  const wind = new Tone.Noise("pink").connect(windFilter);

  return {
    instruments: { guitar, bass, kick, snare, hihat, crash, pad, wind },
    vols,
    effects: { gDist, gChorus, gDelay, gReverb, bDist, bFilter, bReverb, drumReverb, padReverb, padChorus, crashFilter, crashReverb, hihatFilter, windFilter, windFilter2, windReverb, masterComp, masterLim },
    sequences: {},
    windStarted: false,
  };
}

function buildSequences(engine, pc, scaleKey, progIdx, drumStyle, guitarStyle) {
  // Dispose old
  Object.values(engine.sequences).forEach(s => { try { s.dispose(); } catch(e){} });
  engine.sequences = {};

  const { guitar, bass, kick, snare, hihat, crash, pad } = engine.instruments;

  // Guitar
  const gPat = generateGuitarPattern(pc, scaleKey, progIdx, guitarStyle);
  engine.sequences.guitar = new Tone.Sequence((time, note) => {
    if (note) guitar.triggerAttackRelease(note, guitarStyle==="doom"?"8n":"16n", time);
  }, gPat, "16n");

  // Bass
  const bPat = generateBassPattern(pc, scaleKey, progIdx);
  engine.sequences.bass = new Tone.Sequence((time, note) => {
    if (note) bass.triggerAttackRelease(note, "8n", time);
  }, bPat, "8n");

  // Drums
  const dPat = generateDrumPattern(drumStyle);
  engine.sequences.drums = new Tone.Sequence((time, step) => {
    if (step.k) kick.triggerAttackRelease("C1", "8n", time);
    if (step.s) snare.triggerAttackRelease("16n", time);
    if (step.h) hihat.triggerAttackRelease("32n", time);
    if (step.c) crash.triggerAttackRelease("2n", time);
  }, dPat, "16n");

  // Pad
  const pChords = generatePadChords(pc, scaleKey, progIdx);
  engine.sequences.pad = new Tone.Part((time, ev) => {
    pad.triggerAttackRelease(ev.notes, ev.duration, time);
  }, pChords);
  engine.sequences.pad.loop = true;
  engine.sequences.pad.loopEnd = "4m";

  // Start all sequences at position 0
  Object.values(engine.sequences).forEach(s => s.start(0));
}

function disposeEngine(engine) {
  if (!engine) return;
  try {
    Object.values(engine.sequences).forEach(s => { try{s.stop();s.dispose();}catch(e){} });
    if (engine.windStarted) try { engine.instruments.wind.stop(); } catch(e){}
    Object.values(engine.instruments).forEach(i => { try{i.dispose();}catch(e){} });
    Object.values(engine.effects).forEach(e => { try{e.dispose();}catch(e2){} });
    Object.values(engine.vols).forEach(v => { try{v.dispose();}catch(e){} });
  } catch(e){}
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

const Slider = ({ label, value, onChange, min=0, max=1, step=0.01, icon }) => (
  <div className="flex items-center gap-3 w-full">
    <span className="text-xs w-20 text-right opacity-60 shrink-0 tracking-wider">{icon} {label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))}
      className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
      style={{accentColor:"#6b7fa3", background:"linear-gradient(90deg,#2a3444 0%,#4a5d78 100%)"}} />
    <span className="text-xs w-10 opacity-40 font-mono">{typeof value==="number" && value<10 ? value.toFixed(2) : value}</span>
  </div>
);

export default function ABMGenerator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState("Boreal Storm");
  const [bpm, setBpm] = useState(172);
  const [rootNote, setRootNote] = useState("D");
  const [scale, setScale] = useState("Natural Minor");
  const [progIdx, setProgIdx] = useState(1);
  const [mix, setMix] = useState({ guitar:0.8, bass:0.65, drums:0.7, pad:0.35, wind:0.2 });
  const [tick, setTick] = useState(0);

  const engineRef = useRef(null);
  const animRef = useRef(null);

  // Animated particles
  const particles = useRef(
    Array.from({length:20}, (_,i) => ({
      id:i,
      x: Math.random()*100,
      y: Math.random()*100,
      size: 1+Math.random()*2,
      duration: 15+Math.random()*25,
      delay: Math.random()*-30,
      opacity: 0.05+Math.random()*0.12,
    }))
  ).current;

  // Visual pulse animation
  useEffect(() => {
    if (!isPlaying) { if(animRef.current) cancelAnimationFrame(animRef.current); return; }
    let frame = 0;
    const loop = () => {
      frame++;
      if (frame % 8 === 0) setTick(t => t+1);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if(animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying]);

  // Update volumes when mix changes
  useEffect(() => {
    if (!engineRef.current) return;
    const { vols } = engineRef.current;
    vols.guitar.volume.value = mix.guitar > 0 ? -30 + mix.guitar * 30 : -Infinity;
    vols.bass.volume.value   = mix.bass > 0   ? -30 + mix.bass * 28   : -Infinity;
    vols.drums.volume.value  = mix.drums > 0  ? -28 + mix.drums * 26  : -Infinity;
    vols.pad.volume.value    = mix.pad > 0    ? -32 + mix.pad * 28    : -Infinity;
    vols.wind.volume.value   = mix.wind > 0   ? -35 + mix.wind * 25   : -Infinity;
  }, [mix]);

  // Update BPM
  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      disposeEngine(engineRef.current);
    };
  }, []);

  const pc = NOTE_NAMES.indexOf(rootNote);

  const applyMode = useCallback((modeName) => {
    const m = MODES[modeName];
    if (!m) return;
    setMode(modeName);
    setBpm(m.bpm);
    setProgIdx(m.prog);
    setMix({ guitar:m.mixG, bass:m.mixB, drums:m.mixD, pad:m.mixP, wind:m.mixW });
  }, []);

  const regenerate = useCallback(async () => {
    if (!engineRef.current) return;
    const m = MODES[mode];
    buildSequences(engineRef.current, pc, scale, progIdx, m?.drum || "blast", m?.guitar || "tremolo");
  }, [pc, scale, progIdx, mode]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      if (engineRef.current) {
        Object.values(engineRef.current.sequences).forEach(s => { try{s.stop();}catch(e){} });
        if (engineRef.current.windStarted) {
          try { engineRef.current.instruments.wind.stop(); } catch(e){}
          engineRef.current.windStarted = false;
        }
      }
      setIsPlaying(false);
      return;
    }

    await Tone.start();
    Tone.getTransport().bpm.value = bpm;

    // Create or reuse engine
    if (!engineRef.current) {
      engineRef.current = createEngine();
    }

    const m = MODES[mode];
    buildSequences(engineRef.current, pc, scale, progIdx, m?.drum || "blast", m?.guitar || "tremolo");

    // Start wind
    if (!engineRef.current.windStarted) {
      engineRef.current.instruments.wind.start();
      engineRef.current.windStarted = true;
    }

    // Apply current mix immediately
    const { vols } = engineRef.current;
    vols.guitar.volume.value = mix.guitar > 0 ? -30 + mix.guitar * 30 : -Infinity;
    vols.bass.volume.value   = mix.bass > 0   ? -30 + mix.bass * 28   : -Infinity;
    vols.drums.volume.value  = mix.drums > 0  ? -28 + mix.drums * 26  : -Infinity;
    vols.pad.volume.value    = mix.pad > 0    ? -32 + mix.pad * 28    : -Infinity;
    vols.wind.volume.value   = mix.wind > 0   ? -35 + mix.wind * 25   : -Infinity;

    Tone.getTransport().start();
    setIsPlaying(true);
  }, [isPlaying, bpm, pc, scale, progIdx, mode, mix]);

  const handleModeChange = useCallback((modeName) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      if (engineRef.current) {
        Object.values(engineRef.current.sequences).forEach(s => { try{s.stop();}catch(e){} });
      }
    }
    applyMode(modeName);
    // Defer restart to allow state to settle
    if (wasPlaying) {
      setTimeout(async () => {
        const m = MODES[modeName];
        Tone.getTransport().bpm.value = m.bpm;
        if (engineRef.current) {
          buildSequences(engineRef.current, pc, scale, m.prog, m.drum, m.guitar);
          Tone.getTransport().start();
        }
      }, 100);
    }
  }, [isPlaying, pc, scale, applyMode]);

  // Subtle background pulse
  const pulseOpacity = isPlaying ? 0.03 + Math.sin(tick * 0.15) * 0.02 : 0.02;

  return (
    <div className="min-h-screen w-full relative overflow-hidden select-none"
      style={{background:"linear-gradient(170deg, #08090d 0%, #0d1117 30%, #101820 60%, #0a0f15 100%)"}}>

      {/* Floating particles */}
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{
            left:`${p.x}%`, top:`${p.y}%`,
            width: p.size, height: p.size,
            background: `radial-gradient(circle, rgba(140,170,210,${p.opacity}) 0%, transparent 70%)`,
            boxShadow: `0 0 ${p.size*4}px rgba(120,150,200,${p.opacity*0.5})`,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }} />
      ))}

      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 80%, rgba(40,70,120,${pulseOpacity}) 0%, transparent 60%)`,
        transition: "background 0.3s ease"
      }} />

      <style>{`
        @keyframes floatParticle {
          0% { transform: translate(0,0) scale(1); opacity: 0.3; }
          50% { transform: translate(${Math.random()>0.5?'':'-'}${10+Math.random()*30}px, -${20+Math.random()*40}px) scale(1.5); opacity: 0.7; }
          100% { transform: translate(${Math.random()>0.5?'':'-'}${5+Math.random()*20}px, ${10+Math.random()*20}px) scale(0.8); opacity: 0.2; }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #8ba3c4; border: 2px solid #4a5d78;
          cursor: pointer; box-shadow: 0 0 8px rgba(120,160,210,0.3);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #8ba3c4; border: 2px solid #4a5d78;
          cursor: pointer; box-shadow: 0 0 8px rgba(120,160,210,0.3);
        }
      `}</style>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 md:py-10 flex flex-col gap-5">

        {/* Title */}
        <div className="text-center mb-2">
          <div className="text-xs tracking-[0.4em] uppercase opacity-30 mb-2"
            style={{color:"#7a9cc4", fontFamily:"Georgia, 'Times New Roman', serif"}}>Procedural</div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-wide"
            style={{color:"#c5d5e8", fontFamily:"Georgia, 'Times New Roman', serif",
              textShadow:"0 0 30px rgba(100,140,200,0.15)"}}>
            Atmospheric Black Metal
          </h1>
          <div className="text-xs tracking-[0.35em] uppercase opacity-25 mt-1"
            style={{color:"#7a9cc4", fontFamily:"Georgia, 'Times New Roman', serif"}}>Generator</div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: isPlaying
                ? "linear-gradient(135deg, #3a1a1a, #5a2020)"
                : "linear-gradient(135deg, #1a2a3a, #2a4060)",
              border: `2px solid ${isPlaying ? "#8a4444" : "#4a6a8a"}`,
              boxShadow: isPlaying
                ? "0 0 20px rgba(180,80,80,0.2), inset 0 0 15px rgba(0,0,0,0.3)"
                : "0 0 20px rgba(80,120,180,0.15), inset 0 0 15px rgba(0,0,0,0.3)",
            }}>
            {isPlaying ? (
              <div className="flex gap-1.5">
                <div className="w-2 h-5 rounded-sm" style={{background:"#cc6666"}} />
                <div className="w-2 h-5 rounded-sm" style={{background:"#cc6666"}} />
              </div>
            ) : (
              <div className="w-0 h-0 ml-1"
                style={{borderTop:"10px solid transparent", borderBottom:"10px solid transparent", borderLeft:"16px solid #7aaad4"}} />
            )}
          </button>
          <button onClick={regenerate} disabled={!isPlaying}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #151d28, #1d2a38)",
              border: "1.5px solid #2a3a4a",
              opacity: isPlaying ? 1 : 0.35,
              cursor: isPlaying ? "pointer" : "default",
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6a8aaa" strokeWidth="2" strokeLinecap="round">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="rounded-xl p-3" style={{background:"rgba(15,20,30,0.6)", border:"1px solid rgba(60,80,110,0.15)"}}>
          <div className="text-xs tracking-[0.25em] uppercase opacity-30 mb-2.5 text-center" style={{color:"#7a9cc4"}}>Landscape</div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Object.keys(MODES).map(m => (
              <button key={m} onClick={() => handleModeChange(m)}
                className="px-3 py-1.5 rounded-lg text-xs tracking-wide transition-all duration-200"
                style={{
                  background: mode === m ? "linear-gradient(135deg, #1d3050, #2a4a6a)" : "rgba(20,28,40,0.5)",
                  border: `1px solid ${mode === m ? "#4a7aaa" : "rgba(50,65,85,0.3)"}`,
                  color: mode === m ? "#b8d0e8" : "#5a7090",
                  fontFamily: "Georgia, serif",
                  boxShadow: mode === m ? "0 0 12px rgba(60,100,160,0.15)" : "none",
                }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="rounded-xl p-4 flex flex-col gap-3.5"
          style={{background:"rgba(15,20,30,0.6)", border:"1px solid rgba(60,80,110,0.15)"}}>
          <div className="text-xs tracking-[0.25em] uppercase opacity-30 mb-1" style={{color:"#7a9cc4"}}>Parameters</div>

          <Slider label="BPM" icon="♩" value={bpm} onChange={setBpm} min={50} max={220} step={1} />

          <div className="flex gap-3 items-center">
            <span className="text-xs w-20 text-right opacity-60 shrink-0 tracking-wider" style={{color:"#8aa0b8"}}>♯ Key</span>
            <select value={rootNote} onChange={e=>setRootNote(e.target.value)}
              className="flex-1 rounded-lg px-2 py-1.5 text-xs"
              style={{background:"#151d28", color:"#8aaccc", border:"1px solid #2a3a4a", outline:"none"}}>
              {NOTE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={scale} onChange={e=>setScale(e.target.value)}
              className="flex-1 rounded-lg px-2 py-1.5 text-xs"
              style={{background:"#151d28", color:"#8aaccc", border:"1px solid #2a3a4a", outline:"none"}}>
              {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex gap-3 items-center">
            <span className="text-xs w-20 text-right opacity-60 shrink-0 tracking-wider" style={{color:"#8aa0b8"}}>⟲ Prog</span>
            <select value={progIdx} onChange={e=>setProgIdx(parseInt(e.target.value))}
              className="flex-1 rounded-lg px-2 py-1.5 text-xs"
              style={{background:"#151d28", color:"#8aaccc", border:"1px solid #2a3a4a", outline:"none"}}>
              {PROGRESSIONS.map((p,i) => {
                const degs = ["i","ii°","III","iv","v","VI","VII"];
                return <option key={i} value={i}>{p.map(d=>degs[d]).join(" → ")}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Mix */}
        <div className="rounded-xl p-4 flex flex-col gap-3"
          style={{background:"rgba(15,20,30,0.6)", border:"1px solid rgba(60,80,110,0.15)"}}>
          <div className="text-xs tracking-[0.25em] uppercase opacity-30 mb-1" style={{color:"#7a9cc4"}}>Mix</div>
          <Slider label="Guitar"  icon="🎸" value={mix.guitar} onChange={v=>setMix(m=>({...m,guitar:v}))} />
          <Slider label="Bass"    icon="𝄢"  value={mix.bass}   onChange={v=>setMix(m=>({...m,bass:v}))} />
          <Slider label="Drums"   icon="🥁" value={mix.drums}  onChange={v=>setMix(m=>({...m,drums:v}))} />
          <Slider label="Pad"     icon="🌊" value={mix.pad}    onChange={v=>setMix(m=>({...m,pad:v}))} />
          <Slider label="Wind"    icon="🌬" value={mix.wind}   onChange={v=>setMix(m=>({...m,wind:v}))} />
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="text-xs opacity-20 tracking-wider" style={{color:"#6a8aaa", fontFamily:"Georgia, serif"}}>
            {isPlaying ? `${rootNote} ${scale} · ${bpm} BPM · ${mode}` : "Silence before the storm"}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-2 opacity-15 text-xs" style={{color:"#5a7090"}}>
          Inspired by Agalloch · Harakiri for the Sky · Elderwind · Severoth
        </div>
      </div>
    </div>
  );
}
