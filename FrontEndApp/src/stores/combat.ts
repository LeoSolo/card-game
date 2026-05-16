import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { getCardById } from '@/game/cards/starterCards';
import { createInitialCombatState } from '@/game/combat/createCombat';
import {
  drawCards,
  endPlayerTurn,
  playCard,
  startPlayerTurn,
} from '@/game/combat/combatEngine';
import type { CardDefinition, CardInstance } from '@/game/cards/cardTypes';
import type { CombatState } from '@/game/combat/combatTypes';
import type { CombatRewardLootItem } from '@/game/combat/rewardTypes';

export type CardWithDefinition = CardInstance & {
  definition: CardDefinition;
};

const createRewardCardInstance = (cardId: string): CardInstance => ({
  cardId,
  instanceId: `${cardId}-reward-${crypto.randomUUID()}`,
});

export const useCombatStore = defineStore('combat', () => {
  const state = ref<CombatState | null>(null);

  const handCards = computed<CardWithDefinition[]>(() =>
    (state.value?.hand ?? []).map((cardInstance) => ({
      ...cardInstance,
      definition: getCardById(cardInstance.cardId),
    })),
  );

  const getCardsWithDefinitions = (cards: CardInstance[]): CardWithDefinition[] =>
    cards.map((cardInstance) => ({
      ...cardInstance,
      definition: getCardById(cardInstance.cardId),
    }));

  const startTestCombat = (): void => {
    state.value = createInitialCombatState();

    if (state.value) {
      drawCards(state.value, state.value.handSize);
    }
  };

  const playCardFromHand = (cardInstanceId: string, targetEnemyId?: string): void => {
    if (!state.value) {
      return;
    }

    playCard(state.value, cardInstanceId, targetEnemyId);
  };

  const endTurn = (): void => {
    if (!state.value) {
      return;
    }

    endPlayerTurn(state.value);
  };

  const chooseCardReward = (cardId: string): void => {
    if (!state.value?.reward || state.value.reward.isCardRewardTaken) {
      return;
    }

    const isOffered = state.value.reward.cardChoices.some((card) => card.id === cardId);

    if (!isOffered) {
      return;
    }

    state.value.discardPile.push(createRewardCardInstance(cardId));
    state.value.reward.isCardRewardTaken = true;
  };

  const claimMoneyReward = (): void => {
    if (!state.value?.reward || state.value.reward.isMoneyTaken) {
      return;
    }

    state.value.money += state.value.reward.money;
    state.value.reward.isMoneyTaken = true;
  };

  const claimLootReward = (): void => {
    if (!state.value?.reward || state.value.reward.isLootTaken) {
      return;
    }

    const lootAsInventory = state.value.reward.loot.map<CombatRewardLootItem>((item) => ({ ...item }));
    state.value.carriedItems.push(...lootAsInventory);
    state.value.reward.isLootTaken = true;
  };

  const restartCombat = (): void => {
    startTestCombat();
  };

  return {
    state,
    handCards,
    getCardsWithDefinitions,
    startTestCombat,
    startPlayerTurn,
    playCardFromHand,
    endTurn,
    chooseCardReward,
    claimMoneyReward,
    claimLootReward,
    restartCombat,
  };
});
