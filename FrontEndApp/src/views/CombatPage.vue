<template>
  <main v-if='combatState' class='combat-page' :class='{ aiming: isAiming }'>
    <CombatHeader
      :player-hp='combatState.player.hp'
      :player-max-hp='combatState.player.maxHp'
      :money='money'
      :total-deck-size='totalDeckSize'
      @go-hub='goHub'
      @open-inventory='openInventoryModal'
      @open-deck="openCardModal('deck')"
      @restart-combat='combatStore.restartCombat'
      @win-combat-for-tests='combatStore.winCombatForTests'
    />

    <section class='battlefield'>
      <svg
        v-if='isAiming'
        class='target-arrow'
        :width='viewportWidth'
        :height='viewportHeight'
        :viewBox='`0 0 ${viewportWidth} ${viewportHeight}`'
      >
        <defs>
          <filter id='arrow-blur'>
            <feGaussianBlur stdDeviation='4' result='coloredBlur' />
            <feMerge>
              <feMergeNode in='coloredBlur' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
          <marker
            id='arrow-head'
            markerWidth='34'
            markerHeight='34'
            refX='29'
            refY='17'
            orient='auto'
            markerUnits='userSpaceOnUse'
          >
            <path d='M 0 2 L 34 17 L 0 32 Q 8 17 0 2' class='arrow-head' />
          </marker>
        </defs>

        <path :d='arrowPath' class='arrow-shadow' />
        <path :d='arrowPath' class='arrow-line' marker-end='url(#arrow-head)' />
      </svg>

      <article class='player-unit'>
        <div class='shield-sphere'></div>
        <div class='player-silhouette'></div>

        <div class='actor-bars player-bars'>
          <div class='hp-row'>
            <span v-if='combatState.player.block > 0' class='block-chip'>{{ combatState.player.block }}</span>
            <div class='hp-bar' :class='{ shielded: combatState.player.block > 0 }'>
              <span :style="{ width: playerHpPercent + '%' }"></span>
              <strong>{{ combatState.player.hp }}/{{ combatState.player.maxHp }}</strong>
            </div>
          </div>

          <StatusIcons :statuses='combatState.player.statuses' />
        </div>
      </article>

      <section class='enemies-area'>
        <EnemyUnit
          v-for='enemy in combatState.enemies'
          :key='enemy.id'
          :enemy='enemy'
          :is-aiming='isAiming'
          :hovered-enemy-id='hoveredEnemyId'
        />
      </section>

      <section class='bottom-hud'>
        <div class='energy-orb'>
          <strong>{{ combatState.energy }}/{{ combatState.maxEnergy }}</strong>
          <span>Энергия</span>
        </div>

        <button type='button' class='pile draw-pile' @click="openCardModal('draw')">
          <div class='pile-icon'></div>
          <strong>{{ combatState.drawPile.length }}</strong>
          <span>Колода</span>
        </button>

        <div ref='handElement' class='hand'>
          <article
            v-for='(card, index) in combatStore.handCards'
            :key='card.instanceId'
            class='card'
            :class="[
              `card-${card.definition.type}`,
              {
                disabled: combatState.energy < card.definition.cost,
                dragging: dragState?.cardInstanceId === card.instanceId && card.definition.target !== 'enemy',
                aimingSource: dragState?.cardInstanceId === card.instanceId && card.definition.target === 'enemy',
              },
            ]"
            :style='getCardStyle(card.instanceId, index)'
            @pointerdown.stop.prevent='startCardDrag(card.instanceId, $event)'
          >
            <span class='card-cost'>{{ card.definition.cost }}</span>
            <strong class='card-title'>{{ card.definition.name }}</strong>
            <small>{{ cardTypeLabels[card.definition.type] }}</small>
            <div class='card-art'>{{ getCardIcon(card.definition.type, card.definition.target) }}</div>

            <div
              v-if='getDamagePreview(card.definition)'
              class='damage-preview'
              :class='getDamagePreview(card.definition)?.tone'
            >
              Урон: {{ getDamagePreview(card.definition)?.amount }}
            </div>

            <p>{{ card.definition.description }}</p>
          </article>
        </div>

        <button type='button' class='end-turn-button' @click='combatStore.endTurn'>Завершить ход</button>

        <div class='pile-column'>
          <button type='button' class='pile exhaust-pile' @click="openCardModal('exhaust')">
            <div class='pile-icon'>✕</div>
            <strong>{{ combatState.exhaustPile.length }}</strong>
            <span>Расход</span>
          </button>

          <button type='button' class='pile discard-pile' @click="openCardModal('discard')">
            <div class='pile-icon'>↻</div>
            <strong>{{ combatState.discardPile.length }}</strong>
            <span>Сброс</span>
          </button>
        </div>
      </section>
    </section>

    <CardPileModal
      v-if='cardModalType'
      :title='cardModalTitle'
      :cards='modalCards'
      @close='closeCardModal'
    />

    <InventoryModal
      v-if='inventoryModalOpen'
      :equipped-items='combatState.equippedItems'
      :carried-items='combatState.carriedItems'
      @close='closeInventoryModal'
    />

    <RewardModal
      v-if='showRewardModal && rewardState'
      :has-card-reward='!rewardState.isCardRewardTaken'
      :money='rewardState.isMoneyTaken ? null : rewardState.money'
      :loot='visibleRewardLoot'
      @open-card-reward='openCardRewardModal'
      @claim-money='claimMoneyReward'
      @claim-loot='claimLootReward'
      @continue='continueRaid'
    />

    <CardRewardModal
      v-if='cardRewardModalOpen && rewardState'
      :cards='rewardState.cardChoices'
      :flying-card-id='flyingRewardCardId'
      @close='closeCardRewardModal'
      @select-card='selectRewardCard'
    />

    <section v-if="combatState.phase === 'lost'" class='result-panel'>
      <h2>{{ resultTitle }}</h2>
      <p>{{ resultDescription }}</p>
      <button type='button' @click='goHub'>Вернуться в хаб</button>
    </section>
  </main>
