import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, Brain, Heart, Target, TrendingUp, AlertCircle, Save, RotateCcw, Loader2, Sparkles, Eye, Book, BarChart3 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// MONOCHROME VISUAL SYSTEM — ink on bone, shadow on light
// ═══════════════════════════════════════════════════════════════
const VISUAL_THEME = {
  colors: {
    primary: {
      50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
      400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
      800: '#262626', 900: '#171717'
    },
    secondary: {
      50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8',
      400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46',
      800: '#27272a', 900: '#18181b'
    },
    accent: {
      warm: '#a3a3a3',
      cool: '#737373',
      success: '#525252',
      warning: '#737373',
      danger: '#171717'
    },
    neutral: {
      50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
      400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
      800: '#262626', 900: '#171717'
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)'
  }
};

// ═══════════════════════════════════════════════════════════════
// CORE SYMBOLIC SYSTEM — 26 concepts representing human existence
// ═══════════════════════════════════════════════════════════════
const CORE_CONCEPTS = [
  'Agency', 'Balance', 'Connection', 'Discovery', 'Empathy', 'Freedom', 'Growth', 'Hope',
  'Identity', 'Joy', 'Knowledge', 'Love', 'Memory', 'Nature', 'Order', 'Peace',
  'Questions', 'Resilience', 'Spirit', 'Time', 'Understanding', 'Vitality', 'Wisdom',
  'eXperience', 'Yearning', 'Zen'
];

// Shade generation with fallback patterns
const generateShades = (concept, rotation = 0) => {
  const shadeVariations = {
    'Agency': ['autonomy', 'choice', 'control', 'decision', 'empowerment', 'independence', 'influence', 'initiative', 'leadership', 'responsibility', 'self-determination', 'sovereignty', 'willpower'],
    'Balance': ['harmony', 'equilibrium', 'stability', 'centeredness', 'proportion', 'moderation', 'steadiness', 'composure', 'alignment', 'symmetry', 'poise', 'temperance', 'calibration'],
    'Connection': ['bonding', 'relationship', 'unity', 'intimacy', 'communication', 'belonging', 'attachment', 'network', 'community', 'rapport', 'solidarity', 'kinship', 'affiliation'],
    'Discovery': ['exploration', 'revelation', 'insight', 'finding', 'uncovering', 'learning', 'breakthrough', 'awareness', 'realization', 'observation', 'detection', 'enlightenment', 'awakening'],
    'Empathy': ['compassion', 'understanding', 'sympathy', 'sensitivity', 'care', 'concern', 'kindness', 'warmth', 'tenderness', 'consideration', 'mercy', 'gentleness', 'support'],
    'Freedom': ['liberation', 'independence', 'autonomy', 'release', 'openness', 'flexibility', 'spontaneity', 'choice', 'unboundedness', 'escape', 'emancipation', 'self-expression', 'unrestraint'],
    'Growth': ['development', 'progress', 'expansion', 'evolution', 'improvement', 'advancement', 'maturation', 'flourishing', 'enhancement', 'transformation', 'cultivation', 'enrichment', 'blossoming'],
    'Hope': ['optimism', 'faith', 'trust', 'confidence', 'expectation', 'aspiration', 'anticipation', 'belief', 'encouragement', 'positivity', 'inspiration', 'motivation', 'promise'],
    'Identity': ['self', 'personality', 'character', 'individuality', 'authenticity', 'uniqueness', 'essence', 'nature', 'being', 'persona', 'core', 'spirit', 'soul'],
    'Joy': ['happiness', 'delight', 'bliss', 'contentment', 'pleasure', 'satisfaction', 'euphoria', 'elation', 'cheerfulness', 'jubilation', 'exuberance', 'rapture', 'glee'],
    'Knowledge': ['wisdom', 'understanding', 'awareness', 'insight', 'comprehension', 'learning', 'education', 'information', 'intelligence', 'cognition', 'enlightenment', 'perception', 'consciousness'],
    'Love': ['affection', 'devotion', 'adoration', 'care', 'tenderness', 'attachment', 'passion', 'fondness', 'warmth', 'admiration', 'romance', 'appreciation', 'cherishing'],
    'Memory': ['remembrance', 'recollection', 'nostalgia', 'recall', 'reminiscence', 'recognition', 'retention', 'reflection', 'commemoration', 'preservation', 'legacy', 'history', 'past'],
    'Nature': ['essence', 'wildness', 'natural', 'organic', 'primal', 'elemental', 'instinct', 'purity', 'simplicity', 'authenticity', 'raw', 'untamed', 'fundamental'],
    'Order': ['structure', 'organization', 'system', 'pattern', 'arrangement', 'sequence', 'discipline', 'method', 'control', 'regulation', 'harmony', 'coordination', 'framework'],
    'Peace': ['tranquility', 'serenity', 'calm', 'stillness', 'quiet', 'harmony', 'relaxation', 'composure', 'contentment', 'rest', 'solitude', 'meditation', 'silence'],
    'Questions': ['inquiry', 'curiosity', 'wonder', 'exploration', 'doubt', 'seeking', 'investigation', 'search', 'pursuit', 'quest', 'examination', 'probing', 'reflection'],
    'Resilience': ['strength', 'endurance', 'persistence', 'durability', 'toughness', 'recovery', 'adaptation', 'flexibility', 'perseverance', 'fortitude', 'tenacity', 'courage', 'bounce-back'],
    'Spirit': ['soul', 'essence', 'energy', 'vitality', 'life-force', 'passion', 'enthusiasm', 'inspiration', 'motivation', 'drive', 'spark', 'fire', 'inner-light'],
    'Time': ['duration', 'moment', 'eternity', 'present', 'flow', 'rhythm', 'cycle', 'progression', 'sequence', 'temporality', 'continuity', 'passage', 'chronology'],
    'Understanding': ['comprehension', 'insight', 'clarity', 'realization', 'awareness', 'perception', 'recognition', 'acknowledgment', 'acceptance', 'empathy', 'wisdom', 'knowledge', 'grasp'],
    'Vitality': ['energy', 'vigor', 'life', 'strength', 'vivacity', 'dynamism', 'liveliness', 'animation', 'zest', 'enthusiasm', 'power', 'force', 'aliveness'],
    'Wisdom': ['insight', 'knowledge', 'understanding', 'judgment', 'prudence', 'discernment', 'experience', 'enlightenment', 'sagacity', 'intelligence', 'perception', 'awareness', 'depth'],
    'eXperience': ['sensation', 'encounter', 'adventure', 'journey', 'exposure', 'involvement', 'participation', 'engagement', 'immersion', 'trial', 'event', 'occurrence', 'happening'],
    'Yearning': ['longing', 'desire', 'craving', 'aspiration', 'wish', 'want', 'need', 'hunger', 'thirst', 'ache', 'seeking', 'striving', 'reaching'],
    'Zen': ['mindfulness', 'presence', 'awareness', 'meditation', 'centeredness', 'enlightenment', 'stillness', 'clarity', 'simplicity', 'peace', 'balance', 'unity', 'transcendence']
  };

  const baseShades = shadeVariations[concept] || [
    `${concept.toLowerCase()}-essence`, `${concept.toLowerCase()}-core`, `${concept.toLowerCase()}-spirit`,
    `${concept.toLowerCase()}-depth`, `${concept.toLowerCase()}-flow`, `${concept.toLowerCase()}-light`,
    `${concept.toLowerCase()}-shadow`, `${concept.toLowerCase()}-truth`, `${concept.toLowerCase()}-path`,
    `${concept.toLowerCase()}-wisdom`, `${concept.toLowerCase()}-journey`, `${concept.toLowerCase()}-moment`,
    `${concept.toLowerCase()}-infinite`
  ];

  if (rotation === 0) return baseShades;

  const rotationFactor = Math.sin((rotation * Math.PI) / 180);
  const rotationQuadrant = Math.floor(rotation / 90);

  return baseShades.map((shade) => {
    const transformationPrefix = {
      0: '',
      1: rotationFactor > 0.5 ? 'emerging-' : 'subtle-',
      2: rotationFactor > 0 ? 'transcendent-' : 'deep-',
      3: 'integrated-'
    }[rotationQuadrant] || '';
    return `${transformationPrefix}${shade}`;
  });
};

