import type { CardDefinition } from '@/game/cards/cardTypes';

export type CombatRewardLootItem = {
  id: string;
  name: string;
  kind: 'material' | 'medicine' | 'component' | 'loot';
  amount: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
};

export type CombatRewardState = {
  isBossReward: boolean;
  cardChoices: CardDefinition[];
  isCardRewardTaken: boolean;
  money: number;
  isMoneyTaken: boolean;
  loot: CombatRewardLootItem[];
  isLootTaken: boolean;
};
