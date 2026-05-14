import type { EquippedItems, EquipmentItem } from './equipmentTypes';

export const startingRifle: EquipmentItem = {
  id: 'future-rifle-mk1',
  name: 'Винтовка будущего Mk.I',
  slot: 'weapon',
  rarity: 'gray',
  description: 'Базовое оружие искательницы. Без дополнительных модификаторов.',
  modifiers: [],
};

export const scoutShield: EquipmentItem = {
  id: 'scout-shield',
  name: 'Скаутский щит',
  slot: 'utility',
  rarity: 'gray',
  description: 'Прототип складного щита. Позже этот слот сможет давать побег, деньги или лут.',
  modifiers: [],
};

export const startingEquipment: EquippedItems = {
  weapon: startingRifle,
  utility: scoutShield,
};
