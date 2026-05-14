import type { CardInstance, StatusId } from '@/game/cards/cardTypes';
import type { EquippedItems } from '@/game/equipment/equipmentTypes';

export type CombatActor = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  statuses: Partial<Record<StatusId, number>>;
};

export type CombatPhase = 'playerTurn' | 'enemyTurn' | 'won' | 'lost';

export type CombatLogItem = {
  id: string;
  text: string;
};

export type CombatState = {
  phase: CombatPhase;
  turn: number;
  maxEnergy: number;
  energy: number;
  handSize: number;
  maxHandSize: number;
  player: CombatActor;
  enemy: CombatActor;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  equippedItems: EquippedItems;
  log: CombatLogItem[];
};
