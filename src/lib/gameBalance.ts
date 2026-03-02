/**
 * Business Logic & Balancing — Tech-T2 Systems Engineering
 *
 * Defines logic rules, progression pacing, edge-case handling, and the
 * simulation plan for Catalog of Futility's value economy.
 *
 * Value types covered : credits · points · status · access levels
 * Key concerns        : feature unlocks, prerequisite gates, fairness rules,
 *                       anti-exploit constraints, and parameter tuning guides.
 */

// ---------------------------------------------------------------------------
// 1. VALUE TYPES
// ---------------------------------------------------------------------------

/** All discrete value types tracked per user session. */
export type ValueType = "credits" | "points" | "status" | "access";

/** Canonical ranges for each value type. */
export const VALUE_RANGES = {
  /** Sanity / energy economy. Floor 0 = game over; ceiling 120 = hard cap. */
  credits: { min: 0, max: 120, default: 100 },
  /** Cumulative survival score, unbounded. Used for leaderboards. */
  points: { min: 0, max: Infinity, default: 0 },
  /** Ordinal tier (0 = new → 4 = veteran). Drives cosmetic unlocks. */
  status: { min: 0, max: 4, default: 0 },
  /** Bitmask of feature flags. Each bit = one gated feature. */
  access: { min: 0b00000, max: 0b11111, default: 0b00000 },
} as const;

// ---------------------------------------------------------------------------
// 2. SOURCES & SINKS TABLE
// ---------------------------------------------------------------------------

export interface ValueEvent {
  id: string;
  type: ValueType;
  /** Positive = source (gain). Negative = sink (loss). */
  delta: number | "variable";
  trigger: string;
  cooldown?: number; // ms; undefined = no cooldown
  prerequisites?: string[];
}

