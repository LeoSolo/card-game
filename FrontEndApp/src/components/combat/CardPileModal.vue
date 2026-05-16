<template>
  <section class="modal-backdrop" @click.self="$emit('close')">
    <div class="cards-modal">
      <button type="button" class="modal-close" @click="$emit('close')">×</button>
      <h2>{{ title }}</h2>

      <div v-if="cards.length > 0" class="modal-card-grid">
        <article
          v-for="card in cards"
          :key="card.instanceId"
          class="modal-card"
          :class="`modal-card-${card.definition.type}`"
        >
          <span class="modal-card-cost">{{ card.definition.cost }}</span>
          <strong>{{ card.definition.name }}</strong>
          <small>{{ cardTypeLabels[card.definition.type] }}</small>
          <p>{{ card.definition.description }}</p>
        </article>
      </div>

      <p v-else class="empty-modal-text">Здесь пока нет карт.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CardDefinition, CardInstance, CardType } from '@/game/cards/cardTypes';

type ModalCard = CardInstance & {
  definition: CardDefinition;
};

defineProps<{
  title: string;
  cards: ModalCard[];
}>();

defineEmits<{
  close: [];
}>();

const cardTypeLabels: Record<CardType, string> = {
  attack: 'Атака',
  skill: 'Навык',
  talent: 'Талант',
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 700;
  display: grid;
  place-items: center;
  background: rgba(2, 5, 8, 0.74);
  backdrop-filter: blur(6px);
}

.cards-modal {
  position: relative;
  width: min(1120px, calc(100vw - 72px));
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

.modal-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(154px, 1fr));
  gap: 16px;
}

.modal-card {
  position: relative;
  min-height: 154px;
  padding: 16px;
  border: 1px solid rgba(150, 221, 255, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
}

.modal-card-cost {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #65e1ff;
  color: #07131f;
  font-weight: 1000;
}

.modal-card strong {
  display: block;
  padding-right: 30px;
  color: #f3fbff;
}

.modal-card small {
  color: #a9bdc9;
  font-weight: 900;
  text-transform: uppercase;
}

.modal-card p {
  color: #c9d9e1;
  font-size: 13px;
  line-height: 1.35;
}

.empty-modal-text {
  color: #b8c9d1;
}
</style>