// ═══════════════════════════════════════════════════════════════
// SYMBOLIC ENGINE — deterministic concept analysis
// ═══════════════════════════════════════════════════════════════
class SymbolicEngine {
  constructor() {
    this.conceptMap = new Map();
    this.memoizedAnalyses = new Map();
    this.maxCacheSize = 100;
    this.initializeSystem();
  }

  initializeSystem() {
    const antonymMap = this.buildAntonymMap();
    for (let rotation = 0; rotation < 360; rotation += 15) {
      const rotationConcepts = CORE_CONCEPTS.map(concept => ({
        concept,
        shades: generateShades(concept, rotation),
        antonym: antonymMap[concept],
        rotation
      }));
      this.conceptMap.set(rotation, rotationConcepts);
    }
  }

  buildAntonymMap() {
    return {
      'Agency': 'Helplessness', 'Balance': 'Chaos', 'Connection': 'Isolation',
      'Discovery': 'Ignorance', 'Empathy': 'Indifference', 'Freedom': 'Constraint',
      'Growth': 'Decay', 'Hope': 'Despair', 'Identity': 'Anonymity',
      'Joy': 'Sorrow', 'Knowledge': 'Ignorance', 'Love': 'Hatred',
      'Memory': 'Forgetting', 'Nature': 'Artifice', 'Order': 'Chaos',
      'Peace': 'Conflict', 'Questions': 'Certainty', 'Resilience': 'Fragility',
      'Spirit': 'Emptiness', 'Time': 'Timelessness', 'Understanding': 'Confusion',
      'Vitality': 'Lethargy', 'Wisdom': 'Foolishness', 'eXperience': 'Inexperience',
      'Yearning': 'Satisfaction', 'Zen': 'Turbulence'
    };
  }

  analyzeText(text, emotionalState = 'neutral') {
    if (!text || typeof text !== 'string') return this.createEmptyAnalysis();
    const cleanText = text.trim();
    if (cleanText.length < 3) return this.createEmptyAnalysis();

    const cacheKey = `${cleanText.substring(0, 100)}-${emotionalState}`;
    if (this.memoizedAnalyses.has(cacheKey)) {
      return this.memoizedAnalyses.get(cacheKey);
    }

    const analysisText = cleanText.length > 5000 ? cleanText.substring(0, 5000) : cleanText;
    const words = this.tokenizeText(analysisText);
    const rotation = this.calculateOptimalRotation(analysisText, emotionalState);
    const concepts = this.getConceptsForRotation(rotation);
    const conceptMatches = this.findAllConceptMatches(words, concepts);

    const analysis = {
      rotation,
      concepts: conceptMatches.sort((a, b) => b.strength - a.strength),
      totalConcepts: concepts.length,
      meaningDepth: this.calculateMeaningDepth(conceptMatches, words.length)
    };

    this.manageCacheSize();
    this.memoizedAnalyses.set(cacheKey, analysis);
    return analysis;
  }

