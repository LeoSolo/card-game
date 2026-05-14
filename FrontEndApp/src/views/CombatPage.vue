<template>
  <main v-if='combatState' class='combat-page' @pointermove='onPointerMove' @pointerup='onPointerUp'>
    <header class='top-bar'>
      <button type='button' class='icon-button' @click='goHub'>← Хаб</button>
      <div class='hero-headline'>
        <strong>Искательница</strong>
        <span>ур. 1</span>
      </div>
      <div class='top-stat hp'>♥ {{ combatState.player.hp }}/{{ combatState.player.maxHp }}</div>
      <div class='top-stat money'>¤ 99</div>
      <div class='top-stat route'>▰ 1</div>
      <div class='top-stat heat'>🔥 20</div>
      <button type='button' class='icon-button' @click='combatStore.restartCombat'>↻</button>
    </header>

    <section class='battlefield'>
      <svg v-if="dragState && draggedCard?.definition.target === 'enemy'" class='target-arrow'>
        <path :d='arrowPath' class='arrow-path' />
        <polygon :points='arrowHeadPoints' class='arrow-head' />
      </svg>

      <aside class='left-tools'>
        <button type='button'>🎒</button>
        <button type='button'>🛡</button>
        <button type='button'>⚙</button>
      </aside>

      <article class='player-unit'>
        <div class='shield-sphere'></div>
        <div class='player-silhouette'></div>
        <div class='player-bars'>
          <span v-if='combatState.player.block > 0' class='block-badge'>{{ combatState.player.block }}</span>
          <div class='hp-bar'>
            <span :style="{ width: playerHpPercent + '%' }"></span>
            <strong>{{ combatState.player.hp }}/{{ combatState.player.maxHp }}</strong>
          </div>
          <div class='statuses player-statuses'>
            <span v-for='status in playerStatuses' :key='status'>{{ status }}</span>
          </div>
        </div>
      </article>

      <section
        class='center-drop-zone'
        :class="{ active: dragState && draggedCard?.definition.target !== 'enemy' }"
        data-drop-zone='center'
      >
        {{ centerDropLabel }}
      </section>

      <section class='enemies-area'>
        <article
          v-for='enemy in combatState.enemies'
          :key='enemy.id'
          class='enemy-unit'
          :class="{
            defeated: enemy.hp <= 0,
            targetable: dragState && draggedCard?.definition.target === 'enemy' && enemy.hp > 0,
            hovered: hoveredEnemyId === enemy.id,
          }"
          :data-enemy-id='enemy.id'
        >
          <div class='intent-card' :class='`intent-${enemy.intent.type}`'>
            <strong>{{ intentTitle(enemy.intent) }}</strong>
            <span>{{ intentDescription(enemy.intent) }}</span>
          </div>

          <div class='intent-icon-row'>
            <strong v-if="enemy.intent.type === 'attack'">{{ enemy.intent.damage * enemy.intent.hits }}</strong>
            <span>{{ getIntentIcon(enemy.intent.type) }}</span>
          </div>

          <div class='enemy-core' :class='`enemy-${enemy.id}`'></div>
          <div class='enemy-bars'>
            <span v-if='enemy.block > 0' class='enemy-block'>{{ enemy.block }} 🛡</span>
            <div class='enemy-hp-bar'>
              <span :style="{ width: getHpPercent(enemy.hp, enemy.maxHp) + '%' }"></span>
              <strong>{{ enemy.hp }}/{{ enemy.maxHp }}</strong>
            </div>
          </div>
          <div class='statuses'>
            <span v-for='status in formatStatuses(enemy.statuses)' :key='status'>{{ status }}</span>
          </div>
        </article>
      </section>

      <section class='bottom-hud'>
        <div class='energy-orb'>
          <strong>{{ combatState.energy }}/{{ combatState.maxEnergy }}</strong>
          <span>Энергия</span>
        </div>

        <div class='pile draw-pile'>
          <strong>{{ combatState.drawPile.length }}</strong>
          <span>Колода</span>
        </div>

        <div class='hand'>
          <article
            v-for='(card, index) in combatStore.handCards'
            :key='card.instanceId'
            class='card'
            :class='[
              `card-${card.definition.type}`,
              {
                disabled: combatState.energy < card.definition.cost,
                dragging: dragState?.cardInstanceId === card.instanceId,
              },
            ]'
            :style='getCardStyle(index)'
            @pointerdown.stop.prevent='startCardDrag(card.instanceId, $event)'
          >
            <span class='card-cost'>{{ card.definition.cost }}</span>
            <strong>{{ card.definition.name }}</strong>
            <small>{{ cardTypeLabels[card.definition.type] }}</small>
            <div class='card-art'>{{ getCardIcon(card.definition.type, card.definition.target) }}</div>
            <p>{{ card.definition.description }}</p>
          </article>
        </div>

        <button type='button' class='end-turn-button' @click='combatStore.endTurn'>Завершить ход</button>

        <div class='pile discard-pile'>
          <strong>{{ combatState.discardPile.length }}</strong>
          <span>Сброс</span>
        </div>
      </section>
    </section>

    <section v-if="combatState.phase !== 'playerTurn'" class='result-panel'>
      <h2>{{ resultTitle }}</h2>
      <p>{{ resultDescription }}</p>
      <button type='button' @click='goHub'>Вернуться в хаб</button>
    </section>

    <aside class='combat-log'>
      <strong>Лог</strong>
      <span v-for='logItem in combatState.log.slice(0, 5)' :key='logItem.id'>{{ logItem.text }}</span>
    </aside>
  </main>