/** Exhaustive table of every way values enter or leave the economy. */
export const VALUE_EVENTS: ValueEvent[] = [
  // ── CREDIT SOURCES ──────────────────────────────────────────────────────
  {
    id: "daily_login",
    type: "credits",
    delta: 10,
    trigger: "User opens app after 24 h absence",
    cooldown: 86_400_000,
  },
  {
    id: "hourly_focus",
    type: "credits",
    delta: 3,
    trigger: "User stays active for 60 consecutive minutes",
    cooldown: 3_600_000,
  },
  {
    id: "weekly_survival",
    type: "credits",
    delta: 50,
    trigger: "7-day login streak completed",
    cooldown: 604_800_000,
  },
  {
    id: "correct_answer",
    type: "credits",
    delta: 0,
    trigger: "NPC question answered correctly (no penalty applied)",
  },
  {
    id: "item_pickup",
    type: "credits",
    delta: "variable", // 15–72 depending on rarity × dangerLevel
    trigger: "Special item discovered during location visit",
  },
  {
    id: "streak_bonus_3",
    type: "credits",
    delta: 15,
    trigger: "3-day consecutive login streak",
    prerequisites: ["daysSurvived >= 3"],
  },
  {
    id: "streak_bonus_7",
    type: "credits",
    delta: 30,
    trigger: "7-day consecutive login streak",
    prerequisites: ["daysSurvived >= 7"],
  },
  {
    id: "streak_bonus_14",
    type: "credits",
    delta: 50,
    trigger: "14-day consecutive login streak",
    prerequisites: ["daysSurvived >= 14"],
  },
  {
    id: "long_term_survivor",
    type: "credits",
    delta: 30,
    trigger: "Survival milestone: 15 days",
    prerequisites: ["daysSurvived >= 15"],
  },
  {
    id: "veteran_survivor",
    type: "credits",
    delta: 50,
    trigger: "Survival milestone: 30 days",
    prerequisites: ["daysSurvived >= 30"],
  },
  {
    id: "safe_haven_event",
    type: "credits",
    delta: "variable", // 5–15
    trigger: "10 % random safe-haven discovery when no item is found",
  },
  {
    id: "dynamic_reward_event",
    type: "credits",
    delta: "variable", // 5–15
    trigger: "20 % travel event → 35 % branch to reward",
  },

  // ── CREDIT SINKS ─────────────────────────────────────────────────────────
  {
    id: "wrong_answer_penalty",
    type: "credits",
    delta: "variable", // see SANITY_PENALTY_TABLE
    trigger: "NPC question answered incorrectly",
  },
  {
    id: "location_entry_base",
    type: "credits",
    delta: "variable", // -(dangerLevel * 2)
    trigger: "First visit to a new location",
  },
  {
    id: "dynamic_challenge_event",
    type: "credits",
    delta: "variable", // -(5–15)
    trigger: "20 % travel event → 35 % branch to challenge",
  },

  // ── POINT SOURCES ────────────────────────────────────────────────────────
  {
    id: "day_survived",
    type: "points",
    delta: 100,
    trigger: "Each day survived (return to cabin)",
  },
  {
    id: "high_sanity_bonus",
    type: "points",
    delta: 500,
    trigger: "Sanity > 80 at score calculation",
    prerequisites: ["credits > 80"],
  },
  {
    id: "medium_sanity_bonus",
    type: "points",
    delta: 200,
    trigger: "Sanity 51–80 at score calculation",
    prerequisites: ["credits > 50"],
  },
  {
    id: "npc_interaction_bonus",
    type: "points",
    delta: "variable", // 50 * answeredCount * cappedMultiplier (max 2.5×)
    trigger: "Score calculation — NPC interactions completed",
  },
  {
    id: "unique_location_bonus",
    type: "points",
    delta: 100,
    trigger: "Per unique location visited (score calculation)",
  },
  {
    id: "booster_pack_bonus",
    type: "points",
    delta: 250,
    trigger: "Per booster pack owned (score calculation)",
  },
  {
    id: "survival_streak_10",
    type: "points",
    delta: 1000,
    trigger: "10 days survived milestone",
    prerequisites: ["daysSurvived >= 10"],
  },
  {
    id: "survival_streak_20",
    type: "points",
    delta: 2000,
    trigger: "20 days survived milestone",
    prerequisites: ["daysSurvived >= 20"],
  },
  {
    id: "survival_streak_30",
    type: "points",
    delta: 5000,
    trigger: "30 days survived milestone",
    prerequisites: ["daysSurvived >= 30"],
  },

  // ── STATUS SOURCES ───────────────────────────────────────────────────────
  {
    id: "status_tier_1",
    type: "status",
    delta: 1,
    trigger: "Survive 5 days",
    prerequisites: ["daysSurvived >= 5"],
  },
  {
    id: "status_tier_2",
    type: "status",
    delta: 1,
    trigger: "Survive 15 days + visit 10 locations",
    prerequisites: ["daysSurvived >= 15", "locationsVisited >= 10"],
  },
  {
    id: "status_tier_3",
    type: "status",
    delta: 1,
    trigger: "Survive 30 days + 'survivor_gold' achievement",
    prerequisites: ["daysSurvived >= 30", "achievement:survivor_gold"],
  },
  {
    id: "status_tier_4",
    type: "status",
    delta: 1,
    trigger: "Visit all locations + 'master_explorer_badge' cosmetic",
    prerequisites: ["locationsVisited >= 15", "cosmetic:master_explorer_badge"],
  },

  // ── ACCESS SOURCES ───────────────────────────────────────────────────────
  {
    id: "auth_unlock",
    type: "access",
    delta: 0b00001, // bit 0 = authenticated content
    trigger: "User completes Supabase sign-in",
  },
  {
    id: "hidden_story_arc",
    type: "access",
    delta: 0b00010, // bit 1 = hidden story content
    trigger: "Visit 12 locations",
    prerequisites: ["locationsVisited >= 12"],
  },
  {
    id: "challenge_quest_1",
    type: "access",
    delta: 0b00100, // bit 2 = challenge quest tier 1
    trigger: "Survive 3 days",
    prerequisites: ["daysSurvived >= 3"],
  },
  {
    id: "challenge_quest_2",
    type: "access",
    delta: 0b01000, // bit 3 = challenge quest tier 2
    trigger: "Survive 7 days + visit 5 locations",
    prerequisites: ["daysSurvived >= 7", "locationsVisited >= 5"],
  },
  {
    id: "explorer_compass",
    type: "access",
    delta: 0b10000, // bit 4 = always show 3 travel options
    trigger: "'explorer' achievement unlocked",
    prerequisites: ["achievement:explorer"],
  },
];