  createEmptyAnalysis() {
    return { rotation: 0, concepts: [], totalConcepts: 26, meaningDepth: 0 };
  }

  tokenizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && word.length < 20)
      .slice(0, 500);
  }

  getConceptsForRotation(rotation) {
    const nearestRotation = Math.round(rotation / 15) * 15;
    return this.conceptMap.get(nearestRotation % 360) || this.conceptMap.get(0);
  }

  calculateOptimalRotation(text, emotionalState) {
    const sentiment = this.calculateSentiment(text);
    const complexity = Math.min(text.split(/[.!?]/).length, 10);

    const emotionalRotations = {
      'despair': 270, 'anger': 315, 'fear': 300, 'sadness': 285,
      'neutral': 0, 'calm': 45, 'hopeful': 90, 'joy': 135,
      'determined': 180, 'growth': 225
    };

    const baseRotation = emotionalRotations[emotionalState] || 0;
    const sentimentAdjust = Math.max(-45, Math.min(45, sentiment * 45));
    const complexityAdjust = Math.min(complexity * 3, 30);
    let finalRotation = baseRotation + sentimentAdjust + complexityAdjust;
    finalRotation = ((finalRotation % 360) + 360) % 360;
    return Math.round(finalRotation);
  }

  calculateSentiment(text) {
    const positiveWords = new Set(['good', 'great', 'happy', 'joy', 'love', 'hope', 'strong', 'peace', 'growth', 'better', 'grateful', 'proud', 'success', 'heal', 'recovery', 'progress', 'positive', 'wonderful', 'amazing', 'blessed']);
    const negativeWords = new Set(['bad', 'sad', 'angry', 'hate', 'fear', 'despair', 'weak', 'pain', 'hurt', 'struggle', 'relapse', 'trigger', 'difficult', 'hard', 'lost', 'terrible', 'awful', 'broken', 'hopeless']);

    const words = this.tokenizeText(text);
    let score = 0;
    let wordCount = 0;
    words.forEach(word => {
      if (positiveWords.has(word)) { score += 1; wordCount += 1; }
      else if (negativeWords.has(word)) { score -= 1; wordCount += 1; }
    });
    if (wordCount === 0) return 0;
    return Math.max(-1, Math.min(1, score / Math.max(1, Math.sqrt(words.length))));
  }

  findAllConceptMatches(words, concepts) {
    const conceptMatches = [];
    const wordSet = new Set(words);

    concepts.forEach(conceptData => {
      const matches = this.findConceptMatches(wordSet, words, conceptData);
      if (matches.length > 0) {
        conceptMatches.push({
          concept: conceptData.concept,
          shades: matches,
          strength: this.calculateConceptStrength(matches, words.length),
          rotation: conceptData.rotation,
          antonym: conceptData.antonym
        });
      }
    });
    return conceptMatches;
  }

  findConceptMatches(wordSet, words, conceptData) {
    // FIX: replaced unicode ellipsis with proper spread operator
    const allTerms = [conceptData.concept.toLowerCase(), ...conceptData.shades];
    const matches = new Set();

    allTerms.forEach(term => {
      if (wordSet.has(term)) matches.add(term);
    });

    if (matches.size < 3) {
      words.forEach(word => {
        allTerms.forEach(term => {
          if (term.includes(word) || word.includes(term) || this.semanticSimilarity(word, term)) {
            matches.add(term);
          }
        });
      });
    }
    return Array.from(matches);
  }

  calculateConceptStrength(matches, totalWords) {
    if (totalWords === 0) return 0;
    const baseStrength = matches.length / totalWords;
    const diversityBonus = Math.min(matches.length / 5, 1);
    return Math.min(1, baseStrength * (1 + diversityBonus * 0.5));
  }

  semanticSimilarity(word1, word2) {
    if (word1.length < 3 || word2.length < 3) return false;
    const synonymGroups = [
      new Set(['happy', 'joy', 'glad', 'pleased', 'content', 'cheerful']),
      new Set(['sad', 'sorrow', 'grief', 'melancholy', 'depressed', 'down']),
      new Set(['strong', 'powerful', 'robust', 'mighty', 'resilient']),
      new Set(['weak', 'fragile', 'frail', 'vulnerable', 'delicate']),
      new Set(['growth', 'development', 'progress', 'advancement', 'improvement']),
      new Set(['love', 'affection', 'care', 'devotion', 'attachment']),
      new Set(['fear', 'anxiety', 'worry', 'concern', 'dread']),
      new Set(['peace', 'calm', 'tranquil', 'serene', 'quiet']),
      new Set(['anger', 'rage', 'fury', 'mad', 'irritated']),
      new Set(['hope', 'optimism', 'faith', 'trust', 'belief'])
    ];
    return synonymGroups.some(group => group.has(word1) && group.has(word2));
  }

  calculateMeaningDepth(conceptMatches, wordCount) {
    if (conceptMatches.length === 0 || wordCount === 0) return 0;
    const totalStrength = conceptMatches.reduce((sum, match) => sum + match.strength, 0);
    const conceptDiversity = Math.min(conceptMatches.length / 26, 1);
    const rotationComplexity = conceptMatches.some(m => m.rotation > 0) ? 1.2 : 1.0;
    const lengthFactor = Math.min(wordCount / 100, 2);
    return Math.min(100, (totalStrength * conceptDiversity * rotationComplexity * lengthFactor * 100));
  }

  manageCacheSize() {
    if (this.memoizedAnalyses.size > this.maxCacheSize) {
      const entries = Array.from(this.memoizedAnalyses.entries());
      const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.3));
      toRemove.forEach(([key]) => this.memoizedAnalyses.delete(key));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// RECOVERY PATTERN ANALYZER
