import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getCardById } from '@/game/cards/starterCards';
import { createInitialCombatState } from '@/game/combat/createCombat';
import {
  drawCards,
  endPlayerTurn,
  playCard,
  startPlayerTurn,
} from '@/game/combat/combatEngine';
import type { CombatState } from '@/game/combat/combatTypes';

export const useCombatStore = defineStore('combat', () => {
  const state = ref<CombatState | null>(null);

  const handCards = computed(() =>
    (state.value?.hand ?? []).map((cardInstance) => ({
      ...cardInstance,
      definition: getCardById(cardInstance.cardId),
    })),
  );

  const startTestCombat = (): void => {
    state.value = createInitialCombatState();

    if (state.value) {
      drawCards(state.value, state.value.handSize);
    }
  };

  const playCardFromHand = (cardInstanceId: string): void => {
    if (!state.value) {
      return;
    }

    playCard(state.value, cardInstanceId);
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
    startTestCombat,
    startPlayerTurn,
    playCardFromHand,
    endTurn,
    restartCombat,
  };
});
