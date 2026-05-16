<template>
  <main class='hub-page'>
    <section class='hero-panel'>
      <p class='eyebrow'>Подземное поселение · Хаб искателей</p>
      <h1>Карточная игра: первый прототип</h1>
      <p>
        После мировой войны поверхность осталась за роботами, мутантами и теми,
        кто готов рискнуть всем ради ресурсов. Сейчас доступен тестовый бой
        за первого персонажа — искательницу с винтовкой и щитом.
      </p>

      <div class='hero-actions'>
        <button type='button' @click='startCombat'>Начать тестовую вылазку</button>
      </div>
    </section>

    <section class='hub-grid'>
      <article class='hub-card active'>
        <h2>Персонаж</h2>
        <p>Искательница со энергетическим щитом и винтовкой будущего.</p>
      </article>

      <article class='hub-card'>
        <h2>Торговец оружием</h2>
        <p>Позже здесь будет продаваться оружие.</p>
      </article>

      <article class='hub-card'>
        <h2>Торговец бронёй</h2>
        <p>Броня и штаны будут давать защиту и сопротивление негативным эффектам.</p>
      </article>

      <article class='hub-card'>
        <h2>Доп. оборудование</h2>
        <p>Побег из боя, бонус к деньгам или увеличенный лут.</p>
      </article>

      <article class='hub-card'>
        <h2>Склад</h2>
        <p>Общее хранилище поселения. Пока заглушка.</p>
      </article>

      <article class='hub-card'>
        <h2>Доска заданий</h2>
        <p>Задания от поселения и торговцев. Пока заглушка.</p>
      </article>

      <article class='hub-card'>
        <h2>Справочник мира</h2>
        <p>Лор, встреченные противники, карты и снаряжение. Пока заглушка.</p>
      </article>

      <article class='hub-card'>
        <h2>Настройки</h2>
        <p>Громкость музыки и звуков. Пока заглушка.</p>
      </article>
    </section>
  </main>
</template>

<script setup lang='ts'>
import { useRouter } from 'vue-router';
import { useCombatStore } from '@/stores/combat';

const router = useRouter();
const combatStore = useCombatStore();

const startCombat = (): void => {
  combatStore.startTestCombat();
  router.push('/combat');
};
</script>

<style scoped lang='scss'>
.hub-page {
  min-height: 100vh;
  padding: 48px;
  color: #edf2f7;
  background: radial-gradient(circle at top left, rgba(78, 130, 164, 0.35), transparent 36%),
  linear-gradient(135deg, #10131a 0%, #1d232c 100%);
}

.hero-panel,
.hub-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  background: rgba(11, 15, 22, 0.78);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
}

.hero-panel {
  max-width: 980px;
  padding: 40px;
  margin-bottom: 28px;

  h1 {
    max-width: 760px;
    margin: 0 0 16px;
    font-size: 46px;
    line-height: 1.05;
  }

  p {
    max-width: 760px;
    color: #b9c4d0;
    font-size: 18px;
    line-height: 1.65;
  }
}

.eyebrow {
  margin: 0 0 12px;
  color: #88d4ff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

button {
  border: 0;
  border-radius: 14px;
  padding: 14px 22px;
  color: #071017;
  background: #9be7ff;
  cursor: pointer;
  font-weight: 800;

  &:hover {
    filter: brightness(1.08);
  }
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.hub-card {
  min-height: 150px;
  padding: 22px;

  &.active {
    border-color: rgba(155, 231, 255, 0.45);
  }

  h2 {
    margin: 0 0 10px;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: #aeb9c5;
    line-height: 1.55;
  }
}
</style>
