import type { CardDefinition } from './cardTypes';

export const starterCards: CardDefinition[] = [
  {
    id: 'basic-shot',
    name: 'Обычный выстрел',
    type: 'attack',
    target: 'enemy',
    rarity: 'starter',
    cost: 1,
    description: 'Наносит урон выбранному врагу.',
    effects: [
      {
        type: 'damage',
        amount: 6,
        target: 'enemy',
      },
    ],
  },
  {
    id: 'raise-shield',
    name: 'Поднять щит',
    type: 'skill',
    target: 'self',
    rarity: 'starter',
    cost: 1,
    description: 'Даёт 5 брони.',
    effects: [
      {
        type: 'block',
        amount: 5,
        target: 'player',
      },
    ],
  },
  {
    id: 'reload',
    name: 'Перезарядка',
    type: 'skill',
    target: 'self',
    rarity: 'starter',
    cost: 0,
    exhaust: true,
    description: 'Даёт 1 энергию. Расходуется до конца боя.',
    effects: [
      {
        type: 'gainEnergy',
        amount: 1,
      },
    ],
  },
  {
    id: 'roll',
    name: 'Перекат',
    type: 'skill',
    target: 'self',
    rarity: 'starter',
    cost: 1,
    description: 'Даёт 5 брони. Возьмите 2 карты.',
    effects: [
      {
        type: 'block',
        amount: 5,
        target: 'player',
      },
      {
        type: 'draw',
        amount: 2,
      },
    ],
  },
];

export const commonCards: CardDefinition[] = [
  {
    id: 'aimed-shot',
    name: 'Прицельный выстрел',
    type: 'attack',
    target: 'enemy',
    rarity: 'common',
    cost: 1,
    description: 'Наносит урон и накладывает 2 Прицела.',
    tags: ['aim'],
    effects: [
      {
        type: 'damage',
        amount: 5,
        target: 'enemy',
      },
      {
        type: 'applyStatus',
        status: 'aim',
        amount: 2,
        target: 'enemy',
      },
    ],
  },
  {
    id: 'incendiary-shot',
    name: 'Зажигательный выстрел',
    type: 'attack',
    target: 'enemy',
    rarity: 'common',
    cost: 1,
    description: 'Наносит урон и накладывает 3 Горения.',
    tags: ['burn'],
    effects: [
      {
        type: 'damage',
        amount: 4,
        target: 'enemy',
      },
      {
        type: 'applyStatus',
        status: 'burn',
        amount: 3,
        target: 'enemy',
      },
    ],
  },
  {
    id: 'suppressive-fire',
    name: 'Подавляющий огонь',
    type: 'attack',
    target: 'all-enemies',
    rarity: 'common',
    cost: 2,
    description: 'Наносит урон всем врагам.',
    effects: [
      {
        type: 'damage',
        amount: 4,
        target: 'all-enemies',
      },
    ],
  },
  {
    id: 'barrier',
    name: 'Барьер',
    type: 'skill',
    target: 'self',
    rarity: 'common',
    cost: 2,
    description: 'Даёт 12 брони.',
    effects: [
      {
        type: 'block',
        amount: 12,
        target: 'player',
      },
    ],
  },
  {
    id: 'reinforced-battery',
    name: 'Усиленная батарея',
    type: 'talent',
    target: 'self',
    rarity: 'uncommon',
    cost: 1,
    exhaust: true,
    description: 'До конца боя сохраняет 50% брони после хода врагов.',
    effects: [
      {
        type: 'applyStatus',
        status: 'reinforcedBattery',
        amount: 1,
        target: 'player',
      },
    ],
  },
];

export const cardLibrary: CardDefinition[] = [...starterCards, ...commonCards];

export const getCardById = (cardId: string): CardDefinition => {
  const card = cardLibrary.find((item) => item.id === cardId);

  if (!card) {
    throw new Error(`Card with id "${cardId}" was not found.`);
  }

  return card;
};

export const createStarterDeckCardIds = (): string[] => [
  'basic-shot',
  'basic-shot',
  'basic-shot',
  'raise-shield',
  'raise-shield',
  'raise-shield',
  'reload',
  'roll',
  'suppressive-fire',
  'reinforced-battery',
];
