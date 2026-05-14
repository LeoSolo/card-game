<template>
  <main v-if="combatState" class="combat-page">
    <header class="combat-header">
      <button type="button" class="ghost-button" @click="goHub">В хаб</button>
      <div>
        <p class="eyebrow">Тестовая вылазка · бой {{ combatState.turn }}</p>
        <h1>Бой с ржавым роботом</h1>
      </div>
      <button type="button" class="ghost-button" @click="combatStore.restartCombat">
        Перезапустить бой
      </button>
    </header>

    <section class="battlefield">
      <article class="actor-card player">
        <h2>{{ combatState.player.name }}</h2>
        <p>HP: {{ combatState.player.hp }} / {{ combatState.player.maxHp }}</p>
        <p>Броня: {{ combatState.player.block }}</p>
        <p>Энергия: {{ combatState.energy }} / {{ combatState.maxEnergy }}</p>
        <div class="statuses">
          <span v-for="status in playerStatuses" :key="status">
            {{ status }}
          </span>
        </div>
      </article>

      <article class="actor-card enemy">
        <h2>{{ combatState.enemy.name }}</h2>
        <p>HP: {{ combatState.enemy.hp }} / {{ combatState.enemy.maxHp }}</p>
        <p>Броня: {{ combatState.enemy.block }}</p>
        <div class="statuses">
          <span v-for="status in enemyStatuses" :key="status">
            {{ status }}
          </span>
        </div>
      </article>
    </section>

    <section v-if="combatState.phase === 'playerTurn'" class="hand-panel">
      <div class="hand-header">
        <h2>Рука</h2>
        <button type="button" @click="combatStore.endTurn">Закончить ход</button>
      </div>

      <div class="hand">
        <button
          v-for="card in combatStore.handCards"
          :key="card.instanceId"
          type="button"
          class="card"
          :disabled="combatState.energy < card.definition.cost"
          @click="combatStore.playCardFromHand(card.instanceId)"
        >
          <span class="card-cost">{{ card.definition.cost }}</span>
          <strong>{{ card.definition.name }}</strong>
          <small>{{ cardTypeLabels[card.definition.type] }}</small>
          <p>{{ card.definition.description }}</p>
        </button>
      </div>
    </section>

    <section v-else class="result-panel">
      <h2>{{ resultTitle }}</h2>
      <p>{{ resultDescription }}</p>
      <button type="button" @click="goHub">Вернуться в хаб</button>
    </section>

    <aside class="combat-info">
      <div>
        <h3>Колоды</h3>
        <p>Добор: {{ combatState.drawPile.length }}</p>
        <p>Сброс: {{ combatState.discardPile.length }}</p>
        <p>Расход: {{ combatState.exhaustPile.length }}</p>
      </div>

      <div>
        <h3>Лог</h3>
        <ul>
          <li v-for="logItem in combatState.log.slice(0, 8)" :key="logItem.id">
            {{ logItem.text }}
          </li>
        </ul>
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCombatStore } from '@/stores/combat';
import type { CardType, StatusId } from '@/game/cards/cardTypes';

const router = useRouter();
const combatStore = useCombatStore();

const combatState = computed(() => combatStore.state);

const cardTypeLabels: Record<CardType, string> = {
  attack: 'Атака',
  skill: 'Навык',
  talent: 'Талант',
};

const statusLabels: Record<StatusId, string> = {
  aim: 'Прицел',
  burn: 'Горение',
  weak: 'Слабость',
  vulnerable: 'Уязвимость',
  reinforcedBattery: 'Усиленная батарея',
};

const formatStatuses = (statuses: Partial<Record<StatusId, number>>): string[] =>
  Object.entries(statuses)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([status, amount]) => `${statusLabels[status as StatusId]}: ${amount}`);

const playerStatuses = computed(() =>
  combatState.value ? formatStatuses(combatState.value.player.statuses) : [],
);

const enemyStatuses = computed(() =>
  combatState.value ? formatStatuses(combatState.value.enemy.statuses) : [],
);

const resultTitle = computed(() => {
  if (combatState.value?.phase === 'won') {
    return 'Победа';
  }

  if (combatState.value?.phase === 'lost') {
    return 'Поражение';
  }

  return 'Ход противника';
});

const resultDescription = computed(() => {
  if (combatState.value?.phase === 'won') {
    return 'Позже здесь появится выбор одной из трёх карт и награда за бой.';
  }

  if (combatState.value?.phase === 'lost') {
    return 'Персонаж возвращается в хаб, но теряет всё, что было взято с собой.';
  }

  return 'Противник действует.';
});

const goHub = (): void => {
  router.push('/');
};

onMounted(() => {
  if (!combatStore.state) {
    combatStore.startTestCombat();
  }
});
</script>

<style scoped lang="scss">
.combat-page {
  min-height: 100vh;
  padding: 32px;
  color: #edf2f7;
  background:
    radial-gradient(circle at 80% 10%, rgba(255, 119, 87, 0.22), transparent 32%),
    linear-gradient(135deg, #11151d 0%, #242b34 100%);
}

.combat-header,
.battlefield,
.hand-panel,
.result-panel,
.combat-info {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  background: rgba(9, 13, 20, 0.78);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}

.combat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 26px;
  margin-bottom: 20px;

  h1 {
    margin: 4px 0 0;
    font-size: 32px;
  }
}

.eyebrow {
  margin: 0;
  color: #88d4ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.battlefield {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  padding: 24px;
  margin-bottom: 20px;
}

.actor-card {
  min-height: 210px;
  border-radius: 18px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);

  h2 {
    margin: 0 0 18px;
    font-size: 26px;
  }

  p {
    margin: 8px 0;
    color: #c4cfda;
  }
}

.player {
  border: 1px solid rgba(136, 212, 255, 0.22);
}

.enemy {
  border: 1px solid rgba(255, 119, 87, 0.24);
}

.statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;

  span {
    border-radius: 999px;
    padding: 6px 10px;
    color: #10131a;
    background: #f9d47a;
    font-size: 12px;
    font-weight: 800;
  }
}

.hand-panel,
.result-panel,
.combat-info {
  padding: 24px;
  margin-bottom: 20px;
}

.hand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    margin: 0;
  }
}

.hand {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
}

.card {
  position: relative;
  min-height: 210px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  padding: 42px 16px 16px;
  color: #edf2f7;
  background: rgba(255, 255, 255, 0.07);
  cursor: pointer;
  text-align: left;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    border-color: rgba(155, 231, 255, 0.5);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  strong {
    display: block;
    margin-bottom: 8px;
    font-size: 18px;
  }

  small {
    color: #88d4ff;
    font-weight: 800;
    text-transform: uppercase;
  }

  p {
    color: #c4cfda;
    line-height: 1.45;
  }
}

.card-cost {
  position: absolute;
  top: 12px;
  left: 12px;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 999px;
  color: #091018;
  background: #9be7ff;
  font-weight: 900;
}

button {
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  color: #071017;
  background: #9be7ff;
  cursor: pointer;
  font-weight: 800;

  &:hover {
    filter: brightness(1.08);
  }
}

.ghost-button {
  color: #edf2f7;
  background: rgba(255, 255, 255, 0.08);
}

.combat-info {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;

  h3 {
    margin: 0 0 10px;
  }

  p {
    margin: 6px 0;
    color: #c4cfda;
  }

  ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding-left: 18px;
    color: #c4cfda;
  }
}

@media (max-width: 820px) {
  .combat-page {
    padding: 18px;
  }

  .combat-header,
  .battlefield,
  .combat-info {
    grid-template-columns: 1fr;
  }

  .combat-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
