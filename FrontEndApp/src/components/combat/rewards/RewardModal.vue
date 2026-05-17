<template>
  <section class='reward-backdrop'>
    <div class='reward-modal'>
      <h2>Награда за бой</h2>
      <p class='reward-subtitle'>Забери награды перед возвращением на маршрут.</p>

      <div class='reward-list'>
        <button
          v-if='hasCardReward'
          type='button'
          class='reward-row card-reward-row'
          @click='$emit("open-card-reward")'
        >
          <span class='reward-row-icon'>▧</span>
          <span class='reward-row-content'>
            <strong>Выбрать карту</strong>
            <small>Добавить одну из трёх карт в колоду</small>
          </span>
        </button>

        <button
          v-if='money !== null'
          type='button'
          class='reward-row money-reward-row'
          @click='$emit("claim-money")'
        >
          <span class='reward-row-icon'>₽</span>
          <span class='reward-row-content'>
            <strong>{{ money }} денег</strong>
            <small>Забрать в инвентарь вылазки</small>
          </span>
        </button>

        <button
          v-for='item in loot'
          :key='item.id'
          type='button'
          class='reward-row loot-reward-row'
          @click='$emit("claim-loot")'
        >
          <span class='reward-row-icon'>✦</span>
          <span class='reward-row-content'>
            <strong>{{ item.name }} ×{{ item.amount }}</strong>
            <small>{{ lootRarityLabels[item.rarity] }}</small>
            <span class='reward-loot-tooltip'>{{ item.description }}</span>
          </span>
        </button>
      </div>

      <button type='button' class='reward-continue-button' @click='$emit("continue")'>Продолжить вылазку</button>
    </div>
  </section>
</template>

<script setup lang='ts'>
type LootRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

defineProps<{
  hasCardReward: boolean;
  money: number | null;
  loot: Array<{
    id: string;
    name: string;
    amount: number;
    rarity: LootRarity;
    description: string;
  }>;
}>();

defineEmits<{
  'open-card-reward': [];
  'claim-money': [];
  'claim-loot': [];
  continue: [];
}>();

const lootRarityLabels: Record<LootRarity, string> = {
  common: 'Серый предмет',
  uncommon: 'Зелёный предмет',
  rare: 'Синий предмет',
  legendary: 'Оранжевый предмет',
};
</script>

<style scoped>
.reward-backdrop {
  position: fixed;
  inset: 82px 0 0;
  z-index: 180;
  display: grid;
  place-items: center;
  background: rgba(2, 5, 8, 0.56);
  backdrop-filter: blur(6px);
}

.reward-modal {
  position: relative;
  width: min(620px, calc(100vw - 72px));
  max-height: min(760px, calc(100vh - 72px));
  overflow: auto;
  padding: 28px;
  border: 1px solid rgba(130, 222, 255, 0.28);
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(12, 25, 36, 0.98), rgba(6, 11, 18, 0.98));
  box-shadow: 0 34px 80px rgba(0, 0, 0, 0.56);
}

.reward-subtitle {
  margin: 0 0 22px;
  color: #b9ccd8;
}

.reward-list {
  display: grid;
  gap: 12px;
}

.reward-row {
  position: relative;
  display: grid;
  grid-template-columns: 46px 1fr;
  align-items: center;
  gap: 14px;
  min-height: 68px;
  padding: 12px 16px;
  border: 1px solid rgba(151, 225, 255, 0.24);
  border-radius: 14px;
  background: rgba(129, 188, 192, 0.2);
  color: #eaf8ff;
  cursor: pointer;
  text-align: left;
  transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease;
}

.reward-row:hover {
  transform: translateX(4px);
  border-color: rgba(244, 207, 99, 0.9);
  background: rgba(129, 188, 192, 0.32);
}

.reward-row-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: #f4d469;
  font-size: 22px;
  font-weight: 1000;
}

.reward-row-content {
  display: grid;
  gap: 3px;
}

.reward-row-content strong {
  font-size: 17px;
}

.reward-row-content small {
  color: #b8ccd8;
  font-size: 12px;
}

.reward-loot-tooltip {
  position: absolute;
  left: calc(100% + 14px);
  top: 50%;
  z-index: 20;
  display: none;
  width: 260px;
  padding: 12px 14px;
  border: 1px solid rgba(130, 222, 255, 0.32);
  border-radius: 14px;
  background: rgba(6, 13, 20, 0.96);
  color: #d8edf7;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  transform: translateY(-50%);
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.44);
  pointer-events: none;
}

.loot-reward-row:hover .reward-loot-tooltip {
  display: block;
}

.reward-continue-button {
  min-height: 46px;
  margin-top: 22px;
  padding: 0 22px;
  border: 0;
  border-radius: 15px;
  background: #73e4ff;
  color: #06111d;
  cursor: pointer;
  font-weight: 1000;
}
</style>
