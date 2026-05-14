import { createStarterDeckCardIds } from '@/game/cards/starterCards';
import type { CardInstance } from '@/game/cards/cardTypes';
import { startingEquipment } from '@/game/equipment/startingEquipment';
import type { EquippedItems } from '@/game/equipment/equipmentTypes';
import type { CombatEnemy, CombatState, EnemyIntent } from './combatTypes';
import { shuffle } from './random';

const createCardInstances = (cardIds: string[]): CardInstance[] =>
  cardIds.map((cardId, index) => ({
    cardId,
    instanceId: `${cardId}-${index}-${crypto.randomUUID()}`,
  }));

const enemyIntents: EnemyIntent[] = [
  { type: 'attack', damage: 7, hits: 1, label: 'Атака' },
  { type: 'attack', damage: 4, hits: 2, label: 'Атака' },
  { type: 'block', block: 8, label: 'Защита' },
  { type: 'debuff', status: 'weak', amount: 1, label: 'Дебафф' },
];

export const createEnemyIntent = (): EnemyIntent => {
  const intent = enemyIntents[Math.floor(Math.random() * enemyIntents.length)];
  return { ...intent };
};

const createRustyBot = (index: number): CombatEnemy => ({
  id: `rusty-bot-${index}`,
  name: index === 1 ? 'Ржавый робот' : `Ржавый робот ${index}`,
  hp: index === 1 ? 42 : 34,
  maxHp: index === 1 ? 42 : 34,
  block: 0,
  statuses: {},
  intent: createEnemyIntent(),
});

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
      name: 'Искательница с энергетическим щитом',
      hp: 70,
      maxHp: 70,
      block: 0,
      statuses: {},
    },
    enemies: [createRustyBot(1), createRustyBot(2), createRustyBot(3)],
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    equippedItems,
    log: [
      {
        id: crypto.randomUUID(),
        text: 'Бой начался. Энергетический щит готов к развёртыванию.',
      },
    ],
  };
};
