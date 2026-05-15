<template>
  <main v-if="combatState" class="combat-page" :class="{ aiming: isAiming }">
    <header class="top-bar">
      <button type="button" class="hub-button" @click="goHub">← Хаб</button>
      <strong class="hero-name">Татьяна</strong>
      <div class="top-stat hp">♥ {{ combatState.player.hp }}/{{ combatState.player.maxHp }}</div>
      <div class="top-stat money">💰 {{ money }}</div>
      <div class="top-spacer"></div>
      <button type="button" class="deck-size" @click="openCardModal('deck')">Колода 🂠 {{ totalDeckSize }}</button>
      <button type="button" class="settings-button" @click="combatStore.restartCombat">↻</button>
    </header>

    <section class="battlefield">
      <svg v-if="isAiming" class="target-arrow" :width="viewportWidth" :height="viewportHeight" :viewBox="`0 0 ${viewportWidth} ${viewportHeight}`">
        <defs>
          <filter id="arrow-blur">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrow-head" markerWidth="34" markerHeight="34" refX="29" refY="17" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 2 L 34 17 L 0 32 Q 8 17 0 2" class="arrow-head" />
          </marker>
        </defs>
        <path :d="arrowPath" class="arrow-shadow" />
        <path :d="arrowPath" class="arrow-line" marker-end="url(#arrow-head)" />
      </svg>

      <article class="player-unit">
        <div class="shield-sphere"></div>
        <div class="player-silhouette"></div>
        <div class="actor-bars player-bars">
          <div class="hp-row">
            <span v-if="combatState.player.block > 0" class="block-chip">{{ combatState.player.block }}</span>
            <div class="hp-bar" :class="{ shielded: combatState.player.block > 0 }">
              <span :style="{ width: playerHpPercent + '%' }"></span>
              <strong>{{ combatState.player.hp }}/{{ combatState.player.maxHp }}</strong>
            </div>
          </div>
          <div class="statuses">
            <span v-for="status in playerStatuses" :key="status">{{ status }}</span>
          </div>
        </div>
      </article>

      <section class="enemies-area">
        <article
          v-for="enemy in combatState.enemies"
          :key="enemy.id"
          class="enemy-unit"
          :class="{
            defeated: enemy.hp <= 0,
            targetable: isAiming && enemy.hp > 0,
            hovered: isAiming && hoveredEnemyId === enemy.id,
          }"
          :data-enemy-id="enemy.id"
        >
          <div v-if="enemy.hp > 0" class="intent-card" :class="`intent-${enemy.intent.type}`">
            <strong>{{ intentTitle(enemy.intent) }}</strong>
            <span>{{ intentDescription(enemy.intent) }}</span>
          </div>

          <div v-if="enemy.hp > 0" class="intent-icon-row">
            <strong v-if="enemy.intent.type === 'attack'">{{ enemy.intent.damage * enemy.intent.hits }}</strong>
            <span>{{ getIntentIcon(enemy.intent.type) }}</span>
          </div>

          <div class="enemy-core" :class="`enemy-${enemy.id}`"></div>

          <div v-if="enemy.hp > 0" class="actor-bars enemy-bars">
            <div class="hp-row">
              <span v-if="enemy.block > 0" class="block-chip">{{ enemy.block }}</span>
              <div class="hp-bar" :class="{ shielded: enemy.block > 0 }">
                <span :style="{ width: getHpPercent(enemy.hp, enemy.maxHp) + '%' }"></span>
                <strong>{{ enemy.hp }}/{{ enemy.maxHp }}</strong>
              </div>
            </div>
            <div class="statuses">
              <span v-for="status in formatStatuses(enemy.statuses)" :key="status">{{ status }}</span>
            </div>
          </div>
        </article>
      </section>

      <section class="bottom-hud">
        <div class="energy-orb">
          <strong>{{ combatState.energy }}/{{ combatState.maxEnergy }}</strong>
          <span>Энергия</span>
        </div>

        <button type="button" class="pile draw-pile" @click="openCardModal('draw')">
          <div class="pile-icon">🂠</div>
          <strong>{{ combatState.drawPile.length }}</strong>
          <span>Колода</span>
        </button>

        <div class="hand">
          <article
            v-for="(card, index) in combatStore.handCards"
            :key="card.instanceId"
            class="card"
            :class="[
              `card-${card.definition.type}`,
              {
                disabled: combatState.energy < card.definition.cost,
                dragging: dragState?.cardInstanceId === card.instanceId && card.definition.target !== 'enemy',
                aimingSource: dragState?.cardInstanceId === card.instanceId && card.definition.target === 'enemy',
              },
            ]"
            :style="getCardStyle(card.instanceId, index)"
            @pointerdown.stop.prevent="startCardDrag(card.instanceId, $event)"
          >
            <span class="card-cost">{{ card.definition.cost }}</span>
            <strong class="card-title">{{ card.definition.name }}</strong>
            <small>{{ cardTypeLabels[card.definition.type] }}</small>
            <div class="card-art">{{ getCardIcon(card.definition.type, card.definition.target) }}</div>
            <p>{{ card.definition.description }}</p>
          </article>
        </div>

        <button type="button" class="end-turn-button" @click="combatStore.endTurn">Завершить ход</button>

        <button type="button" class="pile discard-pile" @click="openCardModal('discard')">
          <div class="pile-icon">↻</div>
          <strong>{{ combatState.discardPile.length }}</strong>
          <span>Сброс</span>
        </button>
      </section>
    </section>

    <section v-if="cardModalType" class="card-modal-backdrop" @click.self="closeCardModal">
      <div class="card-modal" role="dialog" aria-modal="true">
        <header class="card-modal-header">
          <div>
            <h2>{{ cardModalTitle }}</h2>
            <p>{{ modalCards.length }} карт</p>
          </div>
          <button type="button" class="modal-close-button" @click="closeCardModal">×</button>
        </header>

        <div v-if="modalCards.length > 0" class="modal-card-grid">
          <article
            v-for="card in modalCards"
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

    <section v-if="combatState.phase !== 'playerTurn'" class="result-panel">
      <h2>{{ resultTitle }}</h2>
      <p>{{ resultDescription }}</p>
      <button type="button" @click="goHub">Вернуться в хаб</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCombatStore } from '@/stores/combat';
