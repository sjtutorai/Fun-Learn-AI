import type { ScratchRewardOption } from '../types/game';

/**
 * Transparent virtual educational Scratch & Win reward table.
 * Probabilities sum strictly to 100%. No monetary or paid mechanics.
 */
export const SCRATCH_REWARD_TABLE: ScratchRewardOption[] = [
  {
    id: 'xp-10',
    type: 'xp',
    label: '+10 Bonus XP',
    value: 10,
    probability: 24,
    color: '#0EA5E9',
    description: 'A sparkly boost to your explorer rank!',
  },
  {
    id: 'xp-25',
    type: 'xp',
    label: '+25 Bonus XP',
    value: 25,
    probability: 20,
    color: '#2563EB',
    description: 'Super brain power points added to your profile!',
  },
  {
    id: 'gems-15',
    type: 'gems',
    label: '15 Magic Gems',
    value: 15,
    probability: 18,
    color: '#10B981',
    description: 'Shiny virtual gems for your treasure chest!',
  },
  {
    id: 'xp-50',
    type: 'xp',
    label: '+50 Super XP',
    value: 50,
    probability: 14,
    color: '#8B5CF6',
    description: 'Huge XP surge toward your next level!',
  },
  {
    id: 'xp-100',
    type: 'xp',
    label: '+100 Genius XP',
    value: 100,
    probability: 6,
    color: '#F59E0B',
    description: 'Jackpot! Massive Genius XP boost!',
  },
  {
    id: 'avatar-astro',
    type: 'avatar',
    label: 'Astro Fox Avatar',
    value: 'astro-fox',
    probability: 6,
    color: '#EC4899',
    description: 'Unlocks the cosmic Astro Fox character in your Avatar Studio!',
  },
  {
    id: 'badge-star',
    type: 'badge',
    label: 'Lucky Spark Badge',
    value: 'scratch-lucky',
    probability: 6,
    color: '#F97316',
    description: 'Unlocks the special Lucky Spark virtual badge!',
  },
  {
    id: 'theme-galaxy',
    type: 'theme',
    label: 'Galaxy Quest Theme',
    value: 'galaxy',
    probability: 6,
    color: '#6366F1',
    description: 'Unlocks a brand-new colorful Galaxy Quest backdrop!',
  },
];

export function getTotalRewardProbability(): number {
  return SCRATCH_REWARD_TABLE.reduce((sum, r) => sum + r.probability, 0);
}

/**
 * Selects a virtual reward using a roll in [0, 100).
 */
export function rollVirtualReward(randomPercent: number): ScratchRewardOption {
  const clamped = Math.max(0, Math.min(99.9999, Number.isFinite(randomPercent) ? randomPercent : 0));
  let cumulative = 0;
  for (const reward of SCRATCH_REWARD_TABLE) {
    cumulative += reward.probability;
    if (clamped < cumulative) {
      return reward;
    }
  }
  return SCRATCH_REWARD_TABLE[0];
}

/**
 * Prevents duplicate claims for the same completed challenge instance ID.
 */
export function hasClaimedChallenge(claimedIds: string[], challengeInstanceId: string): boolean {
  return claimedIds.includes(challengeInstanceId);
}

/**
 * Checks if enough of the scratch foil has been rubbed off to trigger reveal.
 */
export function isScratchRevealed(scratchedRatio: number, threshold = 0.42): boolean {
  return scratchedRatio >= threshold;
}