// ═══════════════════════════════════════════════════════════════
class RecoveryAnalyzer {
  constructor() {
    this.patterns = [];
    this.maxPatterns = 100;
    this.triggers = new Set();
    this.copingStrategies = new Map();
  }

  analyzeEntry(entry, symbols) {
    try {
      if (!entry || typeof entry !== 'string' || !symbols) return this.createSafeAnalysis();

      const analysis = {
        riskLevel: this.calculateRiskLevel(entry, symbols),
        triggers: this.identifyTriggers(entry),
        copingOpportunities: this.suggestCoping(symbols),
        progressIndicators: this.trackProgress(symbols),
        emotionalTrajectory: this.assessEmotionalTrajectory(entry)
      };

      this.addPattern({ timestamp: Date.now(), ...analysis, rawEntry: entry.substring(0, 200) });
      return analysis;
    } catch (error) {
      console.warn('Recovery analysis error:', error);
      return this.createSafeAnalysis();
    }
  }

  createSafeAnalysis() {
    return {
      riskLevel: 'unknown',
      triggers: [],
      copingOpportunities: ['Take a moment to breathe deeply'],
      progressIndicators: { positiveSymbols: 0, meaningDepth: 0, rotationBalance: 'neutral' },
      emotionalTrajectory: 'neutral'
    };
  }

  addPattern(pattern) {
    this.patterns.push(pattern);
    if (this.patterns.length > this.maxPatterns) {
      this.patterns = this.patterns.slice(-this.maxPatterns + 10);
    }
  }

  calculateRiskLevel(entry, symbols) {
    const riskKeywords = new Set(['trigger', 'craving', 'urge', 'relapse', 'temptation', 'stress', 'overwhelmed', 'desperate', 'hopeless', "can't cope"]);
    const protectiveKeywords = new Set(['meeting', 'sponsor', 'meditation', 'exercise', 'support', 'grateful', 'strength', 'recovery', 'progress', 'hope']);

    let riskScore = 0;
    const words = entry.toLowerCase().split(/\s+/);
    const wordCount = words.length;

    words.forEach(word => {
      if (riskKeywords.has(word)) riskScore += 1.5;
      if (protectiveKeywords.has(word)) riskScore -= 1;
    });

    const negativeSymbols = symbols.concepts ? symbols.concepts.filter(c =>
      c.antonym && ['Despair', 'Isolation', 'Chaos', 'Fragility', 'Helplessness'].includes(c.antonym)
    ).length : 0;

    const symbolRisk = negativeSymbols * 0.4;
    const contextualRisk = wordCount > 0 ? (riskScore / Math.sqrt(wordCount)) * 3 : 0;
    const adjustedScore = contextualRisk + symbolRisk;

    if (adjustedScore > 2.5) return 'high';
    if (adjustedScore > 1.2) return 'medium';
    if (adjustedScore < -1) return 'very-low';
    return 'low';
  }

  identifyTriggers(entry) {
    const triggerPatterns = {
      'stress': /stress|pressure|overwhelm|burden/i,
      'loneliness': /lonely|alone|isolated|disconnected/i,
      'boredom': /bored|nothing to do|empty time/i,
      'anger': /angry|mad|furious|irritated|rage/i,
      'sadness': /sad|depressed|down|blue|grief/i,
      'celebration': /celebrate|party|achievement|success/i,
      'social': /social|people|crowd|group|public/i,
      'work': /work|job|career|boss|deadline/i,
      'family': /family|parent|sibling|relative|home/i,
      'money': /money|financial|bill|debt|expense/i,
      'health': /health|sick|pain|medical|doctor/i,
      'relationship': /relationship|partner|spouse|dating|love/i
    };

    const identified = [];
    Object.entries(triggerPatterns).forEach(([trigger, pattern]) => {
      if (pattern.test(entry)) identified.push(trigger);
    });
    return identified;
  }

  suggestCoping(symbols) {
    const strategies = [];
    if (!symbols.concepts) return ['Take a moment to center yourself'];

    const strategyMap = {
      'Peace': ['Try a 5-minute meditation or breathing exercise', 'Find a quiet space for reflection'],
      'Connection': ['Reach out to your sponsor or support network', 'Join a support group meeting'],
      'Growth': ['Reflect on how far you\'ve come in your journey', 'Write about your progress'],
      'Agency': ['Take one small positive action you can control', 'Make a decision that supports your recovery'],
      'Nature': ['Spend time outdoors or with natural elements', 'Take a walk in a natural setting'],
      'Resilience': ['Remember your inner strength', 'Practice self-compassion'],
      'Hope': ['Focus on your recovery goals', 'Visualize your future success'],
      'Balance': ['Restore your daily routine', 'Practice work-life balance'],
      'Wisdom': ['Learn from this experience', 'Seek guidance from a mentor']
    };

    symbols.concepts.forEach(concept => {
      const conceptStrategies = strategyMap[concept.concept];
      if (conceptStrategies) strategies.push(...conceptStrategies);
    });

    if (strategies.length === 0) {
      strategies.push(
        'Take deep breaths and ground yourself',
        'Remember your reasons for recovery',
        'Reach out to someone who supports you'
      );
    }
    return [...new Set(strategies)].slice(0, 3);
  }