import { getCardById } from '@/game/cards/starterCards';
import type { CardDefinition, CardInstance, CardTargetType, CardType, StatusId } from '@/game/cards/cardTypes';
import type { EnemyIntent } from '@/game/combat/combatTypes';

const router = useRouter();
const combatStore = useCombatStore();
const combatState = computed(() => combatStore.state);
const money = 99;

type DragState = {
  cardInstanceId: string;
  pointerOffsetX: number;
  pointerOffsetY: number;
  sourceX: number;
  sourceY: number;
  currentX: number;
  currentY: number;
};
const dragState = ref<DragState | null>(null);
const hoveredEnemyId = ref<string | null>(null);
const viewportWidth = ref(window.innerWidth);
const viewportHeight = ref(window.innerHeight);

type CardModalType = 'deck' | 'draw' | 'discard';
type ModalCard = CardInstance & {
  definition: CardDefinition;
};

const cardModalType = ref<CardModalType | null>(null);

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

const isAiming = computed(() => dragState.value !== null && draggedCard.value?.definition.target === 'enemy');

const playerStatuses = computed(() => (combatState.value ? formatStatuses(combatState.value.player.statuses) : []));

const playerHpPercent = computed(() => {
  if (!combatState.value) {
    return 0;
  }

  return getHpPercent(combatState.value.player.hp, combatState.value.player.maxHp);
});

