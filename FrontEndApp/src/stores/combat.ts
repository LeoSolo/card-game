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
import type { CardInstance } from '@/game/cards/cardTypes';
import type { CombatState } from '@/game/combat/combatTypes';

export type CardWithDefinition = CardInstance & {
  definition: ReturnType<typeof getCardById>;
};

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
    restartCombat,
  };
});