// ---------------------------------------------------------------------------
// 3. SANITY PENALTY TABLE (credits sink, detailed)
// ---------------------------------------------------------------------------

export interface SanityPenaltyBand {
  locationIndexRange: [number, number];
  basePenalty: number;
  dangerMultiplier: "dangerLevel";
  perfModFormula: string;
  variation: "±20%";
  notes: string;
}

/** Reference table for wrong-answer sanity penalties. */
export const SANITY_PENALTY_TABLE: SanityPenaltyBand[] = [
  {
    locationIndexRange: [1, 1],
    basePenalty: 5,
    dangerMultiplier: "dangerLevel",
    perfModFormula: "1 + max(0,(answeredNPCs+daysSurvived-20)*0.01), capped at ~2.5",
    variation: "±20%",
    notes: "Entry-level zone. New player protection active below 30 sanity (×0.8 modifier).",
  },
  {
    locationIndexRange: [2, 2],
    basePenalty: 10,
    dangerMultiplier: "dangerLevel",
    perfModFormula: "same",
    variation: "±20%",
    notes: "Mid-entry zone.",
  },
  {
    locationIndexRange: [3, 3],
    basePenalty: 20,
    dangerMultiplier: "dangerLevel",
    perfModFormula: "same",
    variation: "±20%",
    notes: "Mid zone.",
  },
  {
    locationIndexRange: [4, 4],
    basePenalty: 50,
    dangerMultiplier: "dangerLevel",
    perfModFormula: "same",
    variation: "±20%",
    notes: "High tension zone.",
  },
  {
    locationIndexRange: [5, 99],
    basePenalty: 70, // floor of 70–100 random range
    dangerMultiplier: "dangerLevel",
    perfModFormula: "same",
    variation: "±15 (70–100 roll)",
    notes: "Endgame zones. Very high loss potential.",
  },
];

// ---------------------------------------------------------------------------
// 4. PROGRESSION CURVES
// ---------------------------------------------------------------------------

export interface ProgressionBand {
  days: [number, number];
  difficultyLabel: "easy" | "medium" | "hard" | "extreme";
  expectedSanityRange: [number, number];
  locationCountTarget: number;
  pointsAccumulatedTarget: number;
  description: string;
}

/**
 * Pacing guide showing expected player state at each phase.
 * Tune SANITY_PENALTY_TABLE constants if simulated runs diverge > 15 %.
 */
export const PROGRESSION_CURVE: ProgressionBand[] = [
  {
    days: [1, 3],
    difficultyLabel: "easy",
    expectedSanityRange: [70, 110],
    locationCountTarget: 3,
    pointsAccumulatedTarget: 600,
    description:
      "Onboarding phase. Forgiving penalties. Daily login bonus covers most losses. " +
      "Streak-3 bonus available as first milestone hook.",
  },
  {
    days: [4, 7],
    difficultyLabel: "medium",
    expectedSanityRange: [50, 90],
    locationCountTarget: 8,
    pointsAccumulatedTarget: 2500,
    description:
      "Exploration phase. Players encounter danger-level 2–3 locations. " +
      "Challenge-quest-1 unlocks at day 3 boundary. " +
      "Weekly bonus lands as strong retention hook on day 7.",
  },
  {
    days: [8, 15],
    difficultyLabel: "hard",
    expectedSanityRange: [30, 70],
    locationCountTarget: 14,
    pointsAccumulatedTarget: 7000,
    description:
      "Tension phase. Adaptive difficulty engages (perfModifier > 1.2). " +
      "Sanity-shield reward available at day 8 + 7 locations. " +
      "Status tier-2 gate at day 15 motivates continued play.",
  },
  {
    days: [16, 30],
    difficultyLabel: "extreme",
    expectedSanityRange: [20, 60],
    locationCountTarget: 15, // all locations
    pointsAccumulatedTarget: 20000,
    description:
      "Mastery phase. All locations explored. Hidden story arc + explorer cosmetics " +
      "provide late-game content. Veteran-survivor bonus at day 30 is the soft " +
      "goal ceiling. Status tier-3/4 cosmetic gates sustain aspirational play.",
  },
];

