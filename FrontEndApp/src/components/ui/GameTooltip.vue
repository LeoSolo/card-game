<template>
  <div
    v-if="visible && text"
    class="game-tooltip"
    :style="tooltipStyle"
  >
    {{ text }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  text: string;
  x: number;
  y: number;
}>();

const tooltipStyle = computed(() => {
  const maxLeft = Math.max(12, window.innerWidth - 300);
  const maxTop = Math.max(12, window.innerHeight - 120);

  return {
    left: `${Math.min(props.x + 16, maxLeft)}px`,
    top: `${Math.min(Math.max(12, props.y + 16), maxTop)}px`,
  };
});
</script>

<style scoped>
.game-tooltip {
  position: fixed;
  z-index: 1200;
  max-width: 280px;
  padding: 10px 12px;
  border: 1px solid #111;
  border-radius: 10px;
  background: #ffffff;
  color: #111111;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
  pointer-events: none;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
}
</style>
