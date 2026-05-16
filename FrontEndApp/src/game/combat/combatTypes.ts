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

export type EnemyIntent =
  | {
      type: 'attack';
      damage: number;
      hits: number;
      label: string;
    }
  | {
      type: 'block';
      block: number;
      label: string;
    }
  | {
      type: 'debuff';
      status: StatusId;
      amount: number;
      label: string;
    };

export type CombatEnemy = CombatActor & {
  intent: EnemyIntent;
};

export type CombatPhase = 'playerTurn' | 'enemyTurn' | 'won' | 'lost';

export type CombatLogItem = {
  id: string;
  text: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  kind: 'material' | 'medicine' | 'component' | 'loot';
  amount: number;
  description: string;
};

export type CombatState = {
  phase: CombatPhase;
  turn: number;
  maxEnergy: number;
  energy: number;
  handSize: number;
  maxHandSize: number;
  player: CombatActor;
  enemies: CombatEnemy[];
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  equippedItems: EquippedItems;
  carriedItems: InventoryItem[];
  log: CombatLogItem[];
};