// ---------------------------------------------------------------------------
// 5. DIFFICULTY SCORE FORMULA
// ---------------------------------------------------------------------------

/**
 * Canonical difficulty score formula (mirrors gameLogicService):
 *
 *   difficultyScore = locationIndex
 *                   + floor(daysSurvived / 5)
 *                   + dangerLevel
 *                   + performanceModifier
 *
 *   performanceModifier = floor(answeredNPCs / 3) − (sanity < 40 ? 2 : 0)
 *
 * Thresholds → difficulty label:
 *   ≤ 4  easy
 *   ≤ 8  medium
 *   ≤ 12 hard
 *   > 12 extreme
 */
export function computeDifficultyScore(params: {
  locationIndex: number;
  daysSurvived: number;
  dangerLevel: number;
  answeredNPCs: number;
  sanity: number;
}): { score: number; label: "easy" | "medium" | "hard" | "extreme" } {
  const perfMod =
    Math.floor(params.answeredNPCs / 3) - (params.sanity < 40 ? 2 : 0);

  const rawScore =
    params.locationIndex +
    Math.floor(params.daysSurvived / 5) +
    params.dangerLevel +
    perfMod;

  // Clamp to 0: a negative difficulty score is semantically undefined and
  // arises when low sanity (< 40) suppresses perfMod to -2 with no NPC
  // answers and a low-index location (BUG-04).
  const score = Math.max(0, rawScore);

  let label: "easy" | "medium" | "hard" | "extreme";
  if (score <= 4) label = "easy";
  else if (score <= 8) label = "medium";
  else if (score <= 12) label = "hard";
  else label = "extreme";

  return { score, label };
}

// ---------------------------------------------------------------------------
// 6. FAIRNESS RULES
// ---------------------------------------------------------------------------

export interface FairnessRule {
  id: string;
  constraint: string;
  mechanism: string;
  rationale: string;
}

