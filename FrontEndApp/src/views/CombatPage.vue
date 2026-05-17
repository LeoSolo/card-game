<template>
  <main v-if='combatState' class='combat-page' :class='{ aiming: isAiming }'>
    <header class='top-bar'>
      <button type='button' class='hub-button' @click='goHub'>← Хаб</button>
      <button type='button' class='inventory-button' @click='openInventoryModal'>🎒 Инвентарь</button>
      <strong class='hero-name'>Татьяна</strong>
      <div class='top-stat hp'>♥ {{ combatState.player.hp }}/{{ combatState.player.maxHp }}</div>
      <div class='top-stat money'>₽ {{ money }}</div>
      <div class='top-spacer'></div>
      <button type='button' class='deck-size' @click="openCardModal('deck')">Колода {{ totalDeckSize }}</button>
      <button type='button' class='settings-button' @click='combatStore.restartCombat'>↻</button>
    </header>

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

          <div class='statuses'>
            <span v-for='status in playerStatuses' :key='status'>{{ status }}</span>
          </div>
        </div>
      </article>

      <section class='enemies-area'>
        <article
          v-for='enemy in combatState.enemies'
          :key='enemy.id'
          class='enemy-unit'
          :class='{
            defeated: enemy.hp <= 0,
            targetable: isAiming && enemy.hp > 0,
            hovered: isAiming && hoveredEnemyId === enemy.id,
          }'
          :data-enemy-id='enemy.id'
        >
          <div v-if='enemy.hp > 0' class='intent-card' :class='`intent-${enemy.intent.type}`'>
            <strong>{{ intentTitle(enemy.intent) }}</strong>
            <span>{{ intentDescription(enemy.intent) }}</span>
          </div>

          <div v-if='enemy.hp > 0' class='intent-icon-row'>
            <strong v-if="enemy.intent.type === 'attack'">{{ enemy.intent.damage * enemy.intent.hits }}</strong>
            <span>{{ getIntentIcon(enemy.intent.type) }}</span>
          </div>

          <div class='enemy-core' :class='`enemy-${enemy.id}`'></div>

          <div v-if='enemy.hp > 0' class='actor-bars enemy-bars'>
            <div class='hp-row'>
              <span v-if='enemy.block > 0' class='block-chip'>{{ enemy.block }}</span>
              <div class='hp-bar' :class='{ shielded: enemy.block > 0 }'>
                <span :style="{ width: getHpPercent(enemy.hp, enemy.maxHp) + '%' }"></span>
                <strong>{{ enemy.hp }}/{{ enemy.maxHp }}</strong>
              </div>
            </div>

            <div class='statuses'>
              <span v-for='status in formatStatuses(enemy.statuses)' :key='status'>{{ status }}</span>
            </div>
          </div>
        </article>
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

    <section v-if='cardModalType' class='modal-backdrop' @click.self='closeCardModal'>
      <div class='cards-modal'>
        <button type='button' class='modal-close' @click='closeCardModal'>×</button>
        <h2>{{ cardModalTitle }}</h2>
        <div v-if='modalCards.length > 0' class='modal-card-grid'>
          <article
            v-for='card in modalCards'
            :key='card.instanceId'
            class='modal-card'
            :class='`modal-card-${card.definition.type}`'
          >
            <span class='modal-card-cost'>{{ card.definition.cost }}</span>
            <strong>{{ card.definition.name }}</strong>
            <small>{{ cardTypeLabels[card.definition.type] }}</small>
            <p>{{ card.definition.description }}</p>
          </article>
        </div>
        <p v-else class='empty-modal-text'>Здесь пока нет карт.</p>
      </div>
    </section>

    <section v-if='inventoryModalOpen' class='modal-backdrop' @click.self='closeInventoryModal'>
      <div class='inventory-modal'>
        <button type='button' class='modal-close' @click='closeInventoryModal'>×</button>
        <h2>Инвентарь Татьяны</h2>

        <div class='inventory-section'>
          <h3>Снаряжение</h3>
          <div class='equipment-grid'>
            <article v-for='slot in equipmentSlots' :key='slot.id' class='equipment-card'>
              <small>{{ slot.label }}</small>
              <strong>{{ slot.item?.name ?? 'Пусто' }}</strong>
              <p>{{ slot.item?.description ?? 'В этот слот пока ничего не экипировано.' }}</p>
            </article>
          </div>
        </div>

        <div class='inventory-section'>
          <h3>С собой</h3>
          <div class='carried-grid'>
            <article v-for='item in combatState.carriedItems' :key='item.id' class='carried-item'>
              <strong>{{ item.name }} ×{{ item.amount }}</strong>
              <small>{{ inventoryKindLabels[item.kind] }}</small>
              <p>{{ item.description }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section v-if='showRewardModal' class='modal-backdrop reward-backdrop'>
      <div class='reward-modal'>
        <h2>Награда за бой</h2>
        <p class='reward-subtitle'>Забери награды перед возвращением на маршрут.</p>

        <div class='reward-list'>
          <button
            v-if='rewardState && !rewardState.isCardRewardTaken'
            type='button'
            class='reward-row card-reward-row'
            @click='openCardRewardModal'
          >
            <span class='reward-row-icon'>▧</span>
            <span class='reward-row-content'>
              <strong>Выбрать карту</strong>
              <small>Добавить одну из трёх карт в колоду</small>
            </span>
          </button>

          <button
            v-if='rewardState && !rewardState.isMoneyTaken'
            type='button'
            class='reward-row money-reward-row'
            @click='claimMoneyReward'
          >
            <span class='reward-row-icon'>₽</span>
            <span class='reward-row-content'>
              <strong>{{ rewardState.money }} денег</strong>
              <small>Забрать в инвентарь вылазки</small>
            </span>
          </button>

          <button
            v-for='item in visibleRewardLoot'
            :key='item.id'
            type='button'
            class='reward-row loot-reward-row'
            @click='claimLootReward'
          >
            <span class='reward-row-icon'>✦</span>
            <span class='reward-row-content'>
              <strong>{{ item.name }} ×{{ item.amount }}</strong>
              <small>{{ lootRarityLabels[item.rarity] }}</small>
              <span class='reward-loot-tooltip'>{{ item.description }}</span>
            </span>
          </button>
        </div>

        <button type='button' class='reward-continue-button' @click='continueRaid'>Продолжить вылазку</button>
      </div>
    </section>

    <section v-if='cardRewardModalOpen && rewardState' class='modal-backdrop card-reward-backdrop'
             @click.self='closeCardRewardModal'>
      <div class='card-reward-modal'>
        <button type='button' class='modal-close' @click='closeCardRewardModal'>×</button>
        <h2>Выберите карту</h2>
        <div class='reward-card-choice-grid'>
          <article
            v-for='card in rewardState.cardChoices'
            :key='card.id'
            class='reward-card-choice'
            :class='[
              `reward-card-${card.type}`,
              { flying: flyingRewardCardId === card.id },
            ]'
            @click='selectRewardCard(card.id)'
          >
            <span class='reward-card-cost'>{{ card.cost }}</span>
            <strong>{{ card.name }}</strong>
            <small>{{ cardTypeLabels[card.type] }} · {{ rarityLabels[card.rarity] }}</small>
            <p>{{ card.description }}</p>
          </article>
        </div>
      </div>
    </section>

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
import type { CardDefinition, CardInstance, CardTargetType, CardType, StatusId } from '@/game/cards/cardTypes';
import type { EquipmentItem, EquipmentSlot } from '@/game/equipment/equipmentTypes';
import type { EnemyIntent, InventoryItem } from '@/game/combat/combatTypes';

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

