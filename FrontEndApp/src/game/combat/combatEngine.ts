import { getCardById } from '@/game/cards/starterCards';
import type { CardEffect, CardInstance } from '@/game/cards/cardTypes';
import type { EquipmentModifier } from '@/game/equipment/equipmentTypes';
import type { CombatActor, CombatState } from './combatTypes';
import { shuffle } from './random';

const addLog = (state: CombatState, text: string): void => {
  state.log.unshift({
    id: crypto.randomUUID(),
    text,
  });
};

const getEquipmentModifiers = (state: CombatState): EquipmentModifier[] =>
  Object.values(state.equippedItems).flatMap((item) => item?.modifiers ?? []);

const getModifierSum = (
  state: CombatState,
  type: EquipmentModifier['type'],
): number =>
  getEquipmentModifiers(state)
    .filter((modifier) => modifier.type === type)
    .reduce((total, modifier) => total + modifier.amount, 0);

const getTarget = (state: CombatState, target: 'player' | 'enemy'): CombatActor =>
  target === 'player' ? state.player : state.enemy;

const dealDamage = (
  state: CombatState,
  target: CombatActor,
  baseAmount: number,
): void => {
  let amount = baseAmount;

  if (target.statuses.aim && target.statuses.aim > 0) {
    amount += target.statuses.aim;
    amount += getModifierSum(state, 'damageAgainstAimedBonus');
    target.statuses.aim = Math.max(0, target.statuses.aim - 1);
  }

  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  const hpDamage = amount - blocked;
  target.hp = Math.max(0, target.hp - hpDamage);

  addLog(
    state,
    `${target.name} получает ${hpDamage} урона${blocked > 0 ? `, ${blocked} заблокировано` : ''}.`,
  );
};

const applyBlock = (
  state: CombatState,
  target: CombatActor,
  amount: number,
  cardType: string,
): void => {
  const bonus = cardType === 'skill' ? getModifierSum(state, 'blockFromSkillsBonus') : 0;
  const finalBlock = amount + bonus;
  target.block += finalBlock;

  addLog(state, `${target.name} получает ${finalBlock} брони.`);
};

const applyStatus = (
  state: CombatState,
  target: CombatActor,
  effect: Extract<CardEffect, { type: 'applyStatus' }>,
): void => {
  let amount = effect.amount;

  if (effect.status === 'burn') {
    amount += getModifierSum(state, 'burnAmountBonus');
  }

  if (effect.status === 'aim') {
    amount += getModifierSum(state, 'aimAmountBonus');
  }

  target.statuses[effect.status] = (target.statuses[effect.status] ?? 0) + amount;

  const statusNames: Record<string, string> = {
    aim: 'Прицел',
    burn: 'Горение',
    weak: 'Слабость',
    vulnerable: 'Уязвимость',
    reinforcedBattery: 'Усиленная батарея',
  };

  addLog(state, `${target.name}: ${statusNames[effect.status]} +${amount}.`);
};

const checkCombatResult = (state: CombatState): void => {
  if (state.enemy.hp <= 0) {
    state.phase = 'won';
    addLog(state, 'Победа.');
    return;
  }

  if (state.player.hp <= 0) {
    state.phase = 'lost';
    addLog(state, 'Поражение. Всё, что было с собой, потеряно.');
  }
};

export const drawCards = (state: CombatState, amount: number): void => {
  for (let index = 0; index < amount; index += 1) {
    if (state.hand.length >= state.maxHandSize) {
      return;
    }

    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) {
        return;
      }

      state.drawPile = shuffle(state.discardPile);
      state.discardPile = [];
      addLog(state, 'Сброс замешан в колоду.');
    }

    const card = state.drawPile.shift();

    if (card) {
      state.hand.push(card);
    }
  }
};

const discardHand = (state: CombatState): void => {
  state.discardPile.push(...state.hand);
  state.hand = [];
};

const applyEndOfTurnStatuses = (state: CombatState, actor: CombatActor): void => {
  const burn = actor.statuses.burn ?? 0;

  if (burn > 0) {
    actor.hp = Math.max(0, actor.hp - burn);
    actor.statuses.burn = Math.max(0, burn - 1);
    addLog(state, `${actor.name} получает ${burn} урона от Горения.`);
  }
};

const resetPlayerBlockAtEndOfTurn = (state: CombatState): void => {
  if ((state.player.statuses.reinforcedBattery ?? 0) > 0) {
    state.player.block = Math.floor(state.player.block * 0.5);
    addLog(state, `Усиленная батарея сохраняет ${state.player.block} брони.`);
    return;
  }

  state.player.block = 0;
};

export const startPlayerTurn = (state: CombatState): void => {
  state.phase = 'playerTurn';
  state.energy = state.maxEnergy;
  drawCards(state, state.handSize);
  addLog(state, `Ход ${state.turn}. Энергия восстановлена.`);
};

export const playCard = (state: CombatState, cardInstanceId: string): void => {
  if (state.phase !== 'playerTurn') {
    return;
  }

  const handIndex = state.hand.findIndex((card) => card.instanceId === cardInstanceId);
  const cardInstance = state.hand[handIndex];

  if (!cardInstance) {
    return;
  }

  const card = getCardById(cardInstance.cardId);

  if (state.energy < card.cost) {
    addLog(state, `Недостаточно энергии для карты "${card.name}".`);
    return;
  }

  state.energy -= card.cost;
  state.hand.splice(handIndex, 1);

  addLog(state, `Сыграна карта "${card.name}".`);

  card.effects.forEach((effect) => {
    if (effect.type === 'damage') {
      dealDamage(state, getTarget(state, effect.target), effect.amount);
      return;
    }

    if (effect.type === 'block') {
      applyBlock(state, getTarget(state, effect.target), effect.amount, card.type);
      return;
    }

    if (effect.type === 'draw') {
      drawCards(state, effect.amount);
      return;
    }

    if (effect.type === 'gainEnergy') {
      state.energy += effect.amount;
      addLog(state, `Получено ${effect.amount} энергии.`);
      return;
    }

    if (effect.type === 'applyStatus') {
      applyStatus(state, getTarget(state, effect.target), effect);
    }
  });

  movePlayedCard(state, cardInstance, card.exhaust === true);
  checkCombatResult(state);
};

const movePlayedCard = (
  state: CombatState,
  cardInstance: CardInstance,
  shouldExhaust: boolean,
): void => {
  if (shouldExhaust) {
    state.exhaustPile.push(cardInstance);
    return;
  }

  state.discardPile.push(cardInstance);
};

const enemyTurn = (state: CombatState): void => {
  state.phase = 'enemyTurn';

  const baseDamage = 7;
  dealDamage(state, state.player, baseDamage);

  applyEndOfTurnStatuses(state, state.enemy);
  checkCombatResult(state);

  if (state.phase === 'won' || state.phase === 'lost') {
    return;
  }

  state.turn += 1;
  startPlayerTurn(state);
};

export const endPlayerTurn = (state: CombatState): void => {
  if (state.phase !== 'playerTurn') {
    return;
  }

  discardHand(state);
  resetPlayerBlockAtEndOfTurn(state);
  applyEndOfTurnStatuses(state, state.enemy);
  checkCombatResult(state);

  if (state.phase === 'won' || state.phase === 'lost') {
    return;
  }

  enemyTurn(state);
};
