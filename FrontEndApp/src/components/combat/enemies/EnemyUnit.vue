<template>
  <article
    class='enemy-unit'
    :class='{
      defeated: enemy.hp <= 0,
      targetable: isAiming && enemy.hp > 0,
      hovered: isAiming && hoveredEnemyId === enemy.id,
    }'
    :data-enemy-id='enemy.id'
  >
    <div
      v-if='enemy.hp > 0'
      class='intent-card'
      :class='`intent-${enemy.intent.type}`'
>
      <template v-if="enemy.intent.type === 'attack'">
        <strong>{{ getIntentTitle(enemy.intent) }}</strong>
        <span>{{ getIntentDescription(enemy.intent) }}</span>
      </template>
      <span
        v-else
        class='intent-only-icon'
        @mouseenter='showTooltip(getIntentDescription(enemy.intent), $event)'
        @mousemove='moveTooltip($event)'
        @mouseleave='hideTooltip'
      >
        {{ getIntentIcon(enemy.intent.type) }}
      </span>
    </div>

    <div v-if="enemy.hp > 0 && enemy.intent.type === 'attack'" class='intent-icon-row'>
      <strong>{{ enemy.intent.damage * enemy.intent.hits }}</strong>
      <span>{{ getIntentIcon(enemy.intent.type) }}</span>
    </div>

    <div class='enemy-core' :class='`enemy-${enemy.id}`'></div>

    <div v-if='enemy.hp > 0' class='actor-bars enemy-bars'>
      <div class='hp-row'>
        <span v-if='enemy.block > 0' class='block-chip'>{{ enemy.block }}</span>
        <div class='hp-bar' :class='{ shielded: enemy.block > 0 }'>
          <span :style="{ width: hpPercent + '%' }"></span>
          <strong>{{ enemy.hp }}/{{ enemy.maxHp }}</strong>
        </div>
      </div>

      <StatusIcons :statuses='enemy.statuses' />
    </div>
    <GameTooltip
      :visible='tooltip.visible'
      :text='tooltip.text'
      :x='tooltip.x'
      :y='tooltip.y'
    />
  </article>
</template>

<script setup lang='ts'>
import { computed, reactive } from 'vue';
import StatusIcons from '@/components/combat/status/StatusIcons.vue';
import GameTooltip from '@/components/ui/GameTooltip.vue';
import type { CombatEnemy } from '@/game/combat/combatTypes';
import { getIntentDescription, getIntentIcon, getIntentTitle } from '@/game/combat/combatUiTypes';

const props = defineProps<{
  enemy: CombatEnemy;
  isAiming: boolean;
  hoveredEnemyId: string | null;
}>();

const tooltip = reactive({
  visible: false,
  text: '',
  x: 0,
  y: 0,
});

const showTooltip = (text: string, event: MouseEvent): void => {
  tooltip.visible = true;
  tooltip.text = text;
  tooltip.x = event.clientX;
  tooltip.y = event.clientY;
};

const moveTooltip = (event: MouseEvent): void => {
  tooltip.x = event.clientX;
  tooltip.y = event.clientY;
};

const hideTooltip = (): void => {
  tooltip.visible = false;
  tooltip.text = '';
};


const hpPercent = computed(() => {
  if (props.enemy.maxHp <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (props.enemy.hp / props.enemy.maxHp) * 100));
});
</script>

<style scoped>
.enemy-unit {
  position: relative;
  width: 210px;
  height: 420px;
  transition: filter 0.16s ease, transform 0.16s ease;
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
  min-height: 76px;
  gap: 6px;
  padding: 10px 14px;
  border: 1px solid rgba(154, 223, 255, 0.18);
  border-radius: 14px;
  transform: translateX(-50%);
  background: rgba(7, 14, 20, 0.82);
  text-align: center;
}

.intent-card strong {
  font-size: 13px;
}

.intent-card span {
  color: #b8ccd8;
  font-size: 12px;
  line-height: 1.25;
}

.intent-block,
.intent-debuff {
  display: grid;
  place-items: center;
  min-width: 56px;
  min-height: 56px;
  padding: 0;
  cursor: help;
}

.intent-only-icon {
  color: inherit;
  font-size: 24px;
  line-height: 1;
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
  box-shadow: inset 0 0 18px rgba(255, 255, 255, 0.08), 0 0 28px rgba(93, 120, 130, 0.28);
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

.actor-bars {
  position: absolute;
  z-index: 5;
}

.enemy-bars {
  left: 50%;
  top: 372px;
  width: 230px;
  transform: translateX(-50%);
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
</style>