export const FAIRNESS_RULES: FairnessRule[] = [
  {
    id: "sanity_floor_protection",
    constraint: "sanity >= 0 always; credits can never go negative",
    mechanism: "Math.max(0, sanity - penalty) in processQuestionAnswer",
    rationale: "Prevents compounding punishment that makes recovery impossible.",
  },
  {
    id: "sanity_ceiling_cap",
    constraint: "sanity <= 120",
    mechanism: "Math.min(120, sanity + bonus) on every gain path",
    rationale:
      "Prevents credit inflation from making all future sinks irrelevant.",
  },
  {
    id: "low_sanity_difficulty_reduction",
    constraint: "When sanity < 30, penalty multiplier reduced by ×0.8",
    mechanism: "performanceModifier *= 0.8 branch in calculateSanityPenalty",
    rationale:
      "Soft floor prevents death-spiral: struggling players get breathing room.",
  },
  {
    id: "cooldown_enforced_on_time_rewards",
    constraint: "Daily/weekly bonuses cannot be claimed more than once per window",
    mechanism:
      "reward.lastClaimed timestamp checked against reward.cooldown before availability",
    rationale: "Prevents session-juggling to farm time-gated credits.",
  },
  {
    id: "npc_score_multiplier_cap",
    constraint: "NPC score multiplier capped at 2.5×",
    mechanism: "Math.min(progressiveMultiplier, 2.5) in calculateNPCBonus",
    rationale: "Bounds total points from NPC farming; keeps leaderboard spread healthy.",
  },
  {
    id: "item_rarity_gate_by_danger",
    constraint:
      "Higher-rarity items only spawn in high-danger-level locations",
    mechanism:
      "calculateItemSanityBonus uses dangerLevel multiplier; epic/legendary items only defined for high-feature locations",
    rationale:
      "Rewards deliberate risk-taking; players cannot farm legendary items in safe zones.",
  },
  {
    id: "access_level_prerequisites",
    constraint:
      "Catalog entries with requiresAuth=true are inaccessible without auth token",
    mechanism: "Supabase session checked in auth context; Chamber component gates render",
    rationale:
      "Ensures that content requiring account state (progress, saves) cannot be accessed without identity.",
  },
  {
    id: "streak_reset_on_gap",
    constraint: "Login streak resets if gap > 1 calendar day",
    mechanism:
      "getStreakData computes diffDays; returns streak=0 if diffDays > 1",
    rationale:
      "Streak must represent genuine consecutive engagement, not sporadic visits.",
  },
];

// ---------------------------------------------------------------------------
// 7. ANTI-EXPLOIT CONSTRAINTS
// ---------------------------------------------------------------------------

export interface ExploitScenario {
  id: string;
  description: string;
  vector: string;
  mitigation: string;
  residualRisk: "low" | "medium" | "high";
  parameterNote?: string;
}

export const EXPLOIT_SCENARIOS: ExploitScenario[] = [
  {
    id: "EX-01",
    description: "Clock manipulation — advance system time to bypass cooldowns",
    vector:
      "Player changes device clock forward 24+ h, claims daily bonus repeatedly before resetting",
    mitigation:
      "Migrate cooldown validation to server-side Supabase timestamps. " +
      "Until then: store lastClaimed as ISO string; compare against Date.now() on next load. " +
      "Clock-skew > 5 min relative to last-seen should flag the session for review.",
    residualRisk: "medium",
    parameterNote:
      "Current client-only enforcement is insufficient for leaderboard integrity. " +
      "Priority: move claimReward to a Supabase Edge Function.",
  },
  {
    id: "EX-02",
    description: "localStorage tampering — directly inflate sanity or daysSurvived",
    vector:
      "Player opens DevTools → Application → localStorage → edits 'ibt2-game-state-v2' JSON",
    mitigation:
      "Add a server-authoritative shadow state via Supabase (profile.server_sanity, profile.days_survived). " +
      "On each game load, diff client state vs. server state; reject client values that exceed " +
      "the theoretical maximum gain since last server sync.",
    residualRisk: "high",
    parameterNote:
      "Theoretical max daily credit gain = 10 (daily) + 3 (hourly×8) + 15 (item pickup avg) = ~49/day. " +
      "Server-side validation threshold: reject if delta > 60 credits since last sync.",
  },
  {
    id: "EX-03",
    description: "Session farming — create many accounts to claim first-time bonuses",
    vector:
      "Player creates multiple Supabase accounts; each new account starts at 100 sanity and gets onboarding rewards",
    mitigation:
      "Rate-limit account creation per email domain; require email verification before any reward eligibility. " +
      "Track device fingerprint (User-Agent + timezone hash) and flag if > 3 distinct accounts share it.",
    residualRisk: "medium",
  },
  {
    id: "EX-04",
    description: "AFK credit farming — leave browser open to accumulate hourly focus rewards",
    vector:
      "Player leaves tab open with a script that clicks once per hour to claim hourly_focus",
    mitigation:
      "Hourly focus should require a genuine interaction event in the last 30 min (page click, keypress). " +
      "Implement an idle detection timeout: if no interaction for 30 min, pause hourly accumulation.",
    residualRisk: "low",
    parameterNote: "Hourly focus delta is only 3 credits; farming impact is minimal (max 72 credits/day).",
  },
  {
    id: "EX-05",
    description: "Penalty avoidance — refresh page before wrong answer is committed",
    vector:
      "Player sees they picked wrong answer, hard-refreshes before the state flush to localStorage",
    mitigation:
      "Write penalty to localStorage atomically before rendering the outcome screen. " +
      "Move to server-side commit: POST /api/answer is the canonical truth, not the client state.",
    residualRisk: "medium",
    parameterNote: "Currently 0 server calls on answer; all trust is client-side.",
  },
  {
    id: "EX-06",
    description: "Score inflation via NPC interaction repetition",
    vector:
      "Player finds a way to reset answeredNPCs set and re-answer the same NPCs for repeated score bonus",
    mitigation:
      "answeredNPCs is a Set; duplicates are naturally ignored. Guard against Set deserialization bugs: " +
      "validate that loaded answeredNPCs entries are all string IDs in the known NPC corpus.",
    residualRisk: "low",
  },
  {
    id: "EX-07",
    description: "Progressive challenge bypass — unlock tier-2 challenge without completing tier-1",
    vector:
      "Player manipulates access bitmask in localStorage to set bit-3 without bit-2 being set",
    mitigation:
      "On each game load, re-validate access bitmask against current game state: " +
      "if (access & 0b01000) is set but prerequisites (daysSurvived >= 7, locationsVisited >= 5) " +
      "are not met, clear that bit. Prerequisites should be checked on the server.",
    residualRisk: "low",
  },
  {
    id: "EX-08",
    description: "Sanity cap bypass — gain > 120 via rapid concurrent reward claims",
    vector:
      "Race condition: two simultaneous calls to claimReward both read sanity=119 and write 119+bonus",
    mitigation:
      "Server-side: use Supabase row-level locking or an atomic increment with a ceiling trigger. " +
      "Client-side interim: debounce claimReward calls with a 500 ms lock flag.",
    residualRisk: "low",
    parameterNote: "Client-side Math.min(120,...) already constrains each individual call.",
  },
];

