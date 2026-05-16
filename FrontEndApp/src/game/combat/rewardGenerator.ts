import { tatianaRewardCards } from '@/game/cards/starterCards';
import type { CardDefinition } from '@/game/cards/cardTypes';
import type { CombatRewardLootItem, CombatRewardState } from './rewardTypes';

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleCopy = <T>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const forestLootPool: CombatRewardLootItem[] = [
  {
    id: 'timber-planks',
    name: 'Пиломатериалы',
    kind: 'material',
    amount: 1,
    rarity: 'common',
    description: 'Обработанные доски со старой лесопилки.',
  },
  {
    id: 'old-tools',
    name: 'Инструменты',
    kind: 'material',
    amount: 1,
    rarity: 'common',
    description: 'Набор ржавых, но всё ещё полезных инструментов.',
  },
  {
    id: 'animal-parts',
    name: 'Части мутировавшего зверя',
    kind: 'loot',
    amount: 1,
    rarity: 'common',
    description: 'Органические материалы, которые могут заинтересовать торговцев.',
  },
  {
    id: 'rusty-robot-parts',
    name: 'Ржавые детали робота',
    kind: 'component',
    amount: 1,
    rarity: 'common',
    description: 'Простые детали от старых автономных машин.',
  },
  {
    id: 'gray-defense-plate',
    name: 'Серая бронепластина',
    kind: 'loot',
    amount: 1,
    rarity: 'common',
    description: 'Слабая бронепластина. Позже её можно будет экипировать или продать.',
  },
  {
    id: 'green-battery-pack',
    name: 'Зелёный батарейный блок',
    kind: 'component',
    amount: 1,
    rarity: 'uncommon',
    description: 'Редкая для леса находка. Может пригодиться для улучшений.',
  },
];

const createRewardLoot = (): CombatRewardLootItem[] => {
  const result: CombatRewardLootItem[] = [];

  if (Math.random() <= 0.2) {
    result.push({ ...forestLootPool[Math.floor(Math.random() * forestLootPool.length)] });
  }

  if (Math.random() <= 0.1) {
    result.push({ ...forestLootPool[Math.floor(Math.random() * forestLootPool.length)] });
  }

  return result;
};

const createCardChoices = (): CardDefinition[] => shuffleCopy(tatianaRewardCards).slice(0, 3);

export const createCombatReward = (isBossReward = false): CombatRewardState => ({
  isBossReward,
  cardChoices: createCardChoices(),
  isCardRewardTaken: false,
  money: isBossReward ? randomInt(100, 150) : randomInt(20, 40),
  isMoneyTaken: false,
  loot: createRewardLoot(),
  isLootTaken: false,
});