const rarityLabels: Record<CardDefinition['rarity'], string> = {
  starter: 'Стартовая',
  common: 'Серая',
  uncommon: 'Зелёная',
  rare: 'Синяя',
};

const lootRarityLabels = {
  common: 'Серый предмет',
  uncommon: 'Зелёный предмет',
  rare: 'Синий предмет',
  legendary: 'Оранжевый предмет',
};

const statusLabels: Record<StatusId, string> = {
  aim: 'Прицел',
  burn: 'Горение',
  weak: 'Слабость',
  vulnerable: 'Уязвимость',
  reinforcedBattery: 'Усиленная батарея',
};

const inventoryKindLabels: Record<InventoryItem['kind'], string> = {
  material: 'Материал',
  medicine: 'Медицина',
  component: 'Компонент',
  loot: 'Лут',
};

const equipmentSlotLabels: Record<EquipmentSlot, string> = {
  weapon: 'Оружие',
  body: 'Броня',
  pants: 'Штаны',
  boots: 'Ботинки',
  utility: 'Доп. оборудование',
};

const draggedCard = computed(() => {
  if (!dragState.value) {
    return null;
  }

  return combatStore.handCards.find((card) => card.instanceId === dragState.value?.cardInstanceId) ?? null;
});

const isAiming = computed(() => dragState.value !== null && draggedCard.value?.definition.target === 'enemy');

const playerStatuses = computed(() => (combatState.value ? formatStatuses(combatState.value.player.statuses) : []));

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

