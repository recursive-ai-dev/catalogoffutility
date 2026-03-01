/**
 * Story Service for managing narrative arcs and character development
 * Enhances player engagement by providing overarching storylines and meaningful choices
 */

import { GameState } from '../types/game';
import { CacheService } from './cacheService';

export interface StoryArc {
  id: string;
  title: string;
  description: string;
  chapters: StoryChapter[];
  prerequisites: {
    daysSurvived?: number;
    locationsVisited?: number;
    achievements?: string[];
  };
  status: 'locked' | 'active' | 'completed';
  progress: number; // 0 to 100
  teaser: string;
  rewards: StoryReward[];
}

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  locationId?: string; // Specific location for this chapter, if any
  objectives: StoryObjective[];
  dialogue?: StoryDialogue[];
  status: 'pending' | 'active' | 'completed';
}

export interface StoryObjective {
  id: string;
  description: string;
  type: 'visit_location' | 'interact_npc' | 'answer_question' | 'collect_item' | 'survive_days';
  targetId?: string; // Location, NPC, or Item ID
  requiredCount: number;
  currentCount: number;
  status: 'pending' | 'active' | 'completed';
}

export interface StoryDialogue {
  speaker: string; // NPC name or 'Narrator'
  text: string;
  choices?: StoryChoice[];
  triggerCondition?: {
    objectiveId?: string;
    locationId?: string;
    dayRange?: [number, number]; // Range of days survived
  };
}

export interface StoryChoice {
  text: string;
  response: string; // What the NPC or narrator says in response
  effect?: {
    sanityChange?: number;
    relationshipChange?: { npcId: string; value: number };
    unlockObjective?: string;
    completeObjective?: string;
    branchToChapter?: string; // ID of the chapter to branch to based on this choice
    stateChange?: { key: string; value: any }; // Visible state change in the game world or narrative
  };
}

export interface StoryReward {
  type: 'sanity' | 'item' | 'achievement' | 'cosmetic' | 'story_unlock';
  value: number | string;
  description: string;
}

export class StoryService {
  private static instance: StoryService;
  private cacheService: CacheService;
  private storyArcs: Map<string, StoryArc> = new Map();
  private activeDialogues: StoryDialogue[] = [];

  private constructor() {
    this.cacheService = CacheService.getInstance();
    this.initializeStoryArcs();
    this.loadStoryProgress();
  }

  static getInstance(): StoryService {
    if (!StoryService.instance) {
      StoryService.instance = new StoryService();
    }
    return StoryService.instance;
  }

