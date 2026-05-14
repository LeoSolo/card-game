import { createStarterDeckCardIds } from '@/game/cards/starterCards';
import type { CardInstance } from '@/game/cards/cardTypes';
import { startingEquipment } from '@/game/equipment/startingEquipment';
import type { EquippedItems } from '@/game/equipment/equipmentTypes';
import type { CombatState } from './combatTypes';
import { shuffle } from './random';

const createCardInstances = (cardIds: string[]): CardInstance[] =>
  cardIds.map((cardId, index) => ({
    cardId,
    instanceId: `${cardId}-${index}-${crypto.randomUUID()}`,
  }));

export const createInitialCombatState = (
  equippedItems: EquippedItems = startingEquipment,
): CombatState => {
  const startingDeck = createCardInstances(createStarterDeckCardIds());
  const drawPile = shuffle(startingDeck);

  return {
    phase: 'playerTurn',
    turn: 1,
    maxEnergy: 3,
    energy: 3,
    handSize: 5,
    maxHandSize: 10,
    player: {
      id: 'shield-rifle-girl',
      name: 'Искательница со щитом',
      hp: 70,
      maxHp: 70,
      block: 0,
      statuses: {},
    },
    enemy: {
      id: 'rusty-bot',
      name: 'Ржавый робот',
      hp: 45,
      maxHp: 45,
      block: 0,
      statuses: {},
    },
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    equippedItems,
    log: [
      {
        id: crypto.randomUUID(),
        text: 'Бой начался.',
      },
    ],
  };
};