</template>

<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCombatStore } from '@/stores/combat';
import type { CardTargetType, CardType, StatusId } from '@/game/cards/cardTypes';
import type { EnemyIntent } from '@/game/combat/combatTypes';

const router = useRouter();
const combatStore = useCombatStore();

const combatState = computed(() => combatStore.state);

type DragState = {
  cardInstanceId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

const dragState = ref<DragState | null>(null);
const hoveredEnemyId = ref<string | null>(null);

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

const draggedCard = computed(() => {
  if (!dragState.value) {
    return null;
  }

  return combatStore.handCards.find((card) => card.instanceId === dragState.value?.cardInstanceId) ?? null;
});

const playerStatuses = computed(() =>
  combatState.value ? formatStatuses(combatState.value.player.statuses) : [],
);

const playerHpPercent = computed(() => {
  if (!combatState.value) {
    return 0;
  }

  return getHpPercent(combatState.value.player.hp, combatState.value.player.maxHp);
});

const centerDropLabel = computed(() => {
  if (!draggedCard.value) {
    return 'Перетащите сюда навыки, таланты и атаки по всем врагам';
  }

  const labels: Record<CardTargetType, string> = {
    enemy: 'Выберите цель',
    'all-enemies': 'Цель: все враги',
    self: 'Сыграть карту',
  };

  return labels[draggedCard.value.definition.target];
});

const arrowPath = computed(() => {
  if (!dragState.value) {
    return '';
  }

  const { startX, startY, currentX, currentY } = dragState.value;
  const controlX = (startX + currentX) / 2;
  const controlY = Math.min(startY, currentY) - 160;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${currentX} ${currentY}`;
});

const arrowHeadPoints = computed(() => {
  if (!dragState.value) {
    return '';
  }

  const { currentX, currentY } = dragState.value;

  return `${currentX},${currentY} ${currentX - 22},${currentY - 11} ${currentX - 12},${currentY + 16}`;
});

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

const getHpPercent = (hp: number, maxHp: number): number => Math.max(0, Math.round((hp / maxHp) * 100));

const getIntentIcon = (intentType: EnemyIntent['type']): string => {
  const icons: Record<EnemyIntent['type'], string> = {
    attack: '⚔',
    block: '🛡',
    debuff: '☯',
  };

  return icons[intentType];
};

const intentTitle = (intent: EnemyIntent): string => {
  if (intent.type === 'attack') {
    return 'Атака';
  }

  if (intent.type === 'block') {
    return 'Защита';
  }

  return 'Дебафф';
};

const intentDescription = (intent: EnemyIntent): string => {
  if (intent.type === 'attack') {
    const totalDamage = intent.damage * intent.hits;
    return `Нанесёт ${totalDamage} урона.`;
  }

  if (intent.type === 'block') {
    return 'Накладывает защиту.';
  }

  return 'Накладывает негативный эффект.';
};

const formatStatuses = (statuses: Partial<Record<StatusId, number>>): string[] =>
  Object.entries(statuses)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([status, amount]) => `${statusLabels[status as StatusId]} ${amount}`);

const getCardIcon = (type: CardType, target: CardTargetType): string => {
  if (target === 'all-enemies') {
    return '☄';
  }

  if (type === 'attack') {
    return '▸';
  }

  if (type === 'talent') {
    return '◈';
  }

  return '⬡';
};

const getCardStyle = (index: number) => {
  const count = combatStore.handCards.length;
  const middle = (count - 1) / 2;
  const offset = index - middle;

  return {
    transform: `translateY(${Math.abs(offset) * 5}px) rotate(${offset * 3}deg)`,
    zIndex: 20 + index,
  };
};

const startCardDrag = (cardInstanceId: string, event: PointerEvent): void => {
  const state = combatState.value;
  const card = combatStore.handCards.find((item) => item.instanceId === cardInstanceId);

  if (!state || !card || state.phase !== 'playerTurn' || state.energy < card.definition.cost) {
    return;
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

  dragState.value = {
    cardInstanceId,
    startX: rect.left + rect.width / 2,
    startY: rect.top + 24,
    currentX: event.clientX,
    currentY: event.clientY,
  };
};

const findEnemyUnderPointer = (x: number, y: number): string | null => {
  const elements = document.elementsFromPoint(x, y);
  const enemyElement = elements.find((element) => element instanceof HTMLElement && element.dataset.enemyId) as
    | HTMLElement
    | undefined;

  return enemyElement?.dataset.enemyId ?? null;
};

const isCenterDropUnderPointer = (x: number, y: number): boolean => {
  const elements = document.elementsFromPoint(x, y);

  return elements.some((element) => element instanceof HTMLElement && element.dataset.dropZone === 'center');
};

const onPointerMove = (event: PointerEvent): void => {
  if (!dragState.value) {
    return;
  }

  dragState.value.currentX = event.clientX;
  dragState.value.currentY = event.clientY;
  hoveredEnemyId.value = findEnemyUnderPointer(event.clientX, event.clientY);
};

const onPointerUp = (event: PointerEvent): void => {
  if (!dragState.value || !draggedCard.value) {
    dragState.value = null;
    hoveredEnemyId.value = null;
    return;
  }

  const card = draggedCard.value;

  if (card.definition.target === 'enemy') {
    const enemyId = findEnemyUnderPointer(event.clientX, event.clientY);
    const enemy = combatState.value?.enemies.find((item) => item.id === enemyId && item.hp > 0);

    if (enemy) {
      combatStore.playCardFromHand(card.instanceId, enemy.id);
    }
  } else if (isCenterDropUnderPointer(event.clientX, event.clientY)) {
    combatStore.playCardFromHand(card.instanceId);
  }

  dragState.value = null;
  hoveredEnemyId.value = null;
};

const goHub = (): void => {
  router.push('/');
};

onMounted(() => {
  if (!combatStore.state) {
    combatStore.startTestCombat();
  }
});
</script>

<style scoped lang='scss'>
.combat-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #edf2f7;
  background: radial-gradient(circle at 48% 25%, rgba(83, 128, 155, 0.24), transparent 36%),
  linear-gradient(180deg, rgba(10, 13, 18, 0.72), rgba(10, 13, 18, 0.92)),
  linear-gradient(135deg, #171c24 0%, #10131a 48%, #221611 100%);
  user-select: none;
}

.top-bar {
  position: relative;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 22px;
  height: 58px;
  padding: 0 22px;
  background: rgba(9, 13, 18, 0.84);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
}

.icon-button {
  border: 0;
  border-radius: 12px;
  padding: 9px 12px;
  color: #dce7f2;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.hero-headline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 190px;

  strong {
    font-size: 22px;
  }

  span {
    color: #9aa7b5;
  }
}

.top-stat {
  font-size: 18px;
  font-weight: 800;
}

.hp {
  color: #ff6464;
}

.money {
  color: #f4d27a;
}

.route,
.heat {
  margin-left: auto;
}

.route + .heat,
.heat + .icon-button {
  margin-left: 0;
}

.battlefield {
  position: relative;
  height: calc(100vh - 58px);
  min-height: 680px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.2), transparent 35%, rgba(0, 0, 0, 0.25)),
  radial-gradient(circle at 50% 100%, rgba(128, 90, 62, 0.23), transparent 45%);
}

.battlefield::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
  linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 120px 120px;
  opacity: 0.24;
}

.target-arrow {
  position: fixed;
  inset: 0;
  z-index: 90;
  pointer-events: none;
}

.arrow-path {
  fill: none;
  stroke: rgba(159, 226, 255, 0.95);
  stroke-width: 11;
  stroke-linecap: round;
  stroke-dasharray: 20 16;
  filter: drop-shadow(0 0 8px rgba(74, 195, 255, 0.8));
}

.arrow-head {
  fill: rgba(159, 226, 255, 0.96);
  filter: drop-shadow(0 0 10px rgba(74, 195, 255, 0.9));
}

.left-tools {
  position: absolute;
  left: 18px;
  top: 28px;
  z-index: 10;
  display: grid;
  gap: 12px;

  button {
    width: 44px;
    height: 44px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 10px;
    color: #edf2f7;
    background: rgba(8, 12, 18, 0.72);
  }
}

.player-unit {
  position: absolute;
  left: 8%;
  top: 28%;
  width: 320px;
  height: 350px;
}

.shield-sphere {
  position: absolute;
  left: 8px;
  top: 18px;
  width: 280px;
  height: 280px;
  border: 2px solid rgba(140, 219, 255, 0.54);
  border-radius: 50%;
  background: repeating-radial-gradient(circle, rgba(155, 231, 255, 0.08), rgba(155, 231, 255, 0.08) 2px, transparent 3px, transparent 22px),
  radial-gradient(circle, rgba(112, 199, 255, 0.2), rgba(112, 199, 255, 0.05) 58%, transparent 63%);
  box-shadow: 0 0 55px rgba(93, 198, 255, 0.35), inset 0 0 55px rgba(93, 198, 255, 0.16);
}

.player-silhouette {
  position: absolute;
  left: 108px;
  top: 82px;
  width: 76px;
  height: 166px;
  border-radius: 44px 44px 16px 16px;
  background: linear-gradient(90deg, transparent 75%, #4f5965 76% 100%),
  linear-gradient(160deg, #cfd9e2, #697687 48%, #272d36 82%);
  box-shadow: 0 26px 40px rgba(0, 0, 0, 0.42);

  &::before {
    content: '';
    position: absolute;
    left: 18px;
    top: -24px;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(160deg, #d9b17d, #1b1f27 55%);
  }

  &::after {
    content: '';
    position: absolute;
    right: -110px;
    top: 70px;
    width: 128px;
    height: 15px;
    border-radius: 999px;
    background: linear-gradient(90deg, #2e3540, #b9c7d4);
    transform: rotate(-5deg);
  }
}

.player-bars {
  position: absolute;
  left: 68px;
  top: 292px;
  display: grid;
  gap: 6px;
  width: 210px;
}

.block-badge {
  position: absolute;
  left: -32px;
  top: -14px;
  min-width: 34px;
  border-radius: 9px;
  padding: 4px 7px;
  background: #5dbdee;
  color: #071019;
  font-weight: 900;
  text-align: center;
}

.hp-bar,
.enemy-hp-bar {
  position: relative;
  height: 16px;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0.58);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.5);

  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #bd2626, #ff5959);
  }

  strong {
    position: absolute;
    inset: -2px 0 0;
    text-align: center;
    font-size: 13px;
    line-height: 16px;
    text-shadow: 0 1px 3px #000;
  }
}

.center-drop-zone {
  position: absolute;
  left: 50%;
  top: 58%;
  z-index: 35;
  width: min(430px, 34vw);
  min-height: 52px;
  transform: translate(-50%, -50%);
  border: 2px dashed rgba(255, 255, 255, 0.38);
  border-radius: 16px;
  padding: 13px 20px;
  color: #d9e6f3;
  background: rgba(7, 10, 15, 0.56);
  text-align: center;
  transition: 0.16s ease;
  pointer-events: auto;

  &.active {
    transform: translate(-50%, -54%);
    border-color: rgba(159, 226, 255, 0.9);
    box-shadow: 0 0 28px rgba(159, 226, 255, 0.2);
  }
}

.enemies-area {
  position: absolute;
  right: 5%;
  top: 18%;
  z-index: 15;
  display: flex;
  align-items: flex-end;
  gap: clamp(28px, 4vw, 72px);
}

.enemy-unit {
  position: relative;
  width: 180px;
  min-height: 340px;
  transition: 0.18s ease;

  &.targetable {
    cursor: crosshair;
  }

  &.hovered {
    transform: translateY(-10px) scale(1.04);
    filter: drop-shadow(0 0 24px rgba(139, 220, 255, 0.42));
  }

  &.defeated {
    opacity: 0.25;
    filter: grayscale(1);
  }
}

.intent-card {
  position: absolute;
  left: 50%;
  top: -20px;
  width: 210px;
  min-height: 74px;
  transform: translateX(-50%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 12px 14px;
  background: rgba(16, 18, 23, 0.86);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.3);

  strong {
    display: block;
    margin-bottom: 8px;
    font-size: 16px;
  }

  span {
    color: #e4e9ee;
    font-size: 13px;
  }
}

.intent-attack strong {
  color: #ff7770;
}

.intent-block strong {
  color: #f5db82;
}

.intent-debuff strong {
  color: #c797ff;
}

.intent-icon-row {
  position: absolute;
  left: 50%;
  top: 75px;
  display: flex;
  align-items: center;
  gap: 7px;
  transform: translateX(-50%);
  font-size: 22px;
  font-weight: 900;
  text-shadow: 0 2px 5px #000;
}

.enemy-core {
  position: absolute;
  left: 50%;
  top: 128px;
  width: 96px;
  height: 112px;
  transform: translateX(-50%);
  border-radius: 24px 24px 18px 18px;
  background: radial-gradient(circle at 50% 44%, #89dcff 0 6px, transparent 8px),
  linear-gradient(90deg, transparent 42%, rgba(255, 255, 255, 0.18) 43% 57%, transparent 58%),
  linear-gradient(160deg, #706a61, #303742 60%, #181c22);
  box-shadow: inset 0 0 22px rgba(0, 0, 0, 0.38), 0 22px 28px rgba(0, 0, 0, 0.35);

  &::before,
  &::after {
    content: '';
    position: absolute;
    bottom: -42px;
    width: 18px;
    height: 52px;
    border-radius: 999px;
    background: #313740;
  }

  &::before {
    left: 18px;
    transform: rotate(10deg);
  }

  &::after {
    right: 18px;
    transform: rotate(-10deg);
  }
}

.enemy-rusty-bot-1 {
  width: 118px;
  height: 82px;
  border-radius: 38px 38px 18px 18px;
}

.enemy-rusty-bot-3 {
  width: 96px;
  height: 96px;
  border-radius: 50%;
}

.enemy-bars {
  position: absolute;
  left: 50%;
  top: 276px;
  display: grid;
  gap: 6px;
  width: 170px;
  transform: translateX(-50%);
}

.enemy-block {
  justify-self: center;
  border-radius: 999px;
  padding: 4px 8px;
  color: #071019;
  background: #8bdcff;
  font-weight: 900;
}

.statuses {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;

  span {
    border-radius: 999px;
    padding: 4px 8px;
    color: #15100b;
    background: #ffd469;
    font-size: 12px;
    font-weight: 800;
  }
}

.enemy-unit > .statuses {
  position: absolute;
  left: 50%;
  top: 305px;
  width: 190px;
  transform: translateX(-50%);
}

.player-statuses {
  justify-content: flex-start;
}

.bottom-hud {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 70;
  display: grid;
  grid-template-columns: 150px 105px 1fr 190px 105px;
  align-items: end;
  gap: 16px;
  padding: 0 34px 28px;
  pointer-events: none;
}

.energy-orb {
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border: 4px solid rgba(139, 220, 255, 0.54);
  border-radius: 50%;
  background: radial-gradient(circle, #1e5c7d, #0b1824 68%);
  box-shadow: 0 0 26px rgba(79, 191, 255, 0.38);
  pointer-events: auto;

  strong {
    font-size: 32px;
  }

  span {
    margin-top: -18px;
    color: #9fb5c7;
    font-size: 11px;
    text-transform: uppercase;
  }
}

.pile {
  display: grid;
  place-items: center;
  width: 82px;
  height: 100px;
  border-radius: 12px;
  color: #d6e1ec;
  background: rgba(8, 12, 18, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.14);
  pointer-events: auto;

  strong {
    font-size: 26px;
  }

  span {
    font-size: 12px;
    text-transform: uppercase;
  }
}

.hand {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: clamp(4px, 0.7vw, 12px);
  height: 260px;
  min-width: 0;
  pointer-events: auto;
}

.card {
  position: relative;
  flex: 0 0 158px;
  width: 158px;
  height: 226px;
  min-height: 226px;
  max-height: 226px;
  box-sizing: border-box;
  border: 2px solid rgba(173, 213, 231, 0.3);
  border-radius: 16px;
  padding: 38px 12px 14px;
  color: #edf2f7;
  background: linear-gradient(160deg, #333942, #121820 72%);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.42);
  cursor: grab;
  transition: 0.14s ease;

  &:hover:not(.disabled) {
    transform: translateY(-18px) scale(1.04) !important;
    border-color: rgba(139, 220, 255, 0.8);
    box-shadow: 0 0 24px rgba(139, 220, 255, 0.22), 0 24px 32px rgba(0, 0, 0, 0.5);
  }

  &.dragging {
    opacity: 0.28;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  strong {
    display: -webkit-box;
    min-height: 38px;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    font-size: 15px;
    text-align: center;
  }

  small {
    display: block;
    width: fit-content;
    margin: 0 auto 8px;
    border-radius: 999px;
    padding: 3px 8px;
    color: #12161d;
    background: #c9d7e2;
    font-size: 10px;
  }

  p {
    display: -webkit-box;
    margin: 10px 0 0;
    max-height: 52px;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    color: #e4e8ed;
    font-size: 13px;
    line-height: 1.35;
    text-align: center;
  }
}

.card-attack {
  border-color: rgba(255, 104, 88, 0.54);
}

.card-skill {
  border-color: rgba(94, 194, 255, 0.56);
}

.card-talent {
  border-color: rgba(255, 211, 105, 0.72);
}

.card-cost {
  position: absolute;
  left: -8px;
  top: -8px;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 3px solid #8bdcff;
  border-radius: 50%;
  color: #fff;
  background: #183549;
  font-size: 22px;
  font-weight: 900;
}

.card-art {
  display: grid;
  place-items: center;
  height: 78px;
  margin: 4px 0 10px;
  border-radius: 10px;
  color: #9fe2ff;
  background: radial-gradient(circle at 50% 50%, rgba(159, 226, 255, 0.2), transparent 54%),
  linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  font-size: 42px;
}

.end-turn-button {
  align-self: center;
  border: 2px solid rgba(216, 229, 235, 0.3);
  border-radius: 14px;
  padding: 18px 22px;
  color: #e8f0f8;
  background: linear-gradient(160deg, #31495b, #1a2732);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.34);
  cursor: pointer;
  font-size: 18px;
  font-weight: 800;
  pointer-events: auto;
}

.result-panel {
  position: fixed;
  inset: 30% auto auto 50%;
  z-index: 120;
  width: min(460px, calc(100vw - 32px));
  transform: translateX(-50%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  padding: 26px;
  background: rgba(8, 12, 18, 0.92);
  box-shadow: 0 30px 100px rgba(0, 0, 0, 0.52);
  text-align: center;

  button {
    border: 0;
    border-radius: 12px;
    padding: 12px 18px;
    color: #111722;
    background: #9fe2ff;
    font-weight: 900;
    cursor: pointer;
  }
}

.combat-log {
  position: fixed;
  right: 22px;
  bottom: 142px;
  z-index: 40;
  display: grid;
  gap: 6px;
  width: 330px;
  max-height: 140px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px;
  color: #b9c7d4;
  background: rgba(8, 12, 18, 0.58);
  font-size: 12px;

  strong {
    color: #edf2f7;
  }
}

@media (max-width: 1200px) {
  .enemies-area {
    right: 2%;
    gap: 18px;
  }

  .enemy-unit {
    width: 150px;
  }

  .card {
    flex-basis: 138px;
    width: 138px;
  }

  .center-drop-zone {
    top: 55%;
    width: min(360px, 40vw);
  }

  .combat-log {
    display: none;
  }
}
</style>
