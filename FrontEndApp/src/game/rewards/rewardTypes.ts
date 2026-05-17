import type { CardDefinition } from '@/game/cards/cardTypes';

export type RewardLootItem = {
  id: string;
  name: string;
  rarity?: string;
  type?: string;
  description?: string;
  tooltip?: string;
};

export type CombatRewardState = {
  hasCardReward: boolean;
  money: number | null;
  loot: RewardLootItem[];
};

export type CardRewardOption = {
  id: string;
  card: CardDefinition;
};
