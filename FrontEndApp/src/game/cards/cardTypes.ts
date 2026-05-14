export type CardType = 'attack' | 'skill' | 'talent';

export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare';

export type StatusId =
  | 'aim'
  | 'burn'
  | 'weak'
  | 'vulnerable'
  | 'reinforcedBattery';

export type CombatTarget = 'enemy' | 'player';

export type CardEffect =
  | {
      type: 'damage';
      amount: number;
      target: CombatTarget;
    }
  | {
      type: 'block';
      amount: number;
      target: CombatTarget;
    }
  | {
      type: 'draw';
      amount: number;
    }
  | {
      type: 'gainEnergy';
      amount: number;
    }
  | {
      type: 'applyStatus';
      status: StatusId;
      amount: number;
      target: CombatTarget;
      duration?: number;
    };

export type CardDefinition = {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  exhaust?: boolean;
  description: string;
  effects: CardEffect[];
  tags?: string[];
};

export type CardInstance = {
  instanceId: string;
  cardId: string;
};