// ---------------------------------------------------------------------------
// 8. SIMULATION SCENARIOS
// ---------------------------------------------------------------------------

export interface SimulationScenario {
  id: string;
  name: string;
  archetype: string;
  inputs: {
    daysToSimulate: number;
    answersPerDay: number;
    correctRate: number; // 0–1
    locationsPerDay: number;
    claimDailyBonus: boolean;
    claimHourlyBonus: boolean;
    hourlySessionsPerDay: number;
  };
  expectedOutputRange: {
    finalCredits: [number, number];
    finalPoints: [number, number];
    finalStatus: number;
    finalAccess: number; // bitmask
  };
  edgeCasesTestedByScenario: string[];
}

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: "SIM-01",
    name: "Casual Newcomer",
    archetype: "Logs in once/day, claims daily bonus, answers 2 questions (50 % correct), visits 1 location",
    inputs: {
      daysToSimulate: 7,
      answersPerDay: 2,
      correctRate: 0.5,
      locationsPerDay: 1,
      claimDailyBonus: true,
      claimHourlyBonus: false,
      hourlySessionsPerDay: 0,
    },
    expectedOutputRange: {
      finalCredits: [55, 90],
      finalPoints: [1800, 3000],
      finalStatus: 1,
      finalAccess: 0b00001, // auth only
    },
    edgeCasesTestedByScenario: [
      "Daily bonus cooldown resets correctly",
      "Streak-3 bonus triggers on day 3",
      "Status tier-1 gate (day 5) reached",
    ],
  },
  {
    id: "SIM-02",
    name: "Power Player",
    archetype:
      "Sessions 8 h/day, claims daily + 8× hourly, answers 15 questions (90 % correct), visits 3 locations/day",
    inputs: {
      daysToSimulate: 30,
      answersPerDay: 15,
      correctRate: 0.9,
      locationsPerDay: 3,
      claimDailyBonus: true,
      claimHourlyBonus: true,
      hourlySessionsPerDay: 8,
    },
    expectedOutputRange: {
      finalCredits: [40, 80], // high difficulty erosion at extreme label
      finalPoints: [55000, 90000],
      finalStatus: 4,
      finalAccess: 0b11111,
    },
    edgeCasesTestedByScenario: [
      "NPC score multiplier cap (2.5×) prevents runaway points",
      "Adaptive difficulty engages after day 10",
      "All access bits unlock in order without prerequisite skip",
      "Veteran-survivor 30-day bonus fires exactly once",
    ],
  },
  {
    id: "SIM-03",
    name: "Low-Sanity Spiral",
    archetype:
      "Player answers 80 % incorrectly; sanity should bottom-out then engage protection floor",
    inputs: {
      daysToSimulate: 5,
      answersPerDay: 6,
      correctRate: 0.2,
      locationsPerDay: 2,
      claimDailyBonus: true,
      claimHourlyBonus: false,
      hourlySessionsPerDay: 0,
    },
    expectedOutputRange: {
      finalCredits: [10, 40],
      finalPoints: [600, 1500],
      finalStatus: 0,
      finalAccess: 0b00001,
    },
    edgeCasesTestedByScenario: [
      "Sanity floor protection (×0.8 below 30) prevents zero-sanity instant death loop",
      "Credits never go below 0",
      "Game-over triggers at sanity === 0 correctly",
    ],
  },
  {
    id: "SIM-04",
    name: "Streak Farmer",
    archetype:
      "Logs in every day exactly at cooldown boundary; only claims bonuses, no active play",
    inputs: {
      daysToSimulate: 14,
      answersPerDay: 0,
      correctRate: 1,
      locationsPerDay: 0,
      claimDailyBonus: true,
      claimHourlyBonus: false,
      hourlySessionsPerDay: 0,
    },
    expectedOutputRange: {
      finalCredits: [100, 120], // starts 100, gains: 10×14 daily + 15 streak-3 + 30 streak-7 = 185; capped 120
      finalPoints: [0, 200],
      finalStatus: 0,
      finalAccess: 0b00001,
    },
    edgeCasesTestedByScenario: [
      "Sanity ceiling cap (120) absorbs over-accumulation correctly",
      "Streak correctly resets if a 25-h gap occurs",
      "No points from bonuses alone — points require active play",
    ],
  },
  {
    id: "SIM-05",
    name: "AFK Farmer",
    archetype: "Browser left open 24 h; script claims hourly_focus every 60 min",
    inputs: {
      daysToSimulate: 1,
      answersPerDay: 0,
      correctRate: 1,
      locationsPerDay: 0,
      claimDailyBonus: true,
      claimHourlyBonus: true,
      hourlySessionsPerDay: 24,
    },
    expectedOutputRange: {
      finalCredits: [100, 120], // starts 100; 10 daily + 3×24 hourly = 82; capped 120
      finalPoints: [0, 0],
      finalStatus: 0,
      finalAccess: 0b00001,
    },
    edgeCasesTestedByScenario: [
      "Hourly bonus stacks are individually cooldown-gated",
      "Sanity ceiling absorbs excess — idle farming is self-limiting",
      "Idle detection (future): no-interaction flag should stop hourly accumulation",
    ],
  },
  {
    id: "SIM-06",
    name: "Clock Cheater",
    archetype:
      "System clock advanced +25 h; daily bonus claimed; clock reset to real time; re-attempt claim",
    inputs: {
      daysToSimulate: 1,
      answersPerDay: 0,
      correctRate: 1,
      locationsPerDay: 0,
      claimDailyBonus: true, // attempted twice via clock trick
      claimHourlyBonus: false,
      hourlySessionsPerDay: 0,
    },
    expectedOutputRange: {
      finalCredits: [100, 115], // only one successful claim (client-side) → +10
      finalPoints: [0, 0],
      finalStatus: 0,
      finalAccess: 0b00001,
    },
    edgeCasesTestedByScenario: [
      "lastClaimed timestamp comparison is stable under clock-skew on client",
      "Server-side validation (planned) should reject second claim",
    ],
  },
];

