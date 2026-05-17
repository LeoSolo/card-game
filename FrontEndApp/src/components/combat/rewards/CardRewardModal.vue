<template>
  <section class='card-reward-backdrop' @click.self='$emit("close")'>
    <div class='card-reward-modal'>
      <button type='button' class='modal-close' @click='$emit("close")'>×</button>
      <h2>Выберите карту</h2>

      <div class='reward-card-choice-grid'>
        <article
          v-for='card in cards'
          :key='card.id'
          class='reward-card-choice'
          :class='[
            `reward-card-${card.type}`,
            { flying: flyingCardId === card.id },
          ]'
          @click='$emit("select-card", card.id)'
        >
          <span class='reward-card-cost'>{{ card.cost }}</span>
          <strong>{{ card.name }}</strong>
          <small>{{ cardTypeLabels[card.type] }} · {{ rarityLabels[card.rarity] }}</small>
          <p>{{ card.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang='ts'>
import type { CardDefinition, CardType } from '@/game/cards/cardTypes';

defineProps<{
  cards: CardDefinition[];
  flyingCardId: string | null;
}>();

defineEmits<{
  close: [];
  'select-card': [cardId: string];
}>();

const cardTypeLabels: Record<CardType, string> = {
  attack: 'Атака',
  skill: 'Навык',
  talent: 'Талант',
};

const rarityLabels: Record<CardDefinition['rarity'], string> = {
  starter: 'Стартовая',
  common: 'Серая',
  uncommon: 'Зелёная',
  rare: 'Синяя',
};
</script>

<style scoped>
.card-reward-backdrop {
  position: fixed;
  inset: 82px 0 0;
  z-index: 180;
  display: grid;
  place-items: center;
  background: rgba(2, 5, 8, 0.56);
  backdrop-filter: blur(6px);
}

.card-reward-modal {
  position: relative;
  width: min(980px, calc(100vw - 72px));
  max-height: min(760px, calc(100vh - 72px));
  overflow: auto;
  padding: 28px;
  border: 1px solid rgba(130, 222, 255, 0.28);
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(12, 25, 36, 0.98), rgba(6, 11, 18, 0.98));
  box-shadow: 0 34px 80px rgba(0, 0, 0, 0.56);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 18px;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #effaff;
  cursor: pointer;
  font-size: 24px;
}

.reward-card-choice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 18px;
}

.reward-card-choice {
  position: relative;
  display: grid;
  min-height: 260px;
  grid-template-rows: 36px 24px 1fr;
  gap: 10px;
  padding: 18px;
  border: 2px solid rgba(214, 236, 255, 0.22);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(40, 58, 73, 0.98), rgba(12, 19, 28, 0.98));
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.reward-card-choice:hover {
  transform: translateY(-10px) scale(1.04);
  border-color: rgba(116, 232, 255, 0.82);
  box-shadow: 0 0 28px rgba(98, 221, 255, 0.44);
}

.reward-card-choice.flying {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 1000;
  width: 210px;
  min-height: 260px;
  pointer-events: none;
  animation: reward-card-fly-to-deck 0.65s ease-in forwards;
}

.reward-card-cost {
  position: absolute;
  left: 14px;
  top: 14px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: radial-gradient(circle, #63dfff, #1662b4);
  color: #06111d;
  font-weight: 1000;
}

.reward-card-choice strong {
  padding-left: 40px;
  color: #f4fbff;
  font-size: 18px;
  line-height: 1.1;
}

.reward-card-choice small {
  color: #a9bdc9;
  font-weight: 900;
  text-transform: uppercase;
}

.reward-card-choice p {
  color: #d5e6ee;
  font-size: 13px;
  line-height: 1.35;
}

@keyframes reward-card-fly-to-deck {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }

  100% {
    opacity: 0.2;
    transform: translate(calc(50vw - 240px), calc(-50vh + 42px)) scale(0.18) rotate(14deg);
  }
}
</style>