  private initializeStoryArcs(): void {
    const initialArcs: StoryArc[] = [
      {
        id: 'lost_memories',
        title: 'Lost Memories',
        description: 'Uncover the mystery of your past as fragmented memories resurface in strange places.',
        chapters: [
          {
            id: 'memory_ch1',
            title: 'A Familiar Feeling',
            description: 'A strange sense of déjà vu strikes you at the lake.',
            locationId: 'lake',
            objectives: [
              {
                id: 'visit_lake',
                description: 'Visit the Lake to trigger a memory',
                type: 'visit_location',
                targetId: 'lake',
                requiredCount: 1,
                currentCount: 0,
                status: 'pending'
              },
              {
                id: 'speak_lake_entity',
                description: 'Speak with the Mysterious Entity at the Lake',
                type: 'interact_npc',
                targetId: 'lake_mysterious_entity',
                requiredCount: 1,
                currentCount: 0,
                status: 'pending'
              }
            ],
            dialogue: [
              {
                speaker: 'Narrator',
                text: 'As you approach the lake, a wave of familiarity washes over you. Have you been here before?',
                triggerCondition: { objectiveId: 'visit_lake' }
              },
              {
                speaker: 'Mysterious Entity',
                text: 'You seem troubled, traveler. What do you remember of this place?',
                choices: [
                  {
                    text: 'I feel like I’ve been here before. I trust you to guide me.',
                    response: 'Yes, your eyes carry a hint of recognition. I will guide you to the truth.',
                    effect: { 
                      sanityChange: 5,
                      relationshipChange: { npcId: 'lake_mysterious_entity', value: 10 },
                      branchToChapter: 'memory_ch3_path1',
                      stateChange: { key: 'entity_trust', value: true }
                    }
                  },
                  {
                    text: 'Nothing, it’s just another strange place. I’ll find answers on my own.',
                    response: 'Perhaps... or perhaps your mind hides truths from you. Be wary of the path you choose.',
                    effect: { 
                      relationshipChange: { npcId: 'lake_mysterious_entity', value: -5 },
                      branchToChapter: 'memory_ch3_path2',
                      stateChange: { key: 'entity_trust', value: false }
                    }
                  }
                ],
                triggerCondition: { objectiveId: 'speak_lake_entity' }
              }
            ],
            status: 'pending'
          },
          {
            id: 'memory_ch2',
            title: 'Echoes of the Past',
            description: 'Memories begin to surface, pointing towards the ruins.',
            locationId: 'ruins',
            objectives: [
              {
                id: 'visit_ruins',
                description: 'Visit the Ruins to uncover more memories',
                type: 'visit_location',
                targetId: 'ruins',
                requiredCount: 1,
                currentCount: 0,
                status: 'pending'
              }
            ],
            status: 'pending'
          },
          {
            id: 'memory_ch3_path1',
            title: 'Path of Trust',
            description: 'You choose to trust the entity, leading to a deeper connection.',
            locationId: 'lake',
            objectives: [
              {
                id: 'deepen_trust',
                description: 'Deepen your trust with the Mysterious Entity',
                type: 'interact_npc',
                targetId: 'lake_mysterious_entity',
                requiredCount: 1,
                currentCount: 0,
                status: 'pending'
              }
            ],
            dialogue: [
              {
                speaker: 'Mysterious Entity',
                text: 'Your trust honors me. Together, we can uncover hidden truths.',
                triggerCondition: { objectiveId: 'deepen_trust' }
              }
            ],
            status: 'pending'
          },
          {
            id: 'memory_ch3_path2',
            title: 'Path of Doubt',
            description: 'You doubt the entity, choosing to seek answers alone.',
            locationId: 'ruins',
            objectives: [
              {
                id: 'search_alone',
                description: 'Search the Ruins for answers on your own',
                type: 'visit_location',
                targetId: 'ruins',
                requiredCount: 1,
                currentCount: 0,
                status: 'pending'
              }
            ],
            dialogue: [
              {
                speaker: 'Narrator',
                text: 'You turn away from the entity, feeling a chill of uncertainty. The ruins loom ahead, holding secrets you must uncover alone.',
                triggerCondition: { objectiveId: 'search_alone' }
              }
            ],
            status: 'pending'
          }
        ],
        prerequisites: {
          daysSurvived: 2
        },
        status: 'locked',
        progress: 0,
        teaser: 'A forgotten memory stirs within...',
        rewards: [
          { type: 'sanity', value: 20, description: 'Sanity boost for uncovering memories' },
          { type: 'achievement', value: 'memory_seeker', description: 'Memory Seeker Achievement' }
        ]
      },
      {
        id: 'ancient_prophecy',
        title: 'Ancient Prophecy',
        description: 'Discover an ancient prophecy that may hold the key to escaping this trapped world.',
        chapters: [
          {
            id: 'prophecy_ch1',
            title: 'Whispers of Fate',
            description: 'An old tale speaks of a prophecy hidden in the tower.',
            locationId: 'tower',
            objectives: [
              {
                id: 'visit_tower',
                description: 'Visit the Tower to learn of the prophecy',
                type: 'visit_location',
                targetId: 'tower',
                requiredCount: 1,
                currentCount: 0,
                status: 'pending'
              }
            ],
            status: 'pending'
          }
        ],
        prerequisites: {
          daysSurvived: 5,
          locationsVisited: 3
        },
        status: 'locked',
        progress: 0,
        teaser: 'An ancient truth awaits discovery...',
        rewards: [
          { type: 'story_unlock', value: 'prophecy_resolution', description: 'Unlock the resolution of the prophecy' }
        ]
      }
    ];

    initialArcs.forEach(arc => {
      this.storyArcs.set(arc.id, arc);
    });
  }