</template>

<script setup lang='ts'>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getFirstDamageEffect } from '@/game/combat/combatEngine';
import { useCombatStore } from '@/stores/combat';
import CombatHeader from '@/components/combat/CombatHeader.vue';
import EnemyUnit from '@/components/combat/enemies/EnemyUnit.vue';
import StatusIcons from '@/components/combat/status/StatusIcons.vue';
import CardPileModal from '@/components/combat/modals/CardPileModal.vue';
import InventoryModal from '@/components/combat/modals/InventoryModal.vue';
import RewardModal from '@/components/combat/rewards/RewardModal.vue';
import CardRewardModal from '@/components/combat/rewards/CardRewardModal.vue';
import type { CardDefinition, CardInstance, CardTargetType, CardType } from '@/game/cards/cardTypes';

const router = useRouter();
const combatStore = useCombatStore();
const combatState = computed(() => combatStore.state);

const money = computed(() => combatState.value?.money ?? 0);

type DragState = {
  cardInstanceId: string;
  pointerOffsetX: number;
  pointerOffsetY: number;
  sourceX: number;
  sourceY: number;
  currentX: number;
  currentY: number;
};

type CardModalType = 'deck' | 'draw' | 'discard' | 'exhaust';

type ModalCard = CardInstance & {
  definition: CardDefinition;
};

type DamageTone = 'normal' | 'reduced' | 'increased';

type DamagePreview = {
  amount: number;
  tone: DamageTone;
};

const dragState = ref<DragState | null>(null);
const hoveredEnemyId = ref<string | null>(null);
const viewportWidth = ref(window.innerWidth);
const viewportHeight = ref(window.innerHeight);
const cardModalType = ref<CardModalType | null>(null);
const inventoryModalOpen = ref(false);
const handElement = ref<HTMLElement | null>(null);
const cardRewardModalOpen = ref(false);
const flyingRewardCardId = ref<string | null>(null);