const totalDeckSize = computed(() => {
  if (!combatState.value) {
    return 0;
  }

  return (
    combatState.value.drawPile.length +
    combatState.value.hand.length +
    combatState.value.discardPile.length +
    combatState.value.exhaustPile.length
  );
});

const cardModalTitle = computed(() => {
  if (cardModalType.value === 'draw') {
    return 'Колода добора';
  }

  if (cardModalType.value === 'discard') {
    return 'Сброс';
  }

  return 'Текущая колода';
});

const modalCards = computed<ModalCard[]>(() => {
  const state = combatState.value;

  if (!state || !cardModalType.value) {
    return [];
  }

  const cardInstances =
    cardModalType.value === 'draw'
      ? state.drawPile
      : cardModalType.value === 'discard'
        ? state.discardPile
        : [...state.drawPile, ...state.hand, ...state.discardPile, ...state.exhaustPile];

  return cardInstances.map((cardInstance) => ({
    ...cardInstance,
    definition: getCardById(cardInstance.cardId),
  }));
});

const arrowPath = computed(() => {
  if (!dragState.value) {
    return '';
  }

  const startX = dragState.value.sourceX;
  const startY = dragState.value.sourceY;
  const endX = dragState.value.currentX;
  const endY = dragState.value.currentY;

  const target = hoveredEnemyId.value ? document.querySelector(`[data-enemy-id="${hoveredEnemyId.value}"] .enemy-core`) : null;
  const targetRect = target instanceof HTMLElement ? target.getBoundingClientRect() : null;
  const finalX = targetRect ? targetRect.left + targetRect.width / 2 : endX;
  const finalY = targetRect ? targetRect.top + targetRect.height / 2 : endY;
  const controlX = (startX + finalX) / 2;
  const controlY = Math.min(startY, finalY) - 180;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${finalX} ${finalY}`;
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
    return 'Татьяна возвращается в хаб, но теряет всё, что было взято с собой.';
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
    return `Нанесёт ${intent.damage * intent.hits} урона.`;
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

const getCardStyle = (cardInstanceId: string, index: number) => {
  const card = combatStore.handCards.find((item) => item.instanceId === cardInstanceId);
  const isDraggedNonTargetCard =
    dragState.value?.cardInstanceId === cardInstanceId && card?.definition.target !== 'enemy';

  if (dragState.value && isDraggedNonTargetCard) {
    return {
      left: `${dragState.value.currentX - dragState.value.pointerOffsetX}px`,
      top: `${dragState.value.currentY - dragState.value.pointerOffsetY}px`,
      transform: 'rotate(0deg) scale(1.04)',
      zIndex: 220,
    };
  }

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
    pointerOffsetX: event.clientX - rect.left,
    pointerOffsetY: event.clientY - rect.top,
    sourceX: rect.left + rect.width / 2,
    sourceY: rect.top + rect.height * 0.22,
    currentX: event.clientX,
    currentY: event.clientY,
  };
};

const findEnemyUnderPointer = (x: number, y: number): string | null => {
  const elements = document.elementsFromPoint(x, y);

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    const enemyElement = element.closest<HTMLElement>('[data-enemy-id]');

    if (enemyElement?.dataset.enemyId) {
      return enemyElement.dataset.enemyId;
    }
  }

  return null;
};

const isPointerInHand = (x: number, y: number): boolean => {
  const elements = document.elementsFromPoint(x, y);

  return elements.some((element) => element instanceof HTMLElement && element.closest('.hand'));
};

const onPointerMove = (event: PointerEvent): void => {
  if (!dragState.value) {
    return;
  }

  dragState.value.currentX = event.clientX;
  dragState.value.currentY = event.clientY;
  hoveredEnemyId.value = isAiming.value ? findEnemyUnderPointer(event.clientX, event.clientY) : null;
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
  } else if (!isPointerInHand(event.clientX, event.clientY)) {
    combatStore.playCardFromHand(card.instanceId);
  }

  dragState.value = null;
  hoveredEnemyId.value = null;
};

const updateViewportSize = (): void => {
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
};

const openCardModal = (type: CardModalType): void => {
  cardModalType.value = type;
};

const closeCardModal = (): void => {
  cardModalType.value = null;
};

const goHub = (): void => {
  router.push('/');
};

onMounted(() => {
  updateViewportSize();
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', updateViewportSize);

  if (!combatStore.state) {
    combatStore.startTestCombat();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('resize', updateViewportSize);
});
</script>

<style scoped lang="scss">
.combat-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  color: #edf2f7;
  background: #080b10;
  user-select: none;

  &.aiming {
    cursor: crosshair;
  }
}

.top-bar {
  position: relative;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 24px;
  height: 58px;
  padding: 0 28px;
  background: rgba(4, 7, 10, 0.94);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.hub-button,
.settings-button {
  border: 0;
  border-radius: 12px;
  padding: 9px 12px;
  color: #dce7f2;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.hero-name {
  font-size: 25px;
}

.top-stat {
  font-size: 20px;
  font-weight: 900;
}

.hp {
  color: #ff5555;
}

.money {
  color: #68e96f;
}

.top-spacer {
  flex: 1;
}

.deck-size {
  border: 0;
  border-radius: 12px;
  padding: 9px 13px;
  color: #d9e4ee;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  font-size: 18px;
  font-weight: 800;
}

.deck-size:hover {
  background: rgba(123, 211, 255, 0.18);
}

.battlefield {
  position: relative;
  height: calc(100vh - 58px);
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(6, 9, 13, 0.1), rgba(6, 9, 13, 0.88)),
    radial-gradient(circle at 38% 32%, rgba(63, 114, 141, 0.26), transparent 36%),
    radial-gradient(circle at 50% 100%, rgba(110, 79, 60, 0.24), transparent 44%),
    linear-gradient(135deg, #121923 0%, #06080c 64%, #120d0a 100%);
}

.battlefield::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.22;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 120px 120px;
}

.target-arrow {
  position: fixed;
  inset: 0;
  z-index: 210;
  pointer-events: none;
}

.arrow-shadow,
.arrow-line {
  fill: none;
  stroke-linecap: round;
}

.arrow-shadow {
  stroke: rgba(40, 178, 255, 0.42);
  stroke-width: 22;
  filter: url(#arrow-blur);
}

.arrow-line {
  stroke: #55c5ff;
  stroke-width: 8;
  stroke-dasharray: 22 14;
  filter: drop-shadow(0 0 8px rgba(85, 197, 255, 0.95));
}

.arrow-head {
  fill: #55c5ff;
  filter: drop-shadow(0 0 8px rgba(85, 197, 255, 0.95));
}

.player-unit {
  position: absolute;
  left: 7%;
  top: 22%;
  width: 350px;
  height: 410px;
}

.shield-sphere {
  position: absolute;
  left: 12px;
  top: 28px;
  width: 310px;
  height: 310px;
  border: 2px solid rgba(132, 219, 255, 0.7);
  border-radius: 50%;
  background:
    repeating-radial-gradient(circle, rgba(155, 231, 255, 0.08), rgba(155, 231, 255, 0.08) 2px, transparent 3px, transparent 24px),
    radial-gradient(circle, rgba(105, 201, 255, 0.2), rgba(105, 201, 255, 0.04) 58%, transparent 66%);
  box-shadow: 0 0 65px rgba(75, 196, 255, 0.42), inset 0 0 55px rgba(75, 196, 255, 0.16);
}

.player-silhouette {
  position: absolute;
  left: 122px;
  top: 102px;
  width: 78px;
  height: 166px;
  border-radius: 44px 44px 16px 16px;
  background:
    linear-gradient(90deg, transparent 75%, #4f5965 76% 100%),
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
    right: -112px;
    top: 70px;
    width: 130px;
    height: 15px;
    border-radius: 999px;
    background: linear-gradient(90deg, #2e3540, #b9c7d4);
    transform: rotate(-5deg);
  }
}

.actor-bars {
  position: absolute;
  display: grid;
  gap: 6px;
}

.player-bars {
  left: 50%;
  top: 360px;
  width: 250px;
  transform: translateX(-50%);
}

.hp-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.block-chip {
  position: relative;
  width: 42px;
  height: 46px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  color: #e7fbff;
  background: linear-gradient(180deg, #25d48f 0%, #117a68 100%);
  clip-path: polygon(50% 0, 91% 13%, 83% 72%, 50% 100%, 17% 72%, 9% 13%);
  font-size: 20px;
  font-weight: 1000;
  line-height: 1;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.85);
  filter: drop-shadow(0 0 8px rgba(52, 239, 184, 0.5));
}

.block-chip::before {
  content: '';
  position: absolute;
  inset: 4px;
  clip-path: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.hp-bar {
  position: relative;
  flex: 1;
  height: 15px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.58);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #b11d28, #ff595f);
  }

  &.shielded {
    background: rgba(10, 42, 70, 0.9);
    box-shadow: inset 0 0 0 1px rgba(117, 214, 255, 0.42), 0 0 8px rgba(76, 190, 255, 0.24);
  }

  &.shielded span {
    background: linear-gradient(90deg, #1485dd, #72d9ff);
  }

  strong {
    position: absolute;
    inset: -2px 0 0;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 13px;
    line-height: 1;
    text-shadow: 0 1px 2px #000;
  }
}

.statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 20px;

  span {
    border-radius: 999px;
    padding: 2px 7px;
    color: #dce7f2;
    background: rgba(255, 255, 255, 0.08);
    font-size: 11px;
  }
}

.enemies-area {
  position: absolute;
  right: 6%;
  top: 14%;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  gap: 72px;
  height: 430px;
}

.enemy-unit {
  position: relative;
  width: 230px;
  height: 410px;
  transition: filter 0.16s ease, transform 0.16s ease;

  &.targetable {
    cursor: crosshair;
  }

  &.hovered {
    transform: translateY(-8px);
    filter: drop-shadow(0 0 24px rgba(82, 196, 255, 0.95));

    .enemy-core {
      box-shadow: 0 0 52px rgba(82, 196, 255, 0.7);
    }
  }

  &.defeated {
    opacity: 0.35;
    filter: grayscale(1);
  }
}

.intent-card {
  position: absolute;
  left: 50%;
  top: 0;
  display: grid;
  gap: 12px;
  width: 220px;
  min-height: 112px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(7, 8, 13, 0.88);
  transform: translateX(-50%);

  strong {
    font-size: 18px;
  }

  span {
    color: #fff;
    font-size: 14px;
    line-height: 1.45;
  }
}

.intent-attack strong {
  color: #ff5c64;
}

.intent-block strong {
  color: #d9e99a;
}

.intent-debuff strong {
  color: #c678ff;
}

.intent-icon-row {
  position: absolute;
  left: 50%;
  top: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 70px;
  color: #fff;
  font-size: 22px;
  transform: translateX(-50%);

  strong {
    font-size: 28px;
  }
}

.enemy-core {
  position: absolute;
  left: 50%;
  top: 190px;
  width: 128px;
  height: 142px;
  border-radius: 42px 42px 24px 24px;
  background:
    radial-gradient(circle at 50% 42%, #7adfff 0 7px, transparent 8px),
    linear-gradient(90deg, transparent 42%, rgba(255, 255, 255, 0.25) 43% 58%, transparent 59%),
    linear-gradient(135deg, #76716c, #1f252d 70%);
  transform: translateX(-50%);

  &::before,
  &::after {
    content: '';
    position: absolute;
    bottom: -46px;
    width: 24px;
    height: 62px;
    border-radius: 999px;
    background: #303740;
  }

  &::before {
    left: 28px;
    transform: rotate(10deg);
  }

  &::after {
    right: 28px;
    transform: rotate(-10deg);
  }
}

.enemy-rusty-bot-2 {
  border-radius: 45%;
}

.enemy-rusty-bot-3 {
  width: 116px;
  border-radius: 50%;
}

.enemy-bars {
  left: 50%;
  top: 386px;
  width: 230px;
  transform: translateX(-50%);
}

.bottom-hud {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: 140px 124px minmax(580px, 1fr) 240px 124px;
  align-items: end;
  gap: 18px;
  padding: 0 34px 26px;
  min-height: 310px;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.76), transparent 94%);
}

.energy-orb {
  width: 105px;
  height: 105px;
  display: grid;
  place-items: center;
  align-content: center;
  border: 3px solid rgba(98, 203, 255, 0.72);
  border-radius: 50%;
  background: radial-gradient(circle, #183247, #0b1522 70%);
  box-shadow: 0 0 34px rgba(79, 195, 255, 0.46);

  strong {
    font-size: 34px;
  }

  span {
    color: #aeb8c3;
    font-size: 12px;
    text-transform: uppercase;
  }
}

.pile {
  width: 94px;
  height: 128px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 12px;
  color: #edf2f7;
  background: rgba(8, 12, 18, 0.78);
  cursor: pointer;

  .pile-icon {
    width: 46px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    color: #9ddfff;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04));
    font-size: 26px;
  }

  strong {
    font-size: 28px;
  }

  span {
    color: #d6e2ed;
    font-size: 13px;
    text-transform: uppercase;
  }
}

.pile:hover {
  border-color: rgba(123, 211, 255, 0.58);
  background: rgba(20, 39, 55, 0.86);
}

.hand {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 10px;
  min-height: 286px;
}

.card {
  position: relative;
  width: 180px;
  height: 260px;
  flex: 0 0 180px;
  display: grid;
  grid-template-rows: 42px 22px 96px 1fr;
  gap: 5px;
  padding: 20px 14px 14px;
  border: 2px solid rgba(91, 199, 255, 0.76);
  border-radius: 14px;
  color: #f3f7fb;
  background: linear-gradient(180deg, #26313d, #101620 72%);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.42), 0 0 12px rgba(76, 190, 255, 0.18);
  cursor: grab;
  touch-action: none;

  &.card-attack {
    border-color: rgba(255, 92, 88, 0.76);
  }

  &.card-talent {
    border-color: rgba(242, 198, 72, 0.78);
  }

  &.disabled {
    filter: grayscale(0.7) brightness(0.62);
    cursor: not-allowed;
  }

  &.dragging {
    position: fixed;
    margin: 0;
    pointer-events: none;
    cursor: grabbing;
    box-shadow: 0 18px 52px rgba(0, 0, 0, 0.58), 0 0 26px rgba(89, 204, 255, 0.55);
  }

  &.aimingSource {
    cursor: crosshair;
    transform: translateY(-18px) scale(1.04) !important;
    box-shadow: 0 18px 52px rgba(0, 0, 0, 0.58), 0 0 34px rgba(89, 204, 255, 0.8);
  }
}

.card-cost {
  position: absolute;
  left: -18px;
  top: -18px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 3px solid #8ee3ff;
  border-radius: 50%;
  color: #fff;
  background: #174b6a;
  font-size: 25px;
  font-weight: 900;
}

.card-title {
  align-self: center;
  min-height: 38px;
  display: grid;
  place-items: center;
  overflow: hidden;
  text-align: center;
  font-size: 15px;
  line-height: 1.15;
}

.card small {
  justify-self: center;
  align-self: center;
  padding: 3px 8px;
  border-radius: 999px;
  color: #1a2430;
  background: #c8d5df;
  font-size: 11px;
  font-weight: 800;
}

.card-art {
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #9de8ff;
  background: radial-gradient(circle, rgba(118, 215, 255, 0.25), rgba(255, 255, 255, 0.04) 56%, rgba(0, 0, 0, 0.22));
  font-size: 42px;
}

.card p {
  align-self: end;
  min-height: 48px;
  max-height: 58px;
  margin: 0;
  overflow: hidden;
  color: #f6f9fb;
  text-align: center;
  font-size: 13px;
  line-height: 1.22;
}

.end-turn-button {
  align-self: center;
  min-height: 70px;
  border: 2px solid rgba(112, 197, 255, 0.44);
  border-radius: 13px;
  padding: 0 28px;
  color: #f1f7fb;
  background: linear-gradient(180deg, #2d536b, #203747);
  box-shadow: 0 0 24px rgba(95, 198, 255, 0.16);
  cursor: pointer;
  font-size: 22px;
  font-weight: 900;
  text-transform: uppercase;
}

.card-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 280;
  display: grid;
  place-items: center;
  padding: 40px;
  background: rgba(0, 0, 0, 0.64);
  backdrop-filter: blur(3px);
}

.card-modal {
  width: min(1050px, calc(100vw - 80px));
  max-height: min(760px, calc(100vh - 80px));
  overflow: hidden;
  border: 1px solid rgba(143, 224, 255, 0.24);
  border-radius: 22px;
  background: rgba(8, 12, 18, 0.97);
  box-shadow: 0 30px 110px rgba(0, 0, 0, 0.62), 0 0 32px rgba(75, 190, 255, 0.14);
}

.card-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 26px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    margin: 0;
    font-size: 28px;
  }

  p {
    margin: 4px 0 0;
    color: #9fb0c0;
  }
}

.modal-close-button {
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  color: #edf7ff;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  font-size: 34px;
  line-height: 1;
}

.modal-card-grid {
  max-height: calc(min(760px, 100vh - 80px) - 96px);
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 16px;
  padding: 24px 26px 30px;
}

.modal-card {
  position: relative;
  min-height: 198px;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 8px;
  padding: 26px 14px 14px;
  border: 2px solid rgba(91, 199, 255, 0.66);
  border-radius: 14px;
  background: linear-gradient(180deg, #26313d, #101620 72%);

  &.modal-card-attack {
    border-color: rgba(255, 92, 88, 0.72);
  }

  &.modal-card-talent {
    border-color: rgba(242, 198, 72, 0.74);
  }

  strong {
    text-align: center;
    font-size: 16px;
    line-height: 1.15;
  }

  small {
    justify-self: center;
    padding: 3px 8px;
    border-radius: 999px;
    color: #1a2430;
    background: #c8d5df;
    font-size: 11px;
    font-weight: 800;
  }

  p {
    margin: 0;
    color: #edf4f9;
    text-align: center;
    font-size: 13px;
    line-height: 1.3;
  }
}

.modal-card-cost {
  position: absolute;
  left: -12px;
  top: -12px;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 3px solid #8ee3ff;
  border-radius: 50%;
  color: #fff;
  background: #174b6a;
  font-size: 22px;
  font-weight: 900;
}

.empty-modal-text {
  margin: 0;
  padding: 42px;
  color: #aeb8c3;
  text-align: center;
  font-size: 18px;
}

.result-panel {
  position: absolute;
  z-index: 300;
  left: 50%;
  top: 50%;
  width: min(520px, calc(100vw - 48px));
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 22px;
  background: rgba(8, 12, 18, 0.96);
  box-shadow: 0 30px 110px rgba(0, 0, 0, 0.55);
  transform: translate(-50%, -50%);

  h2 {
    margin: 0 0 10px;
  }

  p {
    color: #b9c4d0;
    line-height: 1.55;
  }

  button {
    border: 0;
    border-radius: 12px;
    padding: 12px 18px;
    color: #081018;
    background: #9be7ff;
    cursor: pointer;
    font-weight: 800;
  }
}
</style>