  async updateStoryProgress(gameState: GameState): Promise<void> {
    for (const [, arc] of this.storyArcs) {
      if (arc.status === 'locked') {
        let canUnlock = true;
        if (arc.prerequisites.daysSurvived) {
          canUnlock = canUnlock && gameState.daysSurvived >= arc.prerequisites.daysSurvived;
        }
        if (arc.prerequisites.locationsVisited) {
          canUnlock = canUnlock && gameState.visitedLocations.size >= arc.prerequisites.locationsVisited;
        }
        if (arc.prerequisites.achievements) {
          canUnlock = canUnlock && arc.prerequisites.achievements.every(achId => 
            gameState.achievements.some(a => a.id === achId)
          );
        }
        if (canUnlock) {
          arc.status = 'active';
          arc.chapters[0].status = 'active';
          console.log(`📖 Story arc unlocked: ${arc.title}`);
        }
      }

      if (arc.status === 'active') {
        let totalObjectives = 0;
        let completedObjectives = 0;

        arc.chapters.forEach(chapter => {
          if (chapter.status === 'active' || chapter.status === 'completed') {
            chapter.objectives.forEach(obj => {
              totalObjectives++;
              if (obj.status === 'completed') {
                completedObjectives++;
              } else {
                // Update objective progress based on game state
                if (obj.type === 'visit_location' && obj.targetId && gameState.visitedLocations.has(obj.targetId as any)) {
                  obj.currentCount = 1;
                  obj.status = 'completed';
                  completedObjectives++;
                } else if (obj.type === 'interact_npc' && obj.targetId && gameState.answeredNPCs.has(obj.targetId as any)) {
                  obj.currentCount = 1;
                  obj.status = 'completed';
                  completedObjectives++;
                } else if (obj.type === 'survive_days' && gameState.daysSurvived >= obj.requiredCount) {
                  obj.currentCount = gameState.daysSurvived;
                  obj.status = 'completed';
                  completedObjectives++;
                }
              }
            });

            // Check if all objectives in chapter are completed
            if (chapter.objectives.every(o => o.status === 'completed') && chapter.status === 'active') {
              chapter.status = 'completed';
              console.log(`📖 Chapter completed: ${chapter.title}`);
              // Unlock next chapter if available
              const currentChapterIndex = arc.chapters.findIndex(c => c.id === chapter.id);
              if (currentChapterIndex < arc.chapters.length - 1) {
                arc.chapters[currentChapterIndex + 1].status = 'active';
                console.log(`📖 Next chapter unlocked: ${arc.chapters[currentChapterIndex + 1].title}`);
              }
            }
          }
        });

        arc.progress = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

        if (arc.chapters.every(c => c.status === 'completed') && arc.status === 'active') {
          arc.status = 'completed';
          console.log(`📖 Story arc completed: ${arc.title}`);
          // Trigger rewards for story arc completion
          await this.triggerStoryArcRewards(arc, gameState);
        }
      }
    }

    // Update active dialogues based on current game state
    this.updateActiveDialogues(gameState);

    await this.saveStoryProgress();
  }

  private updateActiveDialogues(gameState: GameState): void {
    this.activeDialogues = [];

    for (const arc of this.storyArcs.values()) {
      if (arc.status === 'active') {
        for (const chapter of arc.chapters) {
          if (chapter.status === 'active' && chapter.dialogue) {
            for (const dialogue of chapter.dialogue) {
              let shouldTrigger = true;
              if (dialogue.triggerCondition) {
                if (dialogue.triggerCondition.objectiveId) {
                  const obj = chapter.objectives.find(o => o.id === dialogue.triggerCondition!.objectiveId);
                  shouldTrigger = shouldTrigger && obj?.status === 'completed';
                }
                if (dialogue.triggerCondition.locationId) {
                  shouldTrigger = shouldTrigger && gameState.currentLocation === dialogue.triggerCondition.locationId;
                }
                if (dialogue.triggerCondition.dayRange) {
                  shouldTrigger = shouldTrigger && 
                    gameState.daysSurvived >= dialogue.triggerCondition.dayRange[0] && 
                    gameState.daysSurvived <= dialogue.triggerCondition.dayRange[1];
                }
              }
              if (shouldTrigger) {
                this.activeDialogues.push(dialogue);
              }
            }
          }
        }
      }
    }
  }

  getActiveStoryArcs(): StoryArc[] {
    return Array.from(this.storyArcs.values()).filter(arc => arc.status !== 'locked');
  }

  getAllStoryArcs(): StoryArc[] {
    return Array.from(this.storyArcs.values());
  }

  getActiveDialogues(): StoryDialogue[] {
    return this.activeDialogues;
  }

