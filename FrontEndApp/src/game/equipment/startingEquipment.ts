import type { EquippedItems, EquipmentItem } from './equipmentTypes';

export const startingRifle: EquipmentItem = {
  id: 'future-rifle-mk1',
  name: 'Винтовка будущего Mk.I',
  slot: 'weapon',
  rarity: 'gray',
  description: 'Базовое оружие искательницы. Без дополнительных модификаторов.',
  modifiers: [],
};

export const shieldEmitter: EquipmentItem = {
  id: 'shield-emitter-mk1',
  name: 'Генератор энергетического щита Mk.I',
  slot: 'utility',
  rarity: 'gray',
  description: 'Создаёт защитную энергетическую сферу вокруг искательницы. Позже этот слот сможет давать побег, деньги или лут.',
  modifiers: [],
};

export const startingEquipment: EquippedItems = {
  weapon: startingRifle,
  utility: shieldEmitter,
};