const cardTypeLabels: Record<CardType, string> = {
  attack: 'Атака',
  skill: 'Навык',
  talent: 'Талант',
};

const draggedCard = computed(() => {
  if (!dragState.value) {
    return null;
  }

  return combatStore.handCards.find((card) => card.instanceId === dragState.value?.cardInstanceId) ?? null;
});

const isAiming = computed(() => dragState.value !== null && draggedCard.value?.definition.target === 'enemy');


const rewardState = computed(() => combatState.value?.reward ?? null);

const hasAvailableReward = computed(() => {
  if (!rewardState.value) {
    return false;
  }

  const hasCardReward = !rewardState.value.isCardRewardTaken;
  const hasMoneyReward = !rewardState.value.isMoneyTaken;
  const hasLootReward = rewardState.value.loot.length > 0 && !rewardState.value.isLootTaken;

  return hasCardReward || hasMoneyReward || hasLootReward;
});

const showRewardModal = computed(() =>
  combatState.value?.phase === 'won' && rewardState.value !== null && hasAvailableReward.value && !cardRewardModalOpen.value,
);

const visibleRewardLoot = computed(() => {
  if (!rewardState.value || rewardState.value.isLootTaken) {
    return [];
  }

  return rewardState.value.loot;
});

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
    combatState.value.drawPile.length
    + combatState.value.hand.length
    + combatState.value.discardPile.length
    + combatState.value.exhaustPile.length
  );
});

const modalCards = computed<ModalCard[]>(() => {
  if (!combatState.value || !cardModalType.value) {
    return [];
  }

  if (cardModalType.value === 'deck') {
    return combatStore.getCardsWithDefinitions([
      ...combatState.value.drawPile,
      ...combatState.value.hand,
      ...combatState.value.discardPile,
      ...combatState.value.exhaustPile,
    ]);
  }

  if (cardModalType.value === 'draw') {
    return combatStore.getCardsWithDefinitions(combatState.value.drawPile);
  }

  if (cardModalType.value === 'discard') {
    return combatStore.getCardsWithDefinitions(combatState.value.discardPile);
  }

  return combatStore.getCardsWithDefinitions(combatState.value.exhaustPile);
});

const cardModalTitle = computed(() => {
  if (cardModalType.value === 'deck') {
    return 'Текущая колода';
  }

  if (cardModalType.value === 'draw') {
    return 'Колода добора';
  }

  if (cardModalType.value === 'discard') {
    return 'Сброс';
  }

  return 'Израсходованные карты';
});


const arrowPath = computed(() => {
  if (!dragState.value) {
    return '';
  }

  const startX = dragState.value.sourceX;
  const startY = dragState.value.sourceY;
  const endX = dragState.value.currentX;
  const endY = dragState.value.currentY;
  const controlX = (startX + endX) / 2;
  const controlY = Math.min(startY, endY) - 140;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
});

const resultTitle = computed(() => (combatState.value?.phase === 'won' ? 'Победа' : 'Поражение'));

const resultDescription = computed(() =>
  combatState.value?.phase === 'won'
    ? 'Все противники уничтожены. Прототип боя завершён.'
    : 'Татьяна потеряла всё, что было с собой, и возвращается в хаб.',
);

const getHpPercent = (hp: number, maxHp: number): number => {
  if (maxHp <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (hp / maxHp) * 100));
};

const getCardIcon = (type: CardType, target: CardTargetType): string => {
  if (type === 'talent') {
    return '✦';
  }

  if (target === 'all-enemies') {
    return '≋';
  }

  if (type === 'attack') {
    return '⌁';
  }

  return '◈';
};

const findHoveredEnemyId = (clientX: number, clientY: number): string | null => {
  const elements = document.elementsFromPoint(clientX, clientY);
  const enemyElement = elements.find((element) => element instanceof HTMLElement && element.dataset.enemyId) as HTMLElement | undefined;

  return enemyElement?.dataset.enemyId ?? null;
};

