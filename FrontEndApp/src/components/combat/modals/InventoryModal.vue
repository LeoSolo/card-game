<template>
  <section class='modal-backdrop' @click.self='$emit("close")'>
    <div class='inventory-modal'>
      <button type='button' class='modal-close' @click='$emit("close")'>×</button>
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
        <div v-if='carriedItems.length > 0' class='carried-grid'>
          <article v-for='item in carriedItems' :key='item.id' class='carried-item'>
            <strong>{{ item.name }} ×{{ item.amount }}</strong>
            <small>{{ inventoryKindLabels[item.kind] }}</small>
            <p>{{ item.description }}</p>
          </article>
        </div>
        <p v-else class='empty-inventory-text'>Инвентарь пуст.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang='ts'>
import { computed } from 'vue';
import type { InventoryItem } from '@/game/combat/combatTypes';
import type { EquipmentItem, EquipmentSlot, EquippedItems } from '@/game/equipment/equipmentTypes';
import { equipmentSlotLabels, inventoryKindLabels } from '@/game/inventory/inventoryUiTypes';

const props = defineProps<{
  equippedItems: EquippedItems;
  carriedItems: InventoryItem[];
}>();

defineEmits<{
  close: [];
}>();

const equipmentSlots = computed<Array<{ id: EquipmentSlot; label: string; item?: EquipmentItem }>>(() => {
  const slots: EquipmentSlot[] = ['weapon', 'body', 'pants', 'boots', 'utility'];

  return slots.map((slot) => ({
    id: slot,
    label: equipmentSlotLabels[slot],
    item: props.equippedItems[slot],
  }));
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 700;
  display: grid;
  place-items: center;
  background: rgba(2, 5, 8, 0.74);
  backdrop-filter: blur(6px);
}

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

.inventory-section + .inventory-section {
  margin-top: 26px;
}

.equipment-grid,
.carried-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.equipment-card,
.carried-item {
  position: relative;
  min-height: 154px;
  padding: 16px;
  border: 1px solid rgba(150, 221, 255, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
}

.equipment-card strong,
.carried-item strong {
  display: block;
  padding-right: 30px;
  color: #f3fbff;
}

.equipment-card small,
.carried-item small {
  color: #a9bdc9;
  font-weight: 900;
  text-transform: uppercase;
}

.equipment-card p,
.carried-item p,
.empty-inventory-text {
  color: #c9d9e1;
  font-size: 13px;
  line-height: 1.35;
}
</style>
