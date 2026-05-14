export type EquipmentSlot =
  | 'weapon'
  | 'body'
  | 'pants'
  | 'boots'
  | 'utility';

export type EquipmentRarity = 'gray' | 'green' | 'blue' | 'orange';

export type EquipmentModifier =
  | {
      type: 'burnAmountBonus';
      amount: number;
    }
  | {
      type: 'aimAmountBonus';
      amount: number;
    }
  | {
      type: 'damageAgainstAimedBonus';
      amount: number;
    }
  | {
      type: 'blockFromSkillsBonus';
      amount: number;
    }
  | {
      type: 'maxHandSizeBonus';
      amount: number;
    }
  | {
      type: 'maxEnergyBonus';
      amount: number;
    }
  | {
      type: 'moneyLootBonusPercent';
      amount: number;
    }
  | {
      type: 'itemLootBonusPercent';
      amount: number;
    }
  | {
      type: 'canEscapeCombat';
      amount: number;
    };

export type EquipmentItem = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  description: string;
  modifiers: EquipmentModifier[];
};

export type EquippedItems = Partial<Record<EquipmentSlot, EquipmentItem>>;