const findHoveredAliveEnemyId = (clientX: number, clientY: number): string | null => {
  if (!combatState.value) {
    return null;
  }

  const enemyId = findHoveredEnemyId(clientX, clientY);
  const enemy = combatState.value.enemies.find((item) => item.id === enemyId);

  return enemy && enemy.hp > 0 ? enemy.id : null;
};

const isPointerInsideHand = (clientX: number, clientY: number): boolean => {
  const rect = handElement.value?.getBoundingClientRect();

  if (!rect) {
    return false;
  }

  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
};

const startCardDrag = (cardInstanceId: string, event: PointerEvent): void => {
  const card = combatStore.handCards.find((item) => item.instanceId === cardInstanceId);

  if (!card || !combatState.value || combatState.value.energy < card.definition.cost) {
    return;
  }

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  dragState.value = {
    cardInstanceId,
    pointerOffsetX: event.clientX - rect.left,
    pointerOffsetY: event.clientY - rect.top,
    sourceX: rect.left + rect.width / 2,
    sourceY: rect.top + rect.height / 2,
    currentX: event.clientX,
    currentY: event.clientY,
  };

  hoveredEnemyId.value = card.definition.target === 'enemy' ? findHoveredAliveEnemyId(event.clientX, event.clientY) : null;
};

const onPointerMove = (event: PointerEvent): void => {
  if (!dragState.value) {
    return;
  }

  dragState.value.currentX = event.clientX;
  dragState.value.currentY = event.clientY;

  hoveredEnemyId.value = isAiming.value ? findHoveredAliveEnemyId(event.clientX, event.clientY) : null;
};

const onPointerUp = (event: PointerEvent): void => {
  if (!dragState.value || !draggedCard.value) {
    return;
  }

  const card = draggedCard.value;

  if (card.definition.target === 'enemy') {
    const enemyId = findHoveredAliveEnemyId(event.clientX, event.clientY);

    if (enemyId) {
      combatStore.playCardFromHand(card.instanceId, enemyId);
    }
  } else if (!isPointerInsideHand(event.clientX, event.clientY)) {
    combatStore.playCardFromHand(card.instanceId);
  }

  dragState.value = null;
  hoveredEnemyId.value = null;
};

const getCardStyle = (cardInstanceId: string, index: number): Record<string, string> => {
  if (dragState.value?.cardInstanceId === cardInstanceId && draggedCard.value?.definition.target !== 'enemy') {
    return {
      '--card-index': String(index),
      position: 'fixed',
      left: `${dragState.value.currentX - dragState.value.pointerOffsetX}px`,
      top: `${dragState.value.currentY - dragState.value.pointerOffsetY}px`,
      zIndex: '500',
      transform: 'rotate(0deg) scale(1.08)',
    };
  }

  return {
    '--card-index': String(index),
  };
};

const getTargetedEnemyForPreview = () => {
  if (!combatState.value || !hoveredEnemyId.value || !isAiming.value) {
    return undefined;
  }

  return combatState.value.enemies.find((enemy) => enemy.id === hoveredEnemyId.value && enemy.hp > 0);
};

const getDamagePreview = (card: CardDefinition): DamagePreview | undefined => {
  if (!combatState.value) {
    return undefined;
  }

  const damageEffect = getFirstDamageEffect(card);

  if (!damageEffect) {
    return undefined;
  }

  const player = combatState.value.player;
  const targetedEnemy = card.target === 'enemy' ? getTargetedEnemyForPreview() : undefined;
  const target = targetedEnemy ?? combatState.value.enemies.find((enemy) => enemy.hp > 0);
  const baseAmount = damageEffect.amount;

  let amount = baseAmount;

  if ((player.statuses.weak ?? 0) > 0) {
    amount = Math.floor(amount * 0.6);
  }

  if (target && (target.statuses.aim ?? 0) > 0) {
    amount += target.statuses.aim ?? 0;
  }

  if (targetedEnemy && (targetedEnemy.statuses.vulnerable ?? 0) > 0) {
    amount = Math.floor(amount * 1.4);
  }

  let tone: DamageTone = 'normal';

  if (amount < baseAmount) {
    tone = 'reduced';
  }

  if (amount > baseAmount) {
    tone = 'increased';
  }

  return {
    amount,
    tone,
  };
};

