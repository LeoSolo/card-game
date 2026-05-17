import type { StatusId } from '@/game/cards/cardTypes';
import type { EnemyIntent } from '@/game/combat/combatTypes';

export const statusIcons: Record<StatusId, string> = {
  aim: '◎',
  burn: '🔥',
  weak: '↓',
  vulnerable: '◇',
  reinforcedBattery: '▣',
};

export const getIntentIcon = (intentType: EnemyIntent['type']): string => {
  if (intentType === 'attack') {
    return '⚔';
  }

  if (intentType === 'block') {
    return '🛡';
  }

  return '☣';
};

export const getIntentTitle = (intent: EnemyIntent): string => {
  if (intent.type === 'attack') {
    return 'Атака';
  }

  if (intent.type === 'block') {
    return 'Защита';
  }

  return 'Дебафф';
};

export const getIntentDescription = (intent: EnemyIntent): string => {
  if (intent.type === 'attack') {
    return `${intent.damage * intent.hits} урона`;
  }

  if (intent.type === 'block') {
    return 'Накладывает защиту.';
  }

  return 'Накладывает негативный эффект.';
};

export const formatStatusTooltip = (status: StatusId, value: number): string => {
  if (status === 'aim') {
    return `Прицел ${value}: атаки по цели наносят больше урона.`;
  }

  if (status === 'burn') {
    return `Горение ${value}: в конце хода цель получает урон.`;
  }

  if (status === 'weak') {
    return `Слабость ${value}: исходящий урон снижен на 40%.`;
  }

  if (status === 'vulnerable') {
    return `Уязвимость ${value}: входящий урон увеличен на 40%.`;
  }

  return 'Усиленная батарея: сохраняет 50% брони после хода врагов.';
};
