import { useState, useEffect, useCallback, useRef } from "react";

/* ══════════════════════════════════════════════════════════
   FONTS & GLOBAL STYLES
══════════════════════════════════════════════════════════ */
(function injectGlobals() {
  if (document.getElementById("nw-globals")) return;
  const link = document.createElement("link");
  link.id = "nw-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Share+Tech+Mono&display=swap";
  document.head.appendChild(link);
  const style = document.createElement("style");
  style.id = "nw-globals";
  style.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes shieldPop{from{transform:scale(0) rotate(-20deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes kingBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @keyframes ripple{0%{transform:scale(1);opacity:1}100%{transform:scale(2.2);opacity:0}}
    @keyframes flashCell{0%{filter:brightness(1)}50%{filter:brightness(2.5)}100%{filter:brightness(1)}}
    @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    .su{animation:slideUp .22s ease both}
    .pu{animation:pulse 2s ease infinite}
    .kb{animation:kingBounce 1.8s ease infinite}
    .btn:hover{filter:brightness(1.2);transform:translateY(-1px)}
    .btn:active{transform:translateY(1px);filter:brightness(.9)}
    .btn{transition:all .15s ease;cursor:pointer}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:#07070f}
    ::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:2px}
  `;
  document.head.appendChild(style);
})();

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════ */
const C = {
  bg:      "#07070f",
  panel:   "#0d0d1e",
  surface: "#13132a",
  border:  "#1e1e3c",
  border2: "#2e2e5a",
  text:    "#e2e4f8",
  muted:   "#5a5a88",
  dim:     "#3a3a60",
  p1:      "#e04848",
  p2:      "#3d9de0",
  accent:  "#a855f7",
  gold:    "#e8b830",
  green:   "#34c47a",
  orange:  "#f07b30",
  font:    "'Cinzel', serif",
  mono:    "'Share Tech Mono', monospace",
};

/* ══════════════════════════════════════════════════════════
   CONSTANTS & DATA
══════════════════════════════════════════════════════════ */
const BS = 8;
const BUDGET = 16;
const MIN_PIECES = 4;
const MAX_PIECES = 8;
const DEPLOY_ROWS = { 1: [6, 7], 2: [0, 1] };

const UNIT_DEFS = {
  warrior: { moveRange: 3, attackRange: 1, cost: 3, name: "Warrior", glyph: "⚔", color: "#e04848", desc: "Move 3 · Attack 1", lore: "The vanguard that closes gaps before the enemy breathes." },
  mage:    { moveRange: 2, attackRange: 2, cost: 4, name: "Mage",    glyph: "✦", color: "#a855f7", desc: "Move 2 · Attack 2", lore: "Balance of reach and precision — fulcrum of every formation." },
  archer:  { moveRange: 1, attackRange: 3, cost: 5, name: "Archer",  glyph: "◎", color: "#34c47a", desc: "Move 1 · Attack 3", lore: "Patience made lethal. Three squares of ruin without a single step." },
};

const TERRAIN = {
  normal: { darkBg: "#192319", lightBg: "#c8ad68", icon: "",   label: "Ground",  tip: "No bonuses." },
  fire:   { darkBg: "#3e1006", lightBg: "#c8ad68", icon: "🔥", label: "Flame",   tip: "+1 Attack range for Warriors." },
  ice:    { darkBg: "#06123e", lightBg: "#c8ad68", icon: "❄",  label: "Frost",   tip: "+1 Attack range for Mages." },
  wind:   { darkBg: "#063e1a", lightBg: "#c8ad68", icon: "💨", label: "Gale",    tip: "+1 Move range for Archers." },
  earth:  { darkBg: "#3e2206", lightBg: "#c8ad68", icon: "⛰",  label: "Earth",   tip: "Landing here grants a shield." },
  nexus:  { darkBg: "#1a0438", lightBg: "#c8ad68", icon: "⚡", label: "Nexus",   tip: "Grants shields to ALL allies!" },
};

const SKINS = [
  { id: "default", name: "Default",  unlocked: true,  p1col: "#e04848", p2col: "#3d9de0" },
  { id: "shadow",  name: "Shadow",   unlocked: false, p1col: "#6a6a9a", p2col: "#2a4a6a" },
  { id: "inferno", name: "Inferno",  unlocked: false, p1col: "#e07830", p2col: "#30b8e0" },
  { id: "arcane",  name: "Arcane",   unlocked: false, p1col: "#9b10af", p2col: "#10af7b" },
  { id: "gold",    name: "Golden",   unlocked: false, p1col: "#d4a017", p2col: "#17a0d4" },
];

const INITIAL_CHALLENGES = [
  { id: "c1", label: "Win your first battle",           key: "wins",        goal: 1,  prog: 0, done: false },
  { id: "c2", label: "Capture 5 pieces in one game",    key: "capsGame",    goal: 5,  prog: 0, done: false },
  { id: "c3", label: "Archer captures 3 pieces total",  key: "archerCaps",  goal: 3,  prog: 0, done: false },
  { id: "c4", label: "Reach the Nexus tile 3 times",    key: "nexusVisits", goal: 3,  prog: 0, done: false },
  { id: "c5", label: "Win using 5 or more Warriors",    key: "warWin",      goal: 1,  prog: 0, done: false },
  { id: "c6", label: "Promote a piece to King",         key: "kings",       goal: 1,  prog: 0, done: false },
  { id: "c7", label: "Win 3 total matches",             key: "wins",        goal: 3,  prog: 0, done: false },
];

/* ══════════════════════════════════════════════════════════
   UTILITY
══════════════════════════════════════════════════════════ */
function seededRng(seed) {
  let s = ((seed * 1664525 + 1013904223) | 0) >>> 0 || 99991;
  return () => { s = (Math.imul(1664525, s) + 1013904223) | 0; return (s >>> 0) / 4294967296; };
}

function isDark(r, c) { return (r + c) % 2 === 1; }
function cloneBoard(b) { return b.map(row => row.map(p => p ? { ...p } : null)); }

function lsGet(k)     { try { return JSON.parse(localStorage.getItem("nw2_" + k)); } catch { return null; } }
function lsSave(k, v) { try { localStorage.setItem("nw2_" + k, JSON.stringify(v)); } catch {} }

function genTerrain(seed) {
  const rng = seededRng(seed);
  const t = Array.from({ length: BS }, () => Array(BS).fill("normal"));
  // Fixed nexus at centre-ish dark square
  t[3][4] = "nexus";
  for (const type of ["fire", "ice", "wind", "earth"]) {
    let n = 3, tries = 0;
    while (n && tries++ < 600) {
      const r = 1 + Math.floor(rng() * 6);
      const c = Math.floor(rng() * BS);
      if (isDark(r, c) && t[r][c] === "normal") { t[r][c] = type; n--; }
    }
  }
  return t;
}

function deploySquares(player) {
  return DEPLOY_ROWS[player].flatMap(r =>
    Array.from({ length: BS }, (_, c) => ({ r, c })).filter(({ r, c }) => isDark(r, c))
  );
}

function effectiveStats(piece, r, c, terrain) {
  const base = UNIT_DEFS[piece.type];
  let mov = base.moveRange + (piece.isKing ? 1 : 0);
  let atk = base.attackRange + (piece.isKing ? 1 : 0);
  const t = terrain[r]?.[c];
  if (t === "fire"  && piece.type === "warrior") atk++;
  if (t === "ice"   && piece.type === "mage")    atk++;
  if (t === "wind"  && piece.type === "archer")  mov++;
  return { mov, atk };
}

function getMovableSquares(board, piece, r, c, terrain) {
  const { mov } = effectiveStats(piece, r, c, terrain);
  const dirs = piece.isKing
    ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : piece.player === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  const squares = [];
  const visited = new Set([`${r},${c}`]);
  const queue = [{ r, c, steps: 0 }];
  while (queue.length) {
    const { r: cr, c: cc, steps } = queue.shift();
    if (steps >= mov) continue;
    for (const [dr, dc] of dirs) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nr >= BS || nc < 0 || nc >= BS) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key) || board[nr][nc]) continue;
      visited.add(key);
      squares.push({ r: nr, c: nc });
      queue.push({ r: nr, c: nc, steps: steps + 1 });
    }
  }
  return squares;
}

function getAttackSquares(board, piece, r, c, terrain) {
  const { atk } = effectiveStats(piece, r, c, terrain);
  const squares = [];
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    for (let s = 1; s <= atk; s++) {
      const nr = r + dr * s, nc = c + dc * s;
      if (nr < 0 || nr >= BS || nc < 0 || nc >= BS) break;
      const cell = board[nr][nc];
      if (cell) {
        if (cell.player !== piece.player && !cell.shield) squares.push({ r: nr, c: nc });
        break; // line-of-sight blocked regardless
      }
    }
  }
  return squares;
}

function playerHasActions(board, player, terrain) {
  for (let r = 0; r < BS; r++)
    for (let c = 0; c < BS; c++) {
      const p = board[r][c];
      if (!p || p.player !== player) continue;
      if (getMovableSquares(board, p, r, c, terrain).length > 0) return true;
      if (getAttackSquares(board, p, r, c, terrain).length > 0)  return true;
    }
  return false;
}

function countByPlayer(board) {
  let p1 = 0, p2 = 0;
  for (let r = 0; r < BS; r++)
    for (let c = 0; c < BS; c++) {
      const p = board[r][c];
      if (p) p.player === 1 ? p1++ : p2++;
    }
  return { p1, p2 };
}

function calcWinProb(board) {
  let s1 = 0, s2 = 0;
  for (let r = 0; r < BS; r++)
    for (let c = 0; c < BS; c++) {
      const p = board[r][c]; if (!p) continue;
      const w = UNIT_DEFS[p.type].moveRange + UNIT_DEFS[p.type].attackRange * 1.5 +
                (p.isKing ? 2 : 0) + (p.shield ? 0.5 : 0);
      p.player === 1 ? (s1 += w) : (s2 += w);
    }
  const t = s1 + s2;
  return t ? s1 / t : 0.5;
}

function buildEmptyStats(army) {
  const s = {};
  army.forEach((u, i) => {
    s[u.id] = { type: u.type, moves: 0, captures: 0, survived: false, becameKing: false, shielded: 0 };
  });
  return s;
}

/* ══════════════════════════════════════════════════════════
   SMALL UI COMPONENTS
══════════════════════════════════════════════════════════ */
function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "10px 0" }} />;
}

function Tag({ children, color = C.muted, bg }) {
  return (
    <span style={{
      fontFamily: C.mono, fontSize: 10, fontWeight: 700,
      background: bg || `${color}18`,
      border: `1px solid ${color}55`,
      color, borderRadius: 3, padding: "2px 7px",
    }}>{children}</span>
  );
}

function Btn({ onClick, children, variant = "normal", disabled, style: s }) {
  const variants = {
    normal:  { background: C.surface, border: `1px solid ${C.border2}`, color: C.text },
    primary: { background: `linear-gradient(135deg,${C.accent}cc,${C.accent}88)`, border: `1px solid ${C.accent}`, color: "#fff" },
    danger:  { background: "#3e0a0a", border: `1px solid ${C.p1}`, color: C.p1 },
    ghost:   { background: "transparent", border: `1px solid ${C.border}`, color: C.muted },
    gold:    { background: `linear-gradient(135deg,${C.gold}aa,${C.gold}66)`, border: `1px solid ${C.gold}`, color: "#1a1200" },
  };
  return (
    <button
      className="btn"
      disabled={!!disabled}
      onClick={onClick}
      style={{
        fontFamily: C.font, fontSize: 12, fontWeight: 600,
        borderRadius: 5, padding: "8px 16px", cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: 0.5, opacity: disabled ? 0.45 : 1,
        ...variants[variant], ...s,
      }}
    >{children}</button>
  );
}

function WinChart({ probs }) {
  const W = 200, H = 48;
  if (probs.length < 2) return (
    <div style={{ width: W, height: H, background: "#08081a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>Awaiting data…</span>
    </div>
  );
  const pts = probs.map((p, i) => `${(i / (probs.length - 1)) * W},${H - p * H}`).join(" ");
  const last = probs[probs.length - 1];
  return (
    <div>
      <svg width={W} height={H} style={{ display: "block", background: "#08081a", borderRadius: 4 }}>
        <defs>
          <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,${H} ${pts} ${W},${H}`} fill="url(#wgrad)" />
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={C.border} strokeDasharray="3,3" />
        <polyline points={pts} fill="none" stroke={C.accent} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={(probs.length - 1) / (probs.length - 1) * W} cy={H - last * H} r={3} fill={C.accent} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontFamily: C.mono, fontSize: 10, color: C.p1 }}>P1 {Math.round(last * 100)}%</span>
        <span style={{ fontFamily: C.mono, fontSize: 10, color: C.p2 }}>P2 {Math.round((1 - last) * 100)}%</span>
      </div>
    </div>
  );
}