const openCardModal = (type: CardModalType): void => {
  cardModalType.value = type;
};

const closeCardModal = (): void => {
  cardModalType.value = null;
};

const openInventoryModal = (): void => {
  inventoryModalOpen.value = true;
};

const closeInventoryModal = (): void => {
  inventoryModalOpen.value = false;
};

const openCardRewardModal = (): void => {
  cardRewardModalOpen.value = true;
};

const closeCardRewardModal = (): void => {
  if (flyingRewardCardId.value) {
    return;
  }

  cardRewardModalOpen.value = false;
};

const continueRaid = (): void => {
  goHub();
};

const continueIfRewardsFinished = (): void => {
  window.setTimeout(() => {
    if (!hasAvailableReward.value) {
      continueRaid();
    }
  }, 0);
};

const claimMoneyReward = (): void => {
  combatStore.claimMoneyReward();
  continueIfRewardsFinished();
};

const claimLootReward = (): void => {
  combatStore.claimLootReward();
  continueIfRewardsFinished();
};

const selectRewardCard = (cardId: string): void => {
  if (flyingRewardCardId.value) {
    return;
  }

  flyingRewardCardId.value = cardId;

  window.setTimeout(() => {
    combatStore.chooseCardReward(cardId);

    window.setTimeout(() => {
      flyingRewardCardId.value = null;
      cardRewardModalOpen.value = false;
      continueIfRewardsFinished();
    }, 300);
  }, 650);
};

const goHub = (): void => {
  router.push('/');
};

const updateViewportSize = (): void => {
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
};

onMounted(() => {
  combatStore.startTestCombat();
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', updateViewportSize);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('resize', updateViewportSize);
});
</script>