  async processPlayerChoice(dialogueIndex: number, choiceIndex: number, gameState: GameState): Promise<{
    success: boolean;
    responseText?: string;
    gameStateUpdate?: Partial<GameState>;
    message?: string;
  }> {
    if (dialogueIndex < 0 || dialogueIndex >= this.activeDialogues.length) {
      return { success: false, message: 'Invalid dialogue selection' };
    }

    const dialogue = this.activeDialogues[dialogueIndex];
    if (!dialogue.choices || choiceIndex < 0 || choiceIndex >= dialogue.choices.length) {
      return { success: false, message: 'Invalid choice selection' };
    }

    const choice = dialogue.choices[choiceIndex];
    let gameStateUpdate: Partial<GameState> = {};
    let message = '';

    if (choice.effect) {
      if (choice.effect.sanityChange) {
        gameStateUpdate.sanity = Math.min(120, Math.max(0, gameState.sanity + choice.effect.sanityChange)) as any;
        message += `Sanity ${choice.effect.sanityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(choice.effect.sanityChange)}. `;
      }
      if (choice.effect.relationshipChange) {
        if (!gameStateUpdate.relationships) {
          gameStateUpdate.relationships = { ...gameState.relationships };
        }
        gameStateUpdate.relationships[choice.effect.relationshipChange.npcId] = 
          (gameStateUpdate.relationships[choice.effect.relationshipChange.npcId] || 0) + choice.effect.relationshipChange.value;
        message += `Relationship with ${choice.effect.relationshipChange.npcId} changed by ${choice.effect.relationshipChange.value}. `;
      }
      if (choice.effect.unlockObjective) {
        // Unlock specific objective in story arc
        this.unlockObjective(choice.effect.unlockObjective);
        message += `New objective unlocked. `;
      }
      if (choice.effect.completeObjective) {
        // Mark specific objective as completed
        this.completeObjective(choice.effect.completeObjective);
        message += `Objective completed. `;
      }
      if (choice.effect.branchToChapter) {
        // Find the relevant story arc and update the active chapter
        for (const arc of this.storyArcs.values()) {
          const currentChapter = arc.chapters.find(ch => ch.status === 'active');
          if (currentChapter) {
            currentChapter.status = 'completed';
            const targetChapter = arc.chapters.find(ch => ch.id === choice.effect!.branchToChapter);
            if (targetChapter) {
              targetChapter.status = 'active';
              message += `Story branched to chapter: ${targetChapter.title}. `;
            }
          }
        }
      }
      if (choice.effect.stateChange) {
        if (!gameStateUpdate.storyState) {
          gameStateUpdate.storyState = { ...gameState.storyState };
        }
        gameStateUpdate.storyState[choice.effect.stateChange.key] = choice.effect.stateChange.value;
        message += `Story state updated: ${choice.effect.stateChange.key} is now ${choice.effect.stateChange.value}. `;
      }
    }

    // Remove the dialogue from active list if it's a one-time interaction
    this.activeDialogues.splice(dialogueIndex, 1);

    await this.saveStoryProgress();
    return {
      success: true,
      responseText: choice.response,
      gameStateUpdate,
      message
    };
  }

  private async saveStoryProgress(): Promise<void> {
    const storyData = Array.from(this.storyArcs.values());
    await this.cacheService.set('storyProgress', storyData);
  }

  private async loadStoryProgress(): Promise<void> {
    const saved = await this.cacheService.get<StoryArc[]>('storyProgress');
    if (saved) {
      saved.forEach(arc => {
        this.storyArcs.set(arc.id, arc);
      });
    }
  }

  /**
   * Trigger rewards when a story arc is completed
   */
  private async triggerStoryArcRewards(arc: StoryArc, gameState: GameState): Promise<void> {
    try {
      // Import rewards service for future integration
      await import('./rewardsService');
      
      for (const reward of arc.rewards) {
        switch (reward.type) {
          case 'sanity':
            if (typeof reward.value === 'number') {
              const newSanity = Math.min(120, gameState.sanity + reward.value);
              console.log(`🎁 Story reward: +${reward.value} sanity (${reward.description}). New sanity: ${newSanity}`);
              // Note: Actual sanity update would need to go through game engine
            }
            break;
          case 'achievement':
            if (typeof reward.value === 'string') {
              console.log(`🏆 Story reward: Achievement unlocked - ${reward.value}`);
            }
            break;
          case 'cosmetic':
            if (typeof reward.value === 'string') {
              console.log(`✨ Story reward: Cosmetic unlocked - ${reward.value}`);
            }
            break;
          case 'story_unlock':
            if (typeof reward.value === 'string') {
              console.log(`📖 Story reward: New story unlocked - ${reward.value}`);
            }
            break;
        }
      }
      
      console.log(`🎉 Story arc "${arc.title}" rewards granted!`);
    } catch (error) {
      console.error('Failed to trigger story arc rewards:', error);
    }
  }

  /**
   * Unlock a specific objective by ID across all story arcs
   */
  private unlockObjective(objectiveId: string): void {
    for (const arc of this.storyArcs.values()) {
      for (const chapter of arc.chapters) {
        const objective = chapter.objectives.find(obj => obj.id === objectiveId);
        if (objective && objective.status === 'pending') {
          objective.status = 'active';
          console.log(`🔓 Objective unlocked: ${objective.description}`);
          return;
        }
      }
    }
    console.warn(`Objective not found for unlocking: ${objectiveId}`);
  }

  /**
   * Mark a specific objective as completed by ID across all story arcs
   */
  private completeObjective(objectiveId: string): void {
    for (const arc of this.storyArcs.values()) {
      for (const chapter of arc.chapters) {
        const objective = chapter.objectives.find(obj => obj.id === objectiveId);
        if (objective && objective.status !== 'completed') {
          objective.status = 'completed';
          objective.currentCount = objective.requiredCount;
          console.log(`✅ Objective completed: ${objective.description}`);
          return;
        }
      }
    }
    console.warn(`Objective not found for completion: ${objectiveId}`);
  }
}

export const storyService = StoryService.getInstance();
