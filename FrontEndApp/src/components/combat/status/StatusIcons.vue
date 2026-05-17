<template>
  <div class='status-icons'>
    <span
      v-for='status in visibleStatuses'
      :key='status.id'
      class='status-icon'
      :title='status.tooltip'
    >
      <strong>{{ status.icon }}</strong>
      <small>{{ status.value }}</small>
    </span>
  </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue';
import type { StatusId } from '@/game/cards/cardTypes';
import { formatStatusTooltip, statusIcons } from '@/game/combat/combatUiTypes';

const props = defineProps<{
  statuses: Partial<Record<StatusId, number>>;
}>();

const visibleStatuses = computed(() =>
  Object.entries(props.statuses)
    .filter(([, value]) => (value ?? 0) > 0)
    .map(([id, value]) => {
      const statusId = id as StatusId;
      const statusValue = value ?? 0;

      return {
        id: statusId,
        value: statusValue,
        icon: statusIcons[statusId],
        tooltip: formatStatusTooltip(statusId, statusValue),
      };
    }),
);
</script>

<style scoped>
.status-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 24px;
  margin-top: 8px;
}

.status-icon {
  display: grid;
  grid-template-columns: auto auto;
  place-items: center;
  column-gap: 3px;
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border: 1px solid rgba(123, 214, 255, 0.32);
  border-radius: 999px;
  background: rgba(123, 214, 255, 0.15);
  color: #bfefff;
  cursor: help;
}

.status-icon strong {
  font-size: 14px;
  line-height: 1;
}

.status-icon small {
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
}
</style>