  trackProgress(symbols) {
    if (!symbols.concepts) {
      return { positiveSymbols: 0, meaningDepth: 0, rotationBalance: 'neutral' };
    }

    const positiveIndicators = symbols.concepts.filter(c =>
      ['Growth', 'Hope', 'Resilience', 'Wisdom', 'Peace', 'Joy', 'Love', 'Connection'].includes(c.concept)
    );

    const rotationPhase = symbols.rotation < 90 ? 'foundation' :
      symbols.rotation < 180 ? 'growth' :
      symbols.rotation < 270 ? 'transformation' : 'integration';

    return {
      positiveSymbols: positiveIndicators.length,
      meaningDepth: symbols.meaningDepth || 0,
      rotationBalance: rotationPhase
    };
  }

  assessEmotionalTrajectory(entry) {
    const timeIndicators = {
      past: /was|yesterday|before|used to|remember|previous|earlier|ago/gi,
      present: /am|is|now|today|currently|right now|at this moment/gi,
      future: /will|tomorrow|plan|hope|going to|next|future|upcoming/gi
    };

    let pastCount = (entry.match(timeIndicators.past) || []).length;
    let presentCount = (entry.match(timeIndicators.present) || []).length;
    let futureCount = (entry.match(timeIndicators.future) || []).length;

    const total = pastCount + presentCount + futureCount;
    if (total === 0) return 'present-focused';

    if (futureCount / total > 0.4) return 'forward-looking';
    if (presentCount / total > 0.4) return 'present-focused';
    if (pastCount / total > 0.4) return 'reflective';
    return 'balanced';
  }