// ---------------------------------------------------------------------------
// 9. PARAMETER ADJUSTMENT GUIDELINES
// ---------------------------------------------------------------------------

export interface ParameterGuide {
  parameter: string;
  currentValue: string;
  increaseEffect: string;
  decreaseEffect: string;
  suggestedTuningTrigger: string;
}

export const PARAMETER_GUIDELINES: ParameterGuide[] = [
  {
    parameter: "daily_login.delta (credits)",
    currentValue: "10",
    increaseEffect: "Reduces early-game tension; casual players stay engaged longer",
    decreaseEffect: "Increases early dropout; punishment feels unfair before skill develops",
    suggestedTuningTrigger: "If D7 retention < 20 %, increase to 15; if sanity economy inflated (avg sanity > 100 at day 7), decrease to 8",
  },
  {
    parameter: "SanityPenalty basePenalties[1] (wrong answer at location 1)",
    currentValue: "5",
    increaseEffect: "Higher stakes for new players; increases churn before skill ramp",
    decreaseEffect: "Lower pressure; reduces early tutorial difficulty",
    suggestedTuningTrigger: "If > 40 % of new users hit game-over before day 3, reduce to 3",
  },
  {
    parameter: "SanityPenalty basePenalties[4] (location 4)",
    currentValue: "50",
    increaseEffect: "Endgame becomes punishing; keeps high-skill players challenged",
    decreaseEffect: "Veterans plateau at easy difficulty; disengagement risk",
    suggestedTuningTrigger: "If day-10 average sanity > 90, increase to 60",
  },
  {
    parameter: "performanceModifier threshold (10 answered or 10 days)",
    currentValue: "max(answeredCount, daysSurvived) > 10",
    increaseEffect: "Adaptive difficulty kicks in later; new players get more grace period",
    decreaseEffect: "Early skill recognition; engaged players are challenged sooner",
    suggestedTuningTrigger: "Monitor day-7 average sanity. If > 75, lower threshold to 8",
  },
  {
    parameter: "npcBonus cappedMultiplier",
    currentValue: "2.5",
    increaseEffect: "Points economy inflated; NPC farming becomes dominant strategy",
    decreaseEffect: "Reduces engagement with NPC interaction as a scoring lever",
    suggestedTuningTrigger: "If top-10 leaderboard scores are > 5× median at day 30, reduce cap to 2.0",
  },
  {
    parameter: "item discovery base chance",
    currentValue: "0.35",
    increaseEffect: "More sanity top-ups; reduces perceived randomness frustration",
    decreaseEffect: "Discovery feels rarer and more rewarding; economy tighter",
    suggestedTuningTrigger: "If session abandonment spikes in days 8–12, increase to 0.45 temporarily",
  },
  {
    parameter: "weekly_survival.delta (credits)",
    currentValue: "50",
    increaseEffect: "Strong D7 retention hook; players hold on for bonus",
    decreaseEffect: "Reduces D7 as a 'must-login' attractor",
    suggestedTuningTrigger: "Keep at 50 unless sanity ceiling causing consistent cap-out; then reduce to 30",
  },
  {
    parameter: "hidden_story_arc prerequisite (locationsVisited >= 12)",
    currentValue: "12",
    increaseEffect: "Later unlock; more exploration required before narrative payoff",
    decreaseEffect: "Story content accessible earlier; reduces exploration grind feel",
    suggestedTuningTrigger: "Adjust based on median locations visited at day 10; target unlock at ~60 % through exploration",
  },
];
