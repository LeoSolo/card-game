import type { EquipmentSlot } from '@/game/equipment/equipmentTypes';
import type { InventoryItem } from '@/game/combat/combatTypes';

export const equipmentSlotLabels: Record<EquipmentSlot, string> = {
  weapon: 'Оружие',
  body: 'Броня',
  pants: 'Штаны',
  boots: 'Ботинки',
  utility: 'Доп. оборудование',
};

export const inventoryKindLabels: Record<InventoryItem['kind'], string> = {
  material: 'Материал',
  medicine: 'Медицина',
  component: 'Компонент',
  loot: 'Лут',
};