<style scoped>
.combat-page {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: radial-gradient(circle at 68% 45%, rgba(65, 105, 125, 0.34), transparent 32%),
    radial-gradient(circle at 24% 55%, rgba(76, 146, 180, 0.18), transparent 26%),
    linear-gradient(180deg, #0a1118 0%, #101923 46%, #0b0e13 100%);
    color: #e8f4ff;
    font-family: Inter, system-ui, sans-serif;
    user-select: none;
}


.battlefield {
    position: absolute;
    inset: 0;
}

.target-arrow {
    position: fixed;
    inset: 0;
    z-index: 900;
    pointer-events: none;
}

.arrow-shadow,
.arrow-line {
    fill: none;
    stroke-linecap: round;
}

.arrow-shadow {
    stroke: rgba(0, 0, 0, 0.6);
    stroke-width: 22;
}

.arrow-line {
    filter: url(#arrow-blur);
    stroke: #6de6ff;
    stroke-width: 9;
}

.arrow-head {
    fill: #6de6ff;
    filter: url(#arrow-blur);
}

.player-unit {
    position: absolute;
    left: 90px;
    top: 270px;
    width: 310px;
    height: 420px;
}

.shield-sphere {
    position: absolute;
    left: 10px;
    top: 6px;
    width: 270px;
    height: 270px;
    border: 2px solid rgba(99, 218, 255, 0.65);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(89, 204, 255, 0.16), rgba(62, 147, 255, 0.05) 58%, transparent 70%);
    box-shadow: 0 0 36px rgba(69, 200, 255, 0.42),
    inset 0 0 28px rgba(86, 206, 255, 0.24);
}

.player-silhouette {
    position: absolute;
    left: 95px;
    top: 70px;
    width: 84px;
    height: 160px;
    border-radius: 42px 42px 18px 18px;
    background: linear-gradient(180deg, #c9d3da, #586a73 42%, #2b343d);
    box-shadow: 44px 38px 0 -28px #7d99a5,
    -36px 56px 0 -27px #45535d,
    72px 68px 0 -31px #31435a;
}

.player-silhouette::before {
    content: '';
    position: absolute;
    left: -4px;
    top: -42px;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: linear-gradient(180deg, #dfe8ee, #9facb5);
}

.player-silhouette::after {
    content: '';
    position: absolute;
    left: 66px;
    top: 60px;
    width: 160px;
    height: 14px;
    border-radius: 999px;
    background: linear-gradient(90deg, #9fb3bb, #5ee7ff 74%, #17232c);
    transform: rotate(-7deg);
    box-shadow: 0 0 18px rgba(97, 229, 255, 0.45);
}

.actor-bars {
    position: absolute;
    z-index: 5;
}

.player-bars {
    left: 20px;
    top: 302px;
    width: 250px;
}

.hp-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.block-chip {
    display: grid;
    place-items: center;
    min-width: 36px;
    height: 36px;
    padding: 0 8px;
    border: 2px solid #9be9ff;
    border-radius: 10px 10px 16px 16px;
    background: linear-gradient(180deg, #214f73, #10263d);
    color: #e6fbff;
    font-weight: 1000;
    box-shadow: 0 0 18px rgba(107, 222, 255, 0.5);
}

.hp-bar {
    position: relative;
    flex: 1;
    height: 28px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    background: rgba(17, 24, 32, 0.9);
}

.hp-bar span {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: linear-gradient(90deg, #c84d52, #ff6e67);
}

.hp-bar.shielded span {
    width: 100% !important;
    background: linear-gradient(90deg, #2d96ff, #62e3ff);
}

.hp-bar strong {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 13px;
    text-shadow: 0 1px 3px #000;
}


.enemies-area {
    position: absolute;
    top: 195px;
    right: 70px;
    display: flex;
    align-items: flex-end;
    gap: 56px;
    min-width: 700px;
    min-height: 460px;
    justify-content: flex-end;
}


.bottom-hud {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    display: grid;
    grid-template-columns: 140px 124px minmax(580px, 1fr) 220px 124px;
    align-items: end;
    gap: 18px;
    min-height: 310px;
    padding: 0 34px 26px;
    background: linear-gradient(180deg, transparent, rgba(5, 8, 13, 0.82) 44%, rgba(5, 8, 13, 0.96));
}

.energy-orb {
    display: grid;
    grid-template-rows: auto auto;
    place-items: center;
    align-content: center;
    row-gap: 4px;
    width: 116px;
    height: 116px;
    border: 2px solid rgba(141, 231, 255, 0.48);
    border-radius: 50%;
    background: radial-gradient(circle, #2c7cff, #142546 65%, #080d18);
    box-shadow: 0 0 32px rgba(72, 169, 255, 0.62);
}

.energy-orb strong {
    display: block;
    margin: 0;
    font-size: 30px;
    line-height: 1;
}

.energy-orb span {
    display: block;
    margin: 0;
    font-size: 11px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
}

.pile-column {
    display: grid;
    gap: 10px;
}

.pile {
    display: grid;
    place-items: center;
    width: 112px;
    height: 128px;
    border: 1px solid rgba(141, 231, 255, 0.3);
    border-radius: 16px;
    background: rgba(12, 24, 34, 0.88);
    color: #e6f8ff;
    cursor: pointer;
    box-shadow: 0 16px 28px rgba(0, 0, 0, 0.28);
}

.pile-icon {
    width: 56px;
    height: 72px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(135deg, transparent 0 22%, rgba(255, 255, 255, 0.2) 23% 24%, transparent 25%),
    linear-gradient(180deg, #263849, #0d1822);
    font-size: 24px;
}

.pile strong {
    font-size: 24px;
}

.pile span {
    color: #acc2cf;
    font-size: 12px;
    font-weight: 900;
}

.exhaust-pile {
    border-color: rgba(255, 142, 142, 0.34);
}

.hand {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 12px;
    min-height: 238px;
    padding: 20px 18px 0;
}

.card {
    position: relative;
    display: grid;
    grid-template-rows: 34px 20px 56px auto 1fr;
    width: 162px;
    height: 244px;
    padding: 13px;
    overflow: hidden;
    border: 2px solid rgba(214, 236, 255, 0.22);
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(40, 58, 73, 0.98), rgba(12, 19, 28, 0.98));
    box-shadow: 0 15px 22px rgba(0, 0, 0, 0.42);
    cursor: grab;
    transition: transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    filter 0.16s ease;
}

.card:hover {
    z-index: 250;
    transform: translateY(-28px) scale(1.12);
    border-color: rgba(116, 232, 255, 0.85);
    box-shadow: 0 26px 42px rgba(0, 0, 0, 0.62),
    0 0 28px rgba(98, 221, 255, 0.54);
    filter: brightness(1.08);
}

.card.disabled {
    cursor: not-allowed;
    filter: grayscale(0.7) brightness(0.72);
}

.card.dragging {
    pointer-events: none;
    opacity: 0.96;
}

.card.aimingSource {
    transform: translateY(-18px) scale(1.06);
    border-color: rgba(116, 232, 255, 0.78);
    box-shadow: 0 0 26px rgba(98, 221, 255, 0.46);
}

.card-attack {
    border-color: rgba(255, 121, 111, 0.36);
}

.card-skill {
    border-color: rgba(93, 199, 255, 0.38);
}

.card-talent {
    border-color: rgba(203, 159, 255, 0.42);
}

.card-cost {
    position: absolute;
    left: 10px;
    top: 10px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: radial-gradient(circle, #63dfff, #1662b4);
    color: #06111d;
    font-weight: 1000;
}

.card-title {
    align-self: start;
    padding-left: 34px;
    overflow: hidden;
    color: #f3fbff;
    font-size: 13px;
    line-height: 1.12;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.card small {
    align-self: start;
    justify-self: start;
    width: fit-content;
    max-width: 100%;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(238, 247, 255, 0.86);
    color: #1a2630;
    font-size: 10px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
}

.card-art {
    display: grid;
    place-items: center;
    min-height: 50px;
    max-height: 56px;
    margin: 5px 0;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    color: #9feaff;
    font-size: 24px;
}

.damage-preview {
    align-self: start;
    justify-self: start;
    max-width: 100%;
    padding: 3px 7px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #f4fbff;
    font-size: 11px;
    font-weight: 1000;
    line-height: 1.1;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.damage-preview.reduced {
    color: #ff6b6b;
}

.damage-preview.increased {
    color: #5dffae;
}

.card p {
    min-height: 0;
    margin: 5px 0 0;
    overflow: hidden;
    color: #d5e6ee;
    font-size: 11px;
    line-height: 1.24;
}

.end-turn-button {
    min-height: 58px;
    padding: 0 24px;
    border: 0;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffcf72, #d97328);
    color: #231306;
    cursor: pointer;
    font-size: 16px;
    font-weight: 1000;
    box-shadow: 0 18px 28px rgba(0, 0, 0, 0.34);
}


.result-panel {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 900;
    width: 420px;
    padding: 28px;
    border: 1px solid rgba(130, 222, 255, 0.28);
    border-radius: 26px;
    transform: translate(-50%, -50%);
    background: rgba(8, 16, 24, 0.95);
    text-align: center;
    box-shadow: 0 34px 80px rgba(0, 0, 0, 0.56);
}

.result-panel button {
    min-height: 44px;
    padding: 0 18px;
    border: 0;
    border-radius: 14px;
    background: #73e4ff;
    color: #06111d;
    cursor: pointer;
    font-weight: 1000;
}

@media (max-width: 1280px) {
    .enemies-area {
        right: 34px;
        gap: 22px;
        transform: scale(0.9);
        transform-origin: right bottom;
    }

    .player-unit {
        left: 48px;
        transform: scale(0.92);
        transform-origin: left bottom;
    }

    .card {
        width: 148px;
        height: 226px;
    }
}
</style>