const equipmentSlots = computed<Array<{ id: EquipmentSlot; label: string; item?: EquipmentItem }>>(() => {
  if (!combatState.value) {
    return [];
  }

  const slots: EquipmentSlot[] = ['weapon', 'body', 'pants', 'boots', 'utility'];

  return slots.map((slot) => ({
    id: slot,
    label: equipmentSlotLabels[slot],
    item: combatState.value?.equippedItems[slot],
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

const formatStatuses = (statuses: Partial<Record<StatusId, number>>): string[] =>
  Object.entries(statuses)
    .filter(([, value]) => (value ?? 0) > 0)
    .map(([status, value]) => `${statusLabels[status as StatusId]} ${value}`);

const getIntentIcon = (intentType: EnemyIntent['type']): string => {
  if (intentType === 'attack') {
    return '⚔';
  }

  if (intentType === 'block') {
    return '◆';
  }

  return '☣';
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
    return `${intent.damage * intent.hits} урона`;
  }

  if (intent.type === 'block') {
    return 'Укрепляется';
  }

  return 'Накладывает негативный эффект.';
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
    flyingRewardCardId.value = null;
    cardRewardModalOpen.value = false;
    continueIfRewardsFinished();
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
.deck-size {
    min-height: 38px;
    padding: 0 14px;
}

.inventory-button {
    border-color: rgba(93, 255, 174, 0.38) !important;
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

.statuses {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-height: 24px;
    margin-top: 8px;
}

.statuses span {
    padding: 3px 7px;
    border-radius: 999px;
    background: rgba(123, 214, 255, 0.15);
    color: #bfefff;
    font-size: 11px;
    font-weight: 800;
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

.enemy-unit {
    position: relative;
    width: 210px;
    height: 420px;
    transition: filter 0.16s ease,
    transform 0.16s ease;
}

.enemy-unit.targetable {
    cursor: crosshair;
}

.enemy-unit.hovered {
    filter: drop-shadow(0 0 20px rgba(99, 230, 255, 0.9));
    transform: translateY(-8px) scale(1.04);
}

.enemy-unit.defeated {
    opacity: 0.34;
    filter: grayscale(0.9);
}

.intent-card {
    position: absolute;
    left: 50%;
    top: 0;
    display: grid;
    min-width: 126px;
    border-radius: 14px;
    transform: translateX(-50%);
    text-align: center;
    background: rgba(7, 14, 20, 0.82);
    border: 1px solid rgba(154, 223, 255, 0.18);
    min-height: 76px;
    gap: 6px;
    padding: 10px 14px;
}

.intent-card strong {
    font-size: 13px;
}

.intent-card span {
    color: #b8ccd8;
    font-size: 12px;
    line-height: 1.25;
}

.intent-attack {
    color: #ffaca2;
}

.intent-block {
    color: #9be9ff;
}

.intent-debuff {
    color: #d4a7ff;
}

.intent-icon-row {
    position: absolute;
    left: 50%;
    top: 96px;
    display: flex;
    align-items: center;
    gap: 6px;
    transform: translateX(-50%);
    font-size: 20px;
    font-weight: 1000;
}

.enemy-core {
    position: absolute;
    left: 50%;
    top: 170px;
    width: 130px;
    height: 160px;
    border-radius: 24px 24px 18px 18px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, #76828a, #2e3740);
    box-shadow: inset 0 0 18px rgba(255, 255, 255, 0.08),
    0 0 28px rgba(93, 120, 130, 0.28);
}

.enemy-core::before {
    content: '';
    position: absolute;
    left: 24px;
    top: -42px;
    width: 78px;
    height: 62px;
    border-radius: 22px 22px 12px 12px;
    background: linear-gradient(180deg, #9ca7ad, #414c55);
}

.enemy-core::after {
    content: '';
    position: absolute;
    left: 31px;
    top: -15px;
    width: 68px;
    height: 10px;
    border-radius: 999px;
    background: #ff6657;
    box-shadow: 0 0 16px rgba(255, 86, 73, 0.72);
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
    top: 372px;
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

.modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 700;
    display: grid;
    place-items: center;
    background: rgba(2, 5, 8, 0.74);
    backdrop-filter: blur(6px);
}

.reward-backdrop,
.card-reward-backdrop {
    inset: 82px 0 0;
    z-index: 180;
    background: rgba(2, 5, 8, 0.56);
}

.cards-modal,
.inventory-modal {
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

.modal-card,
.equipment-card,
.carried-item {
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

.modal-card strong,
.equipment-card strong,
.carried-item strong {
    display: block;
    padding-right: 30px;
    color: #f3fbff;
}

.modal-card small,
.equipment-card small,
.carried-item small {
    color: #a9bdc9;
    font-weight: 900;
    text-transform: uppercase;
}

.modal-card p,
.equipment-card p,
.carried-item p {
    color: #c9d9e1;
    font-size: 13px;
    line-height: 1.35;
}

.empty-modal-text {
    color: #b8c9d1;
}

.inventory-section + .inventory-section {
    margin-top: 26px;
}

.equipment-grid,
.carried-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
}


.reward-modal,
.card-reward-modal {
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

.card-reward-modal {
    width: min(980px, calc(100vw - 72px));
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