function PieceGlyph({ piece, skinId = "default", sz = 42 }) {
  const skin = SKINS.find(s => s.id === skinId) || SKINS[0];
  const col  = piece.player === 1 ? skin.p1col : skin.p2col;
  const ud   = UNIT_DEFS[piece.type];
  const fs   = sz > 38 ? 20 : 15;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <span
        className={piece.isKing ? "kb" : "pu"}
        style={{ fontSize: fs, color: col, lineHeight: 1, textShadow: `0 0 10px ${col}cc, 0 0 24px ${col}44` }}
      >{ud.glyph}</span>
      {piece.isKing && (
        <span style={{ fontSize: 8, color: C.gold, lineHeight: 1, marginTop: 1 }}>♛</span>
      )}
      {piece.shield && (
        <span style={{ position: "absolute", top: 1, right: 1, fontSize: 9, animation: "shieldPop .3s ease" }}>🛡</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BOARD VIEW
══════════════════════════════════════════════════════════ */
function BoardView({ board, terrain, selected, hlMoves, hlAttacks, onCellClick, onHover, skinId = "default", cellSize = 50 }) {
  return (
    <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${BS},${cellSize}px)`, gap: 0, border: `2px solid ${C.border2}`, borderRadius: 3, overflow: "hidden", boxShadow: `0 0 40px #a855f720, 0 0 80px #00000060` }}>
      {Array.from({ length: BS * BS }, (_, i) => {
        const r = Math.floor(i / BS), c = i % BS;
        const dark   = isDark(r, c);
        const piece  = board[r][c];
        const isSel  = selected?.r === r && selected?.c === c;
        const isMov  = dark && hlMoves?.some(m => m.r === r && m.c === c);
        const isAtk  = dark && hlAttacks?.some(a => a.r === r && a.c === c);
        const td     = dark ? TERRAIN[terrain[r][c]] || TERRAIN.normal : null;
        let bg = dark ? (td?.darkBg || "#192319") : "#c8ad68";
        if (isSel)      bg = "#2e0d58";
        else if (isMov) bg = "#0c321a";
        else if (isAtk) bg = "#38080a";
        return (
          <div
            key={i}
            onClick={() => dark && onCellClick && onCellClick(r, c)}
            onMouseEnter={() => dark && onHover && onHover(r, c)}
            style={{
              width: cellSize, height: cellSize,
              background: bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", cursor: dark && onCellClick ? "pointer" : "default",
              border: isSel
                ? `1.5px solid ${C.accent}`
                : isMov ? `1px solid ${C.green}66`
                : isAtk ? `1px solid ${C.p1}88`
                : `1px solid ${dark ? "#111126" : "#bba050"}`,
              transition: "background .08s ease",
            }}
          >
            {/* Terrain icon */}
            {dark && td?.icon && (
              <span style={{ position: "absolute", fontSize: piece ? 8 : (cellSize > 44 ? 18 : 13), opacity: piece ? 0.3 : 0.55, pointerEvents: "none", top: piece ? 1 : "auto", left: piece ? 1 : "auto" }}>
                {td.icon}
              </span>
            )}
            {/* Move dot */}
            {isMov && !piece && (
              <div style={{ width: 13, height: 13, borderRadius: "50%", background: `${C.green}50`, border: `1px solid ${C.green}88` }} />
            )}
            {/* Attack ring */}
            {isAtk && piece && (
              <div style={{ position: "absolute", inset: 2, border: `2px solid ${C.p1}aa`, borderRadius: 2, pointerEvents: "none", boxShadow: `inset 0 0 8px ${C.p1}44` }} />
            )}
            {/* Piece */}
            {piece && <PieceGlyph piece={piece} skinId={skinId} sz={cellSize} />}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ARMY BUILDER SCREEN
══════════════════════════════════════════════════════════ */
function ArmyBuilder({ playerNum, onDone, savedComps, onSaveComp }) {
  const [army, setArmy] = useState([]);
  const spent = army.reduce((s, u) => s + UNIT_DEFS[u.type].cost, 0);
  const remaining = BUDGET - spent;

  function addUnit(type) {
    if (army.length >= MAX_PIECES) return;
    const cost = UNIT_DEFS[type].cost;
    if (remaining < cost) return;
    setArmy(prev => [...prev, { type, id: `${type}_${Date.now()}_${Math.random()}` }]);
  }

  function removeUnit(id) { setArmy(prev => prev.filter(u => u.id !== id)); }

  const counts = { warrior: 0, mage: 0, archer: 0 };
  army.forEach(u => counts[u.type]++);

  const canStart = army.length >= MIN_PIECES;

  function saveComp(name) {
    if (!name.trim()) return;
    onSaveComp({ name: name.trim(), army: army.map(u => u.type) });
  }

  function loadComp(comp) {
    const newArmy = [];
    let totalCost = 0;
    for (const type of comp.army) {
      const cost = UNIT_DEFS[type].cost;
      if (totalCost + cost <= BUDGET && newArmy.length < MAX_PIECES) {
        newArmy.push({ type, id: `${type}_${Date.now()}_${Math.random()}` });
        totalCost += cost;
      }
    }
    setArmy(newArmy);
  }

  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: C.font }}>
      <div style={{ maxWidth: 680, width: "100%" }} className="su">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>ARMY DRAFT — PLAYER {playerNum}</div>
          <h2 style={{ fontSize: 28, color: C.text, letterSpacing: 1 }}>Forge Your Legion</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Budget: <span style={{ color: C.gold, fontFamily: C.mono }}>{remaining}</span> / {BUDGET} remaining · {army.length} of {MAX_PIECES} max</p>
        </div>

        {/* Budget bar */}
        <div style={{ height: 5, background: C.border, borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(spent / BUDGET) * 100}%`, background: `linear-gradient(90deg,${C.green},${remaining < 3 ? C.p1 : C.accent})`, borderRadius: 3, transition: "width .25s ease" }} />
        </div>

        {/* Unit cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {Object.entries(UNIT_DEFS).map(([type, u]) => {
            const canAfford = remaining >= u.cost && army.length < MAX_PIECES;
            return (
              <div
                key={type}
                onClick={() => canAfford && addUnit(type)}
                style={{
                  background: canAfford ? C.surface : "#0a0a18",
                  border: `1px solid ${canAfford ? C.border2 : C.border}`,
                  borderRadius: 8, padding: 14, cursor: canAfford ? "pointer" : "not-allowed",
                  opacity: canAfford ? 1 : 0.45, transition: "all .15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 22, color: u.color, textShadow: `0 0 10px ${u.color}88` }}>{u.glyph}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{u.name}</div>
                    <Tag color={C.gold}>{u.cost} pts</Tag>
                  </div>
                  <div style={{ marginLeft: "auto", fontFamily: C.mono, fontSize: 18, color: u.color, fontWeight: 700 }}>×{counts[type]}</div>
                </div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginBottom: 4 }}>{u.desc}</div>
                <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.45 }}>{u.lore}</div>
              </div>
            );
          })}
        </div>

        {/* Current army roster */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.muted, fontFamily: C.mono, marginBottom: 10 }}>ROSTER</div>
          {army.length === 0 ? (
            <div style={{ color: C.dim, fontSize: 12, textAlign: "center", padding: "12px 0" }}>Click unit cards above to recruit.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {army.map(u => {
                const ud = UNIT_DEFS[u.type];
                return (
                  <div key={u.id} onClick={() => removeUnit(u.id)} title="Click to remove" style={{ background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .12s" }}>
                    <span style={{ color: ud.color, fontSize: 13 }}>{ud.glyph}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text }}>{ud.name}</span>
                    <span style={{ color: C.p1, fontSize: 10 }}>✕</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saved compositions */}
        {savedComps.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>SAVED COMPOSITIONS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {savedComps.map((comp, i) => (
                <button key={i} onClick={() => loadComp(comp)} className="btn" style={{ fontFamily: C.mono, fontSize: 11, background: C.surface, border: `1px solid ${C.border2}`, color: C.text, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>
                  {comp.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save / actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {showSave ? (
            <>
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (saveComp(saveName), setShowSave(false), setSaveName(""))}
                placeholder="Composition name…"
                style={{ fontFamily: C.mono, fontSize: 12, background: C.panel, border: `1px solid ${C.border2}`, color: C.text, borderRadius: 5, padding: "7px 12px", flex: 1, outline: "none" }}
                autoFocus
              />
              <Btn onClick={() => { saveComp(saveName); setShowSave(false); setSaveName(""); }}>Save</Btn>
              <Btn variant="ghost" onClick={() => setShowSave(false)}>Cancel</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" onClick={() => setShowSave(true)} disabled={army.length === 0}>Save Comp</Btn>
              <div style={{ marginLeft: "auto" }}>
                <Btn variant="primary" onClick={() => onDone(army)} disabled={!canStart}>
                  {canStart ? `Deploy ${army.length} Units →` : `Need ${MIN_PIECES - army.length} More`}
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DEPLOYMENT SCREEN
══════════════════════════════════════════════════════════ */
function DeployScreen({ playerNum, army, terrain, onDone, existingBoard }) {
  const board = existingBoard || Array.from({ length: BS }, () => Array(BS).fill(null));
  const [placed, setPlaced] = useState(cloneBoard(board));
  const [hand, setHand] = useState([...army]);
  const [selected, setSelected] = useState(null); // piece from hand
  const validSquares = deploySquares(playerNum);

  function clickCell(r, c) {
    if (!validSquares.find(sq => sq.r === r && sq.c === c)) return;
    if (selected) {
      if (placed[r][c]) return; // occupied
      const newBoard = cloneBoard(placed);
      newBoard[r][c] = { type: selected.type, player: playerNum, id: selected.id, isKing: false, shield: false };
      setPlaced(newBoard);
      setHand(prev => prev.filter(u => u.id !== selected.id));
      setSelected(null);
    } else if (placed[r][c] && placed[r][c].player === playerNum) {
      // pick back up
      const p = placed[r][c];
      const newBoard = cloneBoard(placed);
      newBoard[r][c] = null;
      setPlaced(newBoard);
      setHand(prev => [...prev, { type: p.type, id: p.id }]);
    }
  }

  const placedCount = army.length - hand.length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", gap: 24, alignItems: "flex-start", justifyContent: "center", padding: 24, fontFamily: C.font, flexWrap: "wrap" }}>
      <div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.muted, fontFamily: C.mono, marginBottom: 4 }}>DEPLOYMENT — PLAYER {playerNum}</div>
          <h2 style={{ fontSize: 22, color: C.text }}>Place Your Forces</h2>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{placedCount} / {army.length} placed · {hand.length > 0 ? "Select a unit, then click a highlighted square." : "All units placed!"}</p>
        </div>
        <BoardView
          board={placed}
          terrain={terrain}
          selected={null}
          hlMoves={validSquares}
          hlAttacks={[]}
          onCellClick={clickCell}
          skinId="default"
          cellSize={48}
        />
      </div>

      <div style={{ width: 220 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: C.muted, fontFamily: C.mono, marginBottom: 10 }}>HAND</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {hand.length === 0 ? (
            <div style={{ color: C.dim, fontSize: 12 }}>All units deployed.</div>
          ) : (
            hand.map(u => {
              const ud = UNIT_DEFS[u.type];
              const isSel = selected?.id === u.id;
              return (
                <div key={u.id} onClick={() => setSelected(isSel ? null : u)} style={{ background: isSel ? `${C.accent}22` : C.surface, border: `1px solid ${isSel ? C.accent : C.border2}`, borderRadius: 6, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all .12s" }}>
                  <span style={{ fontSize: 18, color: ud.color, textShadow: `0 0 8px ${ud.color}88` }}>{ud.glyph}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ud.name}</div>
                    <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>{ud.desc}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Terrain legend */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>TERRAIN</div>
          {Object.entries(TERRAIN).map(([type, td]) => td.icon ? (
            <div key={type} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 13 }}>{td.icon}</span>
              <div>
                <span style={{ fontSize: 11, color: C.text, fontFamily: C.mono }}>{td.label}</span>
                <div style={{ fontSize: 10, color: C.muted }}>{td.tip}</div>
              </div>
            </div>
          ) : null)}
        </div>

        <Btn variant="primary" style={{ width: "100%" }} disabled={hand.length > 0} onClick={() => onDone(placed)}>
          {hand.length > 0 ? `Place ${hand.length} More` : "Confirm Deployment →"}
        </Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN GAME SCREEN
══════════════════════════════════════════════════════════ */
function GameScreen({ board: initialBoard, terrain, p1Army, p2Army, skinId = "default", onGameEnd, isSpectator = false }) {
  const [board, setBoard] = useState(cloneBoard(initialBoard));
  const [turn, setTurn]   = useState(1);
  const [selected, setSel]         = useState(null);
  const [hlMoves, setHlMoves]      = useState([]);
  const [hlAttacks, setHlAttacks]  = useState([]);
  const [log, setLog]              = useState([]);
  const [winner, setWinner]        = useState(null);
  const [winProbs, setWinProbs]    = useState([0.5]);
  const [stats, setStats]          = useState({ 1: buildEmptyStats(p1Army), 2: buildEmptyStats(p2Army) });
  const [nexusHolder, setNexusHolder] = useState(null);

  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  const addLog = useCallback((msg) => setLog(prev => [...prev.slice(-80), msg]), []);

  function highlight(r, c, b = board, t = terrain) {
    const p = b[r][c];
    if (!p || p.player !== turn) return;
    setSel({ r, c });
    setHlMoves(getMovableSquares(b, p, r, c, t));
    setHlAttacks(getAttackSquares(b, p, r, c, t));
  }

  function clearSel() { setSel(null); setHlMoves([]); setHlAttacks([]); }

  function checkWinner(b) {
    const { p1, p2 } = countByPlayer(b);
    if (p1 === 0) return 2;
    if (p2 === 0) return 1;
    if (!playerHasActions(b, 1, terrain)) return 2;
    if (!playerHasActions(b, 2, terrain)) return 1;
    return null;
  }

  function advanceTurn(newBoard) {
    const w = checkWinner(newBoard);
    const prob = calcWinProb(newBoard);
    setWinProbs(prev => [...prev, prob]);
    if (w) {
      setWinner(w);
      // Tally survivor stats
      setStats(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        for (let r = 0; r < BS; r++)
          for (let c = 0; c < BS; c++) {
            const p = newBoard[r][c];
            if (!p) continue;
            const key = p.id;
            if (next[p.player]?.[key]) next[p.player][key].survived = true;
          }
        return next;
      });
      addLog(`⚡ Player ${w} wins the battle!`);
      setTimeout(() => onGameEnd && onGameEnd(w, stats), 1200);
      return;
    }
    setTurn(t => (t === 1 ? 2 : 1));
  }

  function handleCellClick(r, c) {
    if (winner || isSpectator) return;
    const piece = board[r][c];

    if (selected) {
      const isMov = hlMoves.some(m => m.r === r && m.c === c);
      const isAtk = hlAttacks.some(a => a.r === r && a.c === c);

      if (isMov) {
        // Move
        const newBoard = cloneBoard(board);
        const p = { ...newBoard[selected.r][selected.c] };
        newBoard[selected.r][selected.c] = null;
        p.shield = false;
        // Terrain shield
        const t = terrain[r][c];
        if (t === "earth") { p.shield = true; addLog(`🛡 P${p.player} piece gains Earth Shield!`); }
        if (t === "nexus") {
          // Shield all allies
          for (let rr = 0; rr < BS; rr++)
            for (let cc = 0; cc < BS; cc++)
              if (newBoard[rr][cc]?.player === p.player) newBoard[rr][cc].shield = true;
          addLog(`⚡ P${p.player} captures the Nexus! All allies shielded!`);
          setNexusHolder(p.player);
        }
        newBoard[r][c] = p;
        // King promotion
        if (!p.isKing && ((p.player === 1 && r === 0) || (p.player === 2 && r === 7))) {
          newBoard[r][c].isKing = true;
          addLog(`♛ P${p.player} piece promoted to King!`);
          setStats(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            if (next[p.player]?.[p.id]) next[p.player][p.id].becameKing = true;
            return next;
          });
        }
        setStats(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          if (next[p.player]?.[p.id]) next[p.player][p.id].moves++;
          return next;
        });
        setBoard(newBoard);
        clearSel();
        addLog(`P${p.player} ${UNIT_DEFS[p.type].name} moves to (${r},${c}).`);
        advanceTurn(newBoard);
        return;
      }

      if (isAtk) {
        // Attack
        const newBoard = cloneBoard(board);
        const attacker = { ...newBoard[selected.r][selected.c] };
        const target   = { ...newBoard[r][c] };
        newBoard[r][c] = null;
        addLog(`⚔ P${attacker.player} ${UNIT_DEFS[attacker.type].name} captures P${target.player} ${UNIT_DEFS[target.type].name}!`);
        setStats(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          if (next[attacker.player]?.[attacker.id]) {
            next[attacker.player][attacker.id].captures++;
          }
          return next;
        });
        setBoard(newBoard);
        clearSel();
        advanceTurn(newBoard);
        return;
      }

      // Click own piece — reselect
      if (piece?.player === turn) { highlight(r, c); return; }
      clearSel();
      return;
    }

    if (piece?.player === turn) highlight(r, c);
  }

  function handleHover(r, c) {
    if (selected) return;
    const piece = board[r][c];
    if (!piece) { setHlMoves([]); setHlAttacks([]); return; }
    setHlMoves(getMovableSquares(board, piece, r, c, terrain));
    setHlAttacks(getAttackSquares(board, piece, r, c, terrain));
  }

  const { p1, p2 } = countByPlayer(board);
  const prob = winProbs[winProbs.length - 1];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", gap: 18, alignItems: "flex-start", justifyContent: "center", padding: "20px 16px", fontFamily: C.font, flexWrap: "wrap" }}>
      {/* Left panel */}
      <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Turn indicator */}
        <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>TURN</div>
          {[1, 2].map(pl => (
            <div key={pl} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 5, background: turn === pl && !winner ? (pl === 1 ? `${C.p1}18` : `${C.p2}18`) : "transparent", border: turn === pl && !winner ? `1px solid ${pl === 1 ? C.p1 : C.p2}55` : "1px solid transparent", marginBottom: 4, transition: "all .2s" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: pl === 1 ? C.p1 : C.p2, boxShadow: turn === pl ? `0 0 8px ${pl === 1 ? C.p1 : C.p2}` : "none" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: turn === pl ? C.text : C.muted }}>Player {pl}</span>
              <span style={{ marginLeft: "auto", fontFamily: C.mono, fontSize: 11, color: pl === 1 ? C.p1 : C.p2 }}>{pl === 1 ? p1 : p2} ▲</span>
            </div>
          ))}
        </div>

        {/* Win probability chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>WIN PROBABILITY</div>
          <WinChart probs={winProbs} />
        </div>

        {/* Nexus control */}
        {nexusHolder && (
          <div style={{ background: "#1a0438", border: `1px solid ${C.accent}55`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.accent, fontFamily: C.mono, marginBottom: 4 }}>NEXUS CONTROL</div>
            <div style={{ fontSize: 12, color: C.text }}>⚡ Player {nexusHolder} holds the Nexus</div>
          </div>
        )}

        {/* Terrain legend */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>TERRAIN</div>
          {Object.entries(TERRAIN).map(([type, td]) => td.icon ? (
            <div key={type} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 12 }}>{td.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: C.text, fontFamily: C.mono }}>{td.label}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{td.tip}</div>
              </div>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Board */}
      <div>
        {winner && (
          <div style={{ textAlign: "center", marginBottom: 12, padding: "12px 24px", background: `${winner === 1 ? C.p1 : C.p2}22`, border: `1px solid ${winner === 1 ? C.p1 : C.p2}55`, borderRadius: 8 }} className="su">
            <div style={{ fontSize: 22, fontWeight: 700, color: winner === 1 ? C.p1 : C.p2 }}>
              ⚡ Player {winner} Victorious!
            </div>
          </div>
        )}
        {isSpectator && !winner && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <Tag color={C.gold}>SPECTATOR MODE</Tag>
          </div>
        )}
        <BoardView
          board={board}
          terrain={terrain}
          selected={selected}
          hlMoves={hlMoves}
          hlAttacks={hlAttacks}
          onCellClick={handleCellClick}
          onHover={handleHover}
          skinId={skinId}
          cellSize={50}
        />
      </div>

      {/* Right panel */}
      <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Move log */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>BATTLE LOG</div>
          <div ref={logRef} style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            {log.length === 0 ? <div style={{ color: C.dim, fontSize: 11 }}>No actions yet.</div> : null}
            {log.map((entry, i) => (
              <div key={i} style={{ fontSize: 10, color: C.text, fontFamily: C.mono, lineHeight: 1.5, borderLeft: `2px solid ${C.border2}`, paddingLeft: 6 }}>{entry}</div>
            ))}
          </div>
        </div>

        {/* Unit info for selected */}
        {selected && board[selected.r][selected.c] && (() => {
          const p = board[selected.r][selected.c];
          const ud = UNIT_DEFS[p.type];
          const { mov, atk } = effectiveStats(p, selected.r, selected.c, terrain);
          return (
            <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 8, padding: 12 }} className="su">
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.muted, fontFamily: C.mono, marginBottom: 8 }}>SELECTED UNIT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 24, color: ud.color, textShadow: `0 0 10px ${ud.color}88` }}>{ud.glyph}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ud.name}</div>
                  <Tag color={p.player === 1 ? C.p1 : C.p2}>Player {p.player}</Tag>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[["Move", mov, C.green], ["Atk Rng", atk, C.p1], ["Shield", p.shield ? "Yes" : "No", p.shield ? C.gold : C.muted], ["King", p.isKing ? "Yes" : "No", p.isKing ? C.gold : C.muted]].map(([label, val, col]) => (
                  <div key={label} style={{ background: C.panel, borderRadius: 4, padding: "5px 8px" }}>
                    <div style={{ fontSize: 9, color: C.muted, fontFamily: C.mono }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: col, fontFamily: C.mono }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selected && <Btn variant="ghost" style={{ width: "100%" }} onClick={clearSel}>Deselect</Btn>}
          {!winner && !isSpectator && (
            <Btn variant="danger" style={{ width: "100%" }} onClick={() => { setWinner(turn === 1 ? 2 : 1); addLog(`P${turn} resigned.`); }}>Resign</Btn>
          )}
          {winner && <Btn variant="primary" style={{ width: "100%" }} onClick={() => onGameEnd && onGameEnd(winner, stats)}>View Results →</Btn>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   POST-MATCH SCREEN
══════════════════════════════════════════════════════════ */
function PostMatchScreen({ winner, stats, p1Army, p2Army, onRematch, onMenu, challenges, onUpdateChallenges }) {
  // Compute totals
  const totals = {};
  [1, 2].forEach(pl => {
    const army = pl === 1 ? p1Army : p2Army;
    let moves = 0, captures = 0, survived = 0, kings = 0;
    army.forEach(u => {
      const s = stats[pl]?.[u.id];
      if (s) { moves += s.moves; captures += s.captures; if (s.survived) survived++; if (s.becameKing) kings++; }
    });
    totals[pl] = { moves, captures, survived, kings, size: army.length };
  });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: C.font }}>
      <div style={{ maxWidth: 680, width: "100%" }} className="su">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.muted, fontFamily: C.mono, marginBottom: 6 }}>BATTLE COMPLETE</div>
          <h2 style={{ fontSize: 32, color: winner === 1 ? C.p1 : C.p2, textShadow: `0 0 24px ${winner === 1 ? C.p1 : C.p2}88` }}>
            {winner === 1 ? "Player 1 Victorious" : "Player 2 Victorious"}
          </h2>
        </div>

        {/* Stats comparison */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {[1, 2].map(pl => {
            const t = totals[pl];
            const col = pl === 1 ? C.p1 : C.p2;
            return (
              <div key={pl} style={{ background: winner === pl ? `${col}12` : C.surface, border: `1px solid ${winner === pl ? col : C.border}55`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: col, fontFamily: C.mono, marginBottom: 10 }}>
                  {winner === pl ? "⚡ " : ""}PLAYER {pl}
                </div>
                {[["Pieces Deployed", t.size], ["Captures Made", t.captures], ["Total Moves", t.moves], ["Survivors", t.survived], ["Kings Promoted", t.kings]].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{label}</span>
                    <span style={{ fontFamily: C.mono, fontWeight: 700, color: C.text }}>{val}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Unit breakdown */}
        {[1, 2].map(pl => {
          const army = pl === 1 ? p1Army : p2Army;
          const col = pl === 1 ? C.p1 : C.p2;
          return (
            <div key={pl} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: col, fontFamily: C.mono, marginBottom: 8 }}>P{pl} UNIT BREAKDOWN</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {army.map(u => {
                  const s = stats[pl]?.[u.id];
                  const ud = UNIT_DEFS[u.type];
                  return s ? (
                    <div key={u.id} style={{ background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 5, padding: "6px 10px", fontSize: 11 }}>
                      <span style={{ color: ud.color }}>{ud.glyph} </span>
                      <span style={{ color: C.muted, fontFamily: C.mono }}>
                        M:{s.moves} C:{s.captures} {s.survived ? "✓" : "✗"}{s.becameKing ? " ♛" : ""}
                      </span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="ghost" onClick={onMenu}>Main Menu</Btn>
          <Btn variant="primary" onClick={onRematch}>Rematch (New Map) →</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LEADERBOARD SCREEN
══════════════════════════════════════════════════════════ */
function LeaderboardScreen({ onBack }) {
  const lb = lsGet("leaderboard") || [];
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: C.font }}>
      <div style={{ maxWidth: 500, width: "100%" }} className="su">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.muted, fontFamily: C.mono, marginBottom: 6 }}>SEASON I</div>
          <h2 style={{ fontSize: 28, color: C.text }}>Leaderboard</h2>
        </div>
        {lb.length === 0 ? (
          <div style={{ textAlign: "center", color: C.muted, padding: "40px 0", fontSize: 14 }}>No records yet. Win some matches!</div>
        ) : (
          lb.slice(0, 10).map((entry, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.surface, border: `1px solid ${i < 3 ? C.gold : C.border}44`, borderRadius: 6, marginBottom: 6 }}>
              <span style={{ fontFamily: C.mono, fontSize: 14, color: i === 0 ? C.gold : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : C.muted, width: 24, textAlign: "center" }}>{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 600, color: C.text }}>{entry.name || "Anonymous"}</span>
              <Tag color={C.green}>{entry.wins}W</Tag>
              <Tag color={C.p1}>{entry.captures} caps</Tag>
            </div>
          ))
        )}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHALLENGES SCREEN
══════════════════════════════════════════════════════════ */
function ChallengesScreen({ challenges, onBack }) {
  const done = challenges.filter(c => c.done).length;
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: C.font }}>
      <div style={{ maxWidth: 500, width: "100%" }} className="su">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.muted, fontFamily: C.mono, marginBottom: 6 }}>DAILY TACTICS</div>
          <h2 style={{ fontSize: 28, color: C.text }}>Challenges</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>{done} / {challenges.length} completed</p>
        </div>
        {challenges.map(ch => (
          <div key={ch.id} style={{ background: C.surface, border: `1px solid ${ch.done ? C.green : C.border}44`, borderRadius: 8, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{ch.done ? "✅" : "⬜"}</span>
              <span style={{ flex: 1, fontSize: 13, color: ch.done ? C.green : C.text, fontWeight: ch.done ? 700 : 400 }}>{ch.label}</span>
              <Tag color={ch.done ? C.green : C.muted}>{Math.min(ch.prog, ch.goal)}/{ch.goal}</Tag>
            </div>
            <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (ch.prog / ch.goal) * 100)}%`, background: ch.done ? C.green : C.accent, borderRadius: 2, transition: "width .4s ease" }} />
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SKINS SCREEN
══════════════════════════════════════════════════════════ */
function SkinsScreen({ skins, onBack }) {
  const previewPiece = (type, player, skinId) => ({
    type, player, id: "preview", isKing: false, shield: false,
  });
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: C.font }}>
      <div style={{ maxWidth: 600, width: "100%" }} className="su">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.muted, fontFamily: C.mono, marginBottom: 6 }}>COSMETICS</div>
          <h2 style={{ fontSize: 28, color: C.text }}>Unit Skins</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {skins.map(skin => (
            <div key={skin.id} style={{ background: C.surface, border: `1px solid ${skin.unlocked ? C.border2 : C.border}`, borderRadius: 10, padding: 16, opacity: skin.unlocked ? 1 : 0.6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, background: C.panel, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PieceGlyph piece={{ type: "warrior", player: 1, id: "p", isKing: false, shield: false }} skinId={skin.id} sz={36} />
                </div>
                <div style={{ width: 36, height: 36, background: C.panel, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PieceGlyph piece={{ type: "mage", player: 2, id: "p", isKing: false, shield: false }} skinId={skin.id} sz={36} />
                </div>
                <div style={{ marginLeft: 8 }}>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{skin.name}</div>
                  {skin.unlocked ? <Tag color={C.green}>Unlocked</Tag> : <Tag color={C.muted}>Locked</Tag>}
                </div>
              </div>
              {!skin.unlocked && (
                <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }}>Complete challenges to unlock</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN MENU
══════════════════════════════════════════════════════════ */
function MainMenu({ onPlay, onSpectate, onLB, onChallenges, onSkins, challenges }) {
  const done = challenges.filter(c => c.done).length;
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: C.font }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }} className="su">
        {/* Logo */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 64, filter: "drop-shadow(0 0 24px #a855f7bb)", marginBottom: 4 }}>⚡</div>
          <h1 style={{ fontSize: 42, letterSpacing: 2, color: C.text, lineHeight: 1 }}>NEXUS WAR</h1>
          <div style={{ fontSize: 11, letterSpacing: 5, color: C.accent, fontFamily: C.mono, marginTop: 6 }}>TACTICAL DOMINION</div>
        </div>

        <p style={{ color: C.muted, fontSize: 13, maxWidth: 360, margin: "20px auto 32px", lineHeight: 1.7 }}>
          Draft your army. Master the terrain. Capture the Nexus.<br />
          Warriors close distance. Mages balance reach. Archers reign from afar.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 280, margin: "0 auto 28px" }}>
          <Btn variant="primary" style={{ fontSize: 15, padding: "12px 24px" }} onClick={onPlay}>⚔ New Battle</Btn>
          <Btn variant="normal" onClick={onSpectate}>👁 Spectator Mode</Btn>
          <Btn variant="ghost" onClick={onLB}>🏆 Leaderboard</Btn>
          <Btn variant="ghost" onClick={onChallenges}>
            📋 Challenges {done > 0 ? `(${done}/${challenges.length})` : ""}
          </Btn>
          <Btn variant="ghost" onClick={onSkins}>🎨 Skins</Btn>
        </div>

        {/* Unit guide */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {Object.entries(UNIT_DEFS).map(([type, u]) => (
            <div key={type} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
              <span style={{ fontSize: 22, color: u.color, textShadow: `0 0 12px ${u.color}88` }}>{u.glyph}</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 4 }}>{u.name}</div>
              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginTop: 2 }}>{u.desc}</div>
              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.gold, marginTop: 4 }}>{u.cost} pts</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, fontSize: 10, color: C.dim, fontFamily: C.mono }}>
          Budget {BUDGET}pts · {MIN_PIECES}-{MAX_PIECES} units · Elemental terrain · Nexus shields
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("menu");
  const [phase,  setPhase]  = useState(null); // army1, deploy1, army2, deploy2, game, postgame
  const [mapSeed, setMapSeed] = useState(() => Date.now() % 999983);
  const [terrain, setTerrain] = useState(() => genTerrain(Date.now() % 999983));
  const [p1Army,  setP1Army]  = useState([]);
  const [p2Army,  setP2Army]  = useState([]);
  const [gameBoard, setGameBoard] = useState(null);
  const [postWinner, setPostWinner] = useState(null);
  const [postStats,  setPostStats]  = useState(null);
  const [savedComps, setSavedComps] = useState(() => lsGet("comps") || []);
  const [challenges, setChallenges] = useState(() => lsGet("challenges") || INITIAL_CHALLENGES);
  const [skins,      setSkins]      = useState(() => lsGet("skins") || SKINS);
  const [isSpectator, setIsSpectator] = useState(false);

  function saveComp(comp) {
    const next = [...savedComps.filter(c => c.name !== comp.name), comp];
    setSavedComps(next);
    lsSave("comps", next);
  }

  function updateChallenges(matchData) {
    setChallenges(prev => {
      const next = prev.map(ch => {
        if (ch.done) return ch;
        let prog = ch.prog;
        if (ch.key === "wins"       && matchData.winner === matchData.myPlayer) prog = Math.min(ch.goal, prog + 1);
        if (ch.key === "capsGame"   && matchData.captures >= ch.goal)           prog = Math.min(ch.goal, matchData.captures);
        if (ch.key === "archerCaps" && matchData.archerCaps > 0)               prog = Math.min(ch.goal, prog + matchData.archerCaps);
        if (ch.key === "nexusVisits" && matchData.nexusVisits > 0)             prog = Math.min(ch.goal, prog + matchData.nexusVisits);
        if (ch.key === "warWin"     && matchData.warWin)                        prog = 1;
        if (ch.key === "kings"      && matchData.kings > 0)                     prog = Math.min(ch.goal, prog + matchData.kings);
        return { ...ch, prog, done: prog >= ch.goal };
      });
      lsSave("challenges", next);
      return next;
    });
  }

  function startNewGame() {
    const seed = Date.now() % 999983;
    setMapSeed(seed);
    setTerrain(genTerrain(seed));
    setP1Army([]); setP2Army([]);
    setGameBoard(null);
    setIsSpectator(false);
    setPhase("army1");
    setScreen("game-flow");
  }

  function startSpectator() {
    // Auto-generate a game for spectating (vs AI placeholder — just auto-deploy)
    const seed = Date.now() % 999983;
    setMapSeed(seed);
    const t = genTerrain(seed);
    setTerrain(t);
    const makeArmy = (player) => {
      const types = ["warrior","warrior","mage","archer","warrior","mage"];
      return types.map((type, i) => ({ type, id: `${type}_${player}_${i}`, player }));
    };
    const a1 = makeArmy(1);
    const a2 = makeArmy(2);
    setP1Army(a1); setP2Army(a2);
    const board = Array.from({ length: BS }, () => Array(BS).fill(null));
    const deploy = (army, player) => {
      const squares = deploySquares(player);
      army.forEach((u, i) => {
        if (squares[i]) board[squares[i].r][squares[i].c] = { ...u, player, isKing: false, shield: false };
      });
    };
    deploy(a1, 1); deploy(a2, 2);
    setGameBoard(board);
    setIsSpectator(true);
    setScreen("playing");
  }

  function onP1ArmyDone(army) {
    setP1Army(army.map((u, i) => ({ ...u, id: u.id || `${u.type}_1_${i}` })));
    setPhase("deploy1");
  }

  function onP1DeployDone(board) {
    setGameBoard(board);
    setPhase("army2");
  }

  function onP2ArmyDone(army) {
    setP2Army(army.map((u, i) => ({ ...u, id: u.id || `${u.type}_2_${i}` })));
    setPhase("deploy2");
  }

  function onP2DeployDone(board) {
    setGameBoard(board);
    setPhase(null);
    setScreen("playing");
  }

  function onGameEnd(winner, stats) {
    setPostWinner(winner);
    setPostStats(stats);
    // Update leaderboard
    const lb = lsGet("leaderboard") || [];
    const entry = lb.find(e => e.name === `Player ${winner}`) || { name: `Player ${winner}`, wins: 0, captures: 0 };
    let totalCaps = 0;
    Object.values(stats[winner] || {}).forEach(s => { totalCaps += s.captures || 0; });
    const updated = { ...entry, wins: entry.wins + 1, captures: entry.captures + totalCaps };
    const newLb = [updated, ...lb.filter(e => e.name !== updated.name)].sort((a, b) => b.wins - a.wins);
    lsSave("leaderboard", newLb);
    setScreen("postgame");
  }

  function onRematch() {
    const seed = Date.now() % 999983;
    setMapSeed(seed);
    setTerrain(genTerrain(seed));
    setP1Army([]); setP2Army([]);
    setGameBoard(null);
    setPhase("army1");
    setScreen("game-flow");
  }

  // ── RENDER ──
  if (screen === "menu") return (
    <MainMenu
      onPlay={startNewGame}
      onSpectate={startSpectator}
      onLB={() => setScreen("leaderboard")}
      onChallenges={() => setScreen("challenges")}
      onSkins={() => setScreen("skins")}
      challenges={challenges}
    />
  );

  if (screen === "leaderboard") return <LeaderboardScreen onBack={() => setScreen("menu")} />;
  if (screen === "challenges")  return <ChallengesScreen challenges={challenges} onBack={() => setScreen("menu")} />;
  if (screen === "skins")       return <SkinsScreen skins={skins} onBack={() => setScreen("menu")} />;

  if (screen === "game-flow") {
    if (phase === "army1") return (
      <ArmyBuilder
        playerNum={1}
        onDone={onP1ArmyDone}
        savedComps={savedComps}
        onSaveComp={saveComp}
      />
    );
    if (phase === "deploy1") return (
      <DeployScreen
        playerNum={1}
        army={p1Army}
        terrain={terrain}
        onDone={onP1DeployDone}
        existingBoard={null}
      />
    );
    if (phase === "army2") return (
      <ArmyBuilder
        playerNum={2}
        onDone={onP2ArmyDone}
        savedComps={savedComps}
        onSaveComp={saveComp}
      />
    );
    if (phase === "deploy2") return (
      <DeployScreen
        playerNum={2}
        army={p2Army}
        terrain={terrain}
        onDone={onP2DeployDone}
        existingBoard={gameBoard}
      />
    );
    return <div style={{ color: C.text, padding: 40 }}>Loading…</div>;
  }

  if (screen === "playing") return (
    <GameScreen
      board={gameBoard}
      terrain={terrain}
      p1Army={p1Army}
      p2Army={p2Army}
      skinId="default"
      onGameEnd={onGameEnd}
      isSpectator={isSpectator}
    />
  );

  if (screen === "postgame") return (
    <PostMatchScreen
      winner={postWinner}
      stats={postStats}
      p1Army={p1Army}
      p2Army={p2Army}
      onRematch={onRematch}
      onMenu={() => setScreen("menu")}
      challenges={challenges}
      onUpdateChallenges={updateChallenges}
    />
  );

  return null;
}