  getWeeklyInsights() {
    if (this.patterns.length < 3) return null;
    try {
      const recent = this.patterns.slice(-7);
      const validPatterns = recent.filter(p => p.riskLevel !== 'unknown');
      if (validPatterns.length === 0) return null;

      const avgRisk = validPatterns.filter(p => p.riskLevel === 'high').length / validPatterns.length;
      const allTriggers = validPatterns.flatMap(p => p.triggers || []);

      const triggerFreq = {};
      allTriggers.forEach(trigger => { triggerFreq[trigger] = (triggerFreq[trigger] || 0) + 1; });
      const topTrigger = Object.keys(triggerFreq).length > 0
        ? Object.keys(triggerFreq).reduce((a, b) => triggerFreq[a] > triggerFreq[b] ? a : b)
        : '';

      const meaningDepths = validPatterns
        .map(p => parseFloat(p.progressIndicators?.meaningDepth || 0))
        .filter(depth => !isNaN(depth));

      const avgMeaningDepth = meaningDepths.length > 0
        ? meaningDepths.reduce((sum, depth) => sum + depth, 0) / meaningDepths.length
        : 0;

      const forwardLookingRatio = validPatterns.filter(p =>
        p.emotionalTrajectory === 'forward-looking'
      ).length / validPatterns.length;

      return {
        riskTrend: avgRisk > 0.4 ? 'increasing' : avgRisk < 0.2 ? 'decreasing' : 'stable',
        primaryTrigger: topTrigger,
        averageMeaningDepth: avgMeaningDepth,
        emotionalBalance: forwardLookingRatio,
        totalEntries: validPatterns.length
      };
    } catch (error) {
      console.warn('Weekly insights calculation error:', error);
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS — monochrome, ink-weight visual system
// ═══════════════════════════════════════════════════════════════

const RotationVisualizer = ({ rotation, meaningDepth }) => {
  const rotationPercentage = rotation / 360;
  const depthPercentage = meaningDepth;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e5e5" strokeWidth="2" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          stroke="#171717"
          strokeWidth="3"
          strokeDasharray={`${rotationPercentage * 283} 283`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#f5f5f5" strokeWidth="2" />
        <circle
          cx="50" cy="50" r="30" fill="none"
          stroke="#525252"
          strokeWidth="4"
          strokeDasharray={`${(depthPercentage / 100) * 188} 188`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-neutral-900">{rotation}°</div>
          <div className="text-xs text-neutral-500">{depthPercentage.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
};

const ConceptBadge = ({ concept, strength, isActive = false }) => {
  const intensityClass = strength > 0.7
    ? 'bg-neutral-900 text-white'
    : strength > 0.4
    ? 'bg-neutral-200 text-neutral-800'
    : 'bg-neutral-100 text-neutral-600';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-out ${intensityClass} ${isActive ? 'ring-2 ring-neutral-400 shadow-lg scale-105' : 'hover:scale-105 hover:shadow-md'}`}>
      <span className="truncate">{concept}</span>
      <span className="text-xs opacity-75">{(strength * 100).toFixed(0)}%</span>
    </div>
  );
};

const EmotionalStateSelector = ({ value, onChange }) => {
  const emotionalStates = [
    { value: 'despair', label: 'Despair', emoji: '◼' },
    { value: 'sadness', label: 'Sadness', emoji: '◾' },
    { value: 'fear', label: 'Fear', emoji: '▪' },
    { value: 'anger', label: 'Anger', emoji: '■' },
    { value: 'neutral', label: 'Neutral', emoji: '○' },
    { value: 'calm', label: 'Calm', emoji: '◇' },
    { value: 'hopeful', label: 'Hopeful', emoji: '△' },
    { value: 'joy', label: 'Joy', emoji: '☆' },
    { value: 'determined', label: 'Determined', emoji: '▲' },
    { value: 'growth', label: 'Growth', emoji: '◆' }
  ];

  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full p-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200 ease-out text-neutral-800 font-medium"
    >
      {emotionalStates.map(state => (
        <option key={state.value} value={state.value}>
          {state.emoji} {state.label}
        </option>
      ))}
    </select>
  );
};

const RiskIndicator = ({ level, triggers = [] }) => {
  const riskConfig = {
    'very-low': { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-700', icon: '◇', label: 'Excellent' },
    'low': { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-700', icon: '○', label: 'Good' },
    'medium': { bg: 'bg-neutral-100', border: 'border-neutral-300', text: 'text-neutral-800', icon: '◈', label: 'Caution' },
    'high': { bg: 'bg-neutral-900', border: 'border-neutral-900', text: 'text-white', icon: '●', label: 'Alert' },
    'unknown': { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-500', icon: '?', label: 'Unknown' }
  };
  const config = riskConfig[level] || riskConfig['unknown'];

  return (
    <div className={`rounded-xl p-4 border transition-all duration-300 ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-10 h-10 rounded-full ${level === 'high' ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'} flex items-center justify-center text-lg font-bold shadow-sm`}>
          {config.icon}
        </div>
        <div>
          <h4 className={`font-semibold ${config.text}`}>Risk Level: {config.label}</h4>
          {triggers.length > 0 && (
            <p className={`text-sm ${config.text} opacity-80`}>Triggers: {triggers.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN SOULMIRROR COMPONENT
// ═══════════════════════════════════════════════════════════════
const SoulMirror = () => {
  const [journalText, setJournalText] = useState('');
  const [entries, setEntries] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [activeTab, setActiveTab] = useState('journal');
  const [emotionalState, setEmotionalState] = useState('neutral');

  // Stable engine refs — survive re-renders without triggering them
  const symbolicEngine = useMemo(() => new SymbolicEngine(), []);
  const recoveryAnalyzer = useMemo(() => new RecoveryAnalyzer(), []);

  // FIX: Use ref to track analyzing state so the callback doesn't depend on it
  const analyzingRef = useRef(false);

  const analyzeJournal = useCallback(() => {
    const trimmedText = journalText.trim();
    if (trimmedText.length < 10) {
      setCurrentAnalysis(null);
      return;
    }

    if (analyzingRef.current) return;
    analyzingRef.current = true;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const symbols = symbolicEngine.analyzeText(trimmedText, emotionalState);
      const recovery = recoveryAnalyzer.analyzeEntry(trimmedText, symbols);

      setCurrentAnalysis({
        symbols,
        recovery,
        timestamp: new Date(),
        wordCount: trimmedText.split(/\s+/).filter(w => w).length
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError('Analysis temporarily unavailable. Please try again.');
    } finally {
      setIsAnalyzing(false);
      analyzingRef.current = false;
    }
  }, [journalText, emotionalState, symbolicEngine, recoveryAnalyzer]);

  const saveEntry = useCallback(() => {
    if (!currentAnalysis || journalText.trim().length < 10) return;
    try {
      const newEntry = {
        id: Date.now(),
        text: journalText.trim(),
        analysis: currentAnalysis,
        emotionalState,
        timestamp: new Date()
      };
      setEntries(prev => [newEntry, ...prev].slice(0, 50));
      setJournalText('');
      setCurrentAnalysis(null);
      setAnalysisError(null);
    } catch (error) {
      console.error('Save error:', error);
      setAnalysisError('Failed to save entry. Please try again.');
    }
  }, [currentAnalysis, journalText, emotionalState]);

  // FIX: Clean debounced effect — no isAnalyzing in deps, no analyzeJournal in deps
  // Instead, trigger on text/emotional changes only
  useEffect(() => {
    if (!journalText.trim() || journalText.trim().length < 10) {
      setCurrentAnalysis(null);
      return;
    }

    const timer = setTimeout(() => {
      if (!analyzingRef.current) {
        analyzeJournal();
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalText, emotionalState]);

  const weeklyInsights = useMemo(() => {
    try { return recoveryAnalyzer.getWeeklyInsights(); }
    catch { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const getRotationPhaseDescription = (rotation) => {
    if (rotation < 90) return 'Foundation Phase — Building core strength and awareness';
    if (rotation < 180) return 'Growth Phase — Expanding understanding and capabilities';
    if (rotation < 270) return 'Transformation Phase — Deep change and renewal';
    return 'Integration Phase — Harmonizing new insights with life';
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'decreasing': return 'text-neutral-500';
      case 'increasing': return 'text-neutral-900 font-bold';
      default: return 'text-neutral-600';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Subtle grain texture */}
      <div className="fixed inset-0 opacity-[0.03]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")'}} />

      <div className="relative max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">

          {/* Header — stark monochrome */}
          <div className="bg-neutral-900 text-white p-8 relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl font-bold flex items-center gap-4 mb-2">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Brain className="h-8 w-8" />
                </div>
                SoulMirror
              </h1>
              <p className="text-xl opacity-80 font-light">Symbolic Recovery Journal</p>
              <p className="text-sm opacity-50 mt-2">Transform your recovery through rotational symbolic analysis</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-32 translate-x-32" />
          </div>

          {/* Navigation */}
          <div className="border-b border-neutral-200 bg-neutral-50">
            <nav className="flex space-x-1 px-8">
              {[
                { id: 'journal', label: 'Journal', icon: Heart },
                { id: 'analysis', label: 'Analysis', icon: Eye },
                { id: 'memory', label: 'Memory Bank', icon: Book },
                { id: 'progress', label: 'Progress', icon: BarChart3 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 py-4 px-6 border-b-2 transition-all duration-300 ease-out rounded-t-lg relative
                    ${activeTab === tab.id
                      ? 'border-neutral-900 text-neutral-900 bg-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-white/50'}`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">

            {/* ═════════ JOURNAL TAB ═════════ */}
            {activeTab === 'journal' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Input */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
                    <label className="block text-sm font-semibold text-neutral-700 mb-3">
                      <Heart className="inline h-4 w-4 mr-2 text-neutral-500" />
                      Current Emotional State
                    </label>
                    <EmotionalStateSelector value={emotionalState} onChange={(e) => setEmotionalState(e.target.value)} />
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
                    <label className="block text-sm font-semibold text-neutral-700 mb-3">
                      <Brain className="inline h-4 w-4 mr-2 text-neutral-500" />
                      Journal Entry
                    </label>
                    <textarea
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder="Write about your thoughts, feelings, challenges, or victories today..."
                      className="w-full h-80 p-6 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none transition-all duration-200 ease-out text-neutral-800 leading-relaxed placeholder-neutral-400"
                      maxLength={5000}
                    />
                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="text-neutral-500">{journalText.length}/5000 characters</span>
                      <span className="text-neutral-600 font-medium">{journalText.split(/\s+/).filter(w => w).length} words</span>
                    </div>
                  </div>

                  {analysisError && (
                    <div className="bg-neutral-100 border border-neutral-300 rounded-xl p-4 text-neutral-800 text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {analysisError}
                    </div>
                  )}

                  <button
                    onClick={saveEntry}
                    disabled={!currentAnalysis || journalText.trim().length < 10 || isAnalyzing}
                    className="w-full bg-neutral-900 text-white py-4 px-6 rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-300 ease-out font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Save className="h-5 w-5" />
                    Save Entry
                  </button>
                </div>

                {/* Live Analysis */}
                <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-neutral-900">
                    <div className="p-2 bg-neutral-900 rounded-lg text-white">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    Live Symbolic Analysis
                    {isAnalyzing && <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />}
                  </h3>

                  {currentAnalysis ? (
                    <div className="space-y-6">
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                        <div className="text-center space-y-4">
                          <RotationVisualizer rotation={currentAnalysis.symbols.rotation} meaningDepth={currentAnalysis.symbols.meaningDepth} />
                          <div>
                            <h4 className="font-semibold text-neutral-900 text-lg">{currentAnalysis.symbols.rotation}° Rotation</h4>
                            <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{getRotationPhaseDescription(currentAnalysis.symbols.rotation)}</p>
                          </div>
                        </div>
                      </div>

                      {currentAnalysis.symbols.concepts.length > 0 && (
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                          <h4 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                            <Target className="h-4 w-4 text-neutral-500" />
                            Dominant Concepts
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {currentAnalysis.symbols.concepts.slice(0, 8).map((concept, idx) => (
                              <ConceptBadge key={idx} concept={concept.concept} strength={concept.strength} isActive={idx < 3} />
                            ))}
                          </div>
                        </div>
                      )}

                      <RiskIndicator level={currentAnalysis.recovery.riskLevel} triggers={currentAnalysis.recovery.triggers} />

                      {currentAnalysis.recovery.copingOpportunities.length > 0 && (
                        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-6">
                          <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Suggested Coping Strategies
                          </h4>
                          <ul className="space-y-2">
                            {currentAnalysis.recovery.copingOpportunities.map((strategy, idx) => (
                              <li key={idx} className="text-neutral-700 flex items-start gap-2">
                                <span className="text-neutral-400 mt-1">—</span>
                                <span className="text-sm leading-relaxed">{strategy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                          <p className="text-neutral-600">Analyzing symbolic patterns...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto">
                            <Brain className="h-8 w-8 text-neutral-400" />
                          </div>
                          <p className="text-neutral-500">Start writing to see symbolic analysis...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════ ANALYSIS TAB ═════════ */}
            {activeTab === 'analysis' && currentAnalysis && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-neutral-900 rounded-lg text-white"><RotateCcw className="h-5 w-5" /></div>
                      <h3 className="font-semibold text-neutral-800">Symbolic Rotation</h3>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900 mb-2">{currentAnalysis.symbols.rotation}°</div>
                    <p className="text-sm text-neutral-600">
                      {currentAnalysis.symbols.rotation < 90 ? 'Foundation Phase' :
                        currentAnalysis.symbols.rotation < 180 ? 'Growth Phase' :
                        currentAnalysis.symbols.rotation < 270 ? 'Transformation Phase' : 'Integration Phase'}
                    </p>
                  </div>

                  <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-neutral-900 rounded-lg text-white"><Brain className="h-5 w-5" /></div>
                      <h3 className="font-semibold text-neutral-800">Meaning Depth</h3>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900 mb-2">{Number(currentAnalysis.symbols.meaningDepth).toFixed(1)}%</div>
                    <p className="text-sm text-neutral-600">Semantic complexity score</p>
                  </div>

                  <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-neutral-900 rounded-lg text-white"><Target className="h-5 w-5" /></div>
                      <h3 className="font-semibold text-neutral-800">Active Concepts</h3>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900 mb-2">{currentAnalysis.symbols.concepts.length}</div>
                    <p className="text-sm text-neutral-600">Symbolic resonance points</p>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 text-neutral-900">Concept Mapping</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-neutral-500" /> Primary Concepts
                      </h4>
                      <div className="space-y-4">
                        {currentAnalysis.symbols.concepts.length > 0 ? (
                          currentAnalysis.symbols.concepts.map((concept, idx) => (
                            <div key={idx} className="border-l-4 border-neutral-900 pl-6 py-2 bg-neutral-50 rounded-r-lg">
                              <div className="font-semibold text-neutral-900">{concept.concept}</div>
                              <div className="text-sm text-neutral-600 mb-2">Strength: {(concept.strength * 100).toFixed(1)}%</div>
                              <div className="text-xs text-neutral-500">
                                Shades: {concept.shades.slice(0, 3).join(', ')}
                                {concept.shades.length > 3 && ` +${concept.shades.length - 3} more`}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-neutral-500 italic">No strong concept matches found</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-neutral-500" /> Recovery Analysis
                      </h4>
                      <div className="space-y-4">
                        <RiskIndicator level={currentAnalysis.recovery.riskLevel} triggers={currentAnalysis.recovery.triggers} />
                        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                          <div className="font-medium text-neutral-800 mb-1">Emotional Trajectory</div>
                          <div className="text-sm text-neutral-600 capitalize">{currentAnalysis.recovery.emotionalTrajectory}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && !currentAnalysis && (
              <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200">
                <Eye className="h-16 w-16 text-neutral-300 mx-auto mb-6" />
                <h4 className="text-lg font-medium text-neutral-600 mb-2">No Analysis Available</h4>
                <p className="text-neutral-500">Write a journal entry first to generate symbolic analysis.</p>
              </div>
            )}

            {/* ═════════ MEMORY BANK TAB ═════════ */}
            {activeTab === 'memory' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                    <Book className="h-6 w-6 text-neutral-500" /> Memory Bank
                  </h3>
                  <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">{entries.length} entries stored</span>
                </div>

                {entries.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200">
                    <Calendar className="h-16 w-16 text-neutral-300 mx-auto mb-6" />
                    <h4 className="text-lg font-medium text-neutral-600 mb-2">Your Journey Begins Here</h4>
                    <p className="text-neutral-500">Start journaling to build your memory bank and track your recovery journey.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map(entry => (
                      <div key={entry.id} className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-sm text-neutral-500">
                            {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
                          </div>
                          <RiskIndicator level={entry.analysis.recovery.riskLevel} triggers={[]} />
                        </div>
                        <p className="text-neutral-800 mb-4 leading-relaxed">
                          {entry.text.length > 200 ? `${entry.text.substring(0, 200)}...` : entry.text}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {entry.analysis.symbols.concepts.slice(0, 4).map((concept, idx) => (
                            <ConceptBadge key={idx} concept={concept.concept} strength={concept.strength} />
                          ))}
                          <span className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-full">{entry.analysis.symbols.rotation}° rotation</span>
                          <span className="text-xs bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full">{Number(entry.analysis.symbols.meaningDepth).toFixed(0)}% depth</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═════════ PROGRESS TAB ═════════ */}
            {activeTab === 'progress' && (
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-neutral-500" /> Recovery Progress Insights
                </h3>

                {weeklyInsights ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                      <h4 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-neutral-500" /> Weekly Overview
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                          <span className="text-neutral-600">Risk Trend:</span>
                          <span className={`font-semibold ${getTrendColor(weeklyInsights.riskTrend)}`}>{weeklyInsights.riskTrend}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                          <span className="text-neutral-600">Primary Trigger:</span>
                          <span className="font-medium text-neutral-800">{weeklyInsights.primaryTrigger || 'None identified'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                          <span className="text-neutral-600">Avg Meaning Depth:</span>
                          <span className="font-medium text-neutral-700">{Number(weeklyInsights.averageMeaningDepth).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                          <span className="text-neutral-600">Forward Focus:</span>
                          <span className="font-medium text-neutral-700">{(weeklyInsights.emotionalBalance * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-neutral-600">Total Entries:</span>
                          <span className="font-medium text-neutral-800">{weeklyInsights.totalEntries}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                      <h4 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
                        <Target className="h-5 w-5 text-neutral-500" /> Recent Patterns
                      </h4>
                      <div className="space-y-3">
                        {entries.slice(0, 5).map((entry, idx) => {
                          const concepts = entry.analysis.symbols.concepts.slice(0, 2);
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                              <span className="text-sm text-neutral-600">{entry.timestamp.toLocaleDateString()}</span>
                              <div className="flex gap-2">
                                {concepts.map((concept, cidx) => (
                                  <ConceptBadge key={cidx} concept={concept.concept} strength={concept.strength} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center">
                    <Target className="h-16 w-16 text-neutral-300 mx-auto mb-6" />
                    <h4 className="text-lg font-semibold text-neutral-700 mb-3">Building Your Progress Profile</h4>
                    <p className="text-neutral-600 leading-relaxed">
                      Keep journaling to unlock detailed progress insights and pattern recognition.
                      We need at least 3 entries to generate meaningful analytics.
                    </p>
                  </div>
                )}

                {entries.length > 0 && (
                  <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                    <h4 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
                      <RotateCcw className="h-5 w-5 text-neutral-500" /> Recent Symbolic Rotations
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {entries.slice(0, 10).map((entry, idx) => (
                        <div key={idx} className="bg-neutral-100 text-neutral-800 px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200">
                          {entry.timestamp.toLocaleDateString()}: {entry.analysis.symbols.rotation}°
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SoulMirror;
