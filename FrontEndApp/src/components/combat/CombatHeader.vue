<template>
  <header class='top-bar'>
    <button type='button' class='hub-button' @click='$emit("goHub")'>← Хаб</button>
    <button type='button' class='inventory-button' @click='$emit("openInventory")'>🎒 Инвентарь</button>

    <strong class='hero-name'>Татьяна</strong>

    <div class='top-stat hp'>♥ {{ playerHp }}/{{ playerMaxHp }}</div>
    <div class='top-stat money'>₽ {{ money }}</div>

    <div class='top-spacer'></div>

    <button type='button' class='deck-size' @click='$emit("openDeck")'>Колода {{ totalDeckSize }}</button>
    <button type='button' class='settings-button' @click='$emit("restartCombat")'>↻</button>
    <button type='button' class='test-win-button' @click='$emit("winCombatForTests")'>Выиграть бой</button>
  </header>
</template>

<script setup lang='ts'>
defineProps<{
  playerHp: number;
  playerMaxHp: number;
  money: number;
  totalDeckSize: number;
}>();

defineEmits<{
  goHub: [];
  openInventory: [];
  openDeck: [];
  restartCombat: [];
  winCombatForTests: [];
}>();
</script>

<style scoped>
.top-bar {
  position: absolute;
  top: 18px;
  left: 24px;
  right: 24px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: 1px solid rgba(126, 204, 255, 0.24);
  border-radius: 18px;
  background: rgba(8, 15, 22, 0.82);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(12px);
}

.top-bar button {
  border: 1px solid rgba(142, 221, 255, 0.26);
  border-radius: 12px;
  background: rgba(14, 35, 48, 0.82);
  color: #d9f3ff;
  cursor: pointer;
  font-weight: 800;
}

.hub-button,
.inventory-button,
.settings-button,
.deck-size,
.test-win-button {
  min-height: 38px;
  padding: 0 14px;
}

.inventory-button {
  border-color: rgba(93, 255, 174, 0.38);
}

.test-win-button {
  border-color: rgba(255, 198, 93, 0.45);
  color: #ffe2a4;
}

.hero-name {
  font-size: 22px;
  letter-spacing: 0.04em;
}

.top-stat {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 900;
}

.top-stat.money {
  color: #5dffae;
}

.top-spacer {
  flex: 1;
}
</style>
