/**
 * GlimmerFall Online MMORPG - Core TypeScript Engine Types
 */

export type FactionId = 'Solari' | 'Terra' | 'Umbri' | 'Aether';

export type PrimaryResourceType = 'Mana' | 'Energy' | 'ShadowEnergy' | 'Fury';

export interface AbilityDefinition {
  id: string;
  name: string;
  faction: FactionId;
  classId: string;
  icon: string;
  castTime: number; // seconds (0 for instant)
  cooldown: number; // seconds
  range: number; // yards (0 for self, 5 for melee, 25-40 for ranged)
  cost: number;
  resourceType: PrimaryResourceType | 'SolarCharge' | 'DuskPoints' | 'PrimalFury' | 'AstralResonance';
  isOffGCD?: boolean;
  targetType: 'friendly' | 'hostile' | 'ground' | 'self';
  description: string;
}

export interface ClassDefinition {
  id: string;
  name: string;
  faction: FactionId;
  role: 'Tank' | 'Healer' | 'MeleeDPS' | 'RangedDPS';
  armorType: 'Cloth' | 'Leather' | 'Mail' | 'Plate';
  primaryResource: PrimaryResourceType;
  secondaryResource: string;
  abilities: AbilityDefinition[];
}

export interface UnitEntity {
  id: string;
  name: string;
  type: 'player' | 'nexus' | 'node' | 'mob' | 'boss';
  faction: FactionId | 'Neutral';
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  secondaryResource: number;
  maxSecondaryResource: number;
  position: { x: number; y: number; z: number };
  rotationY: number;
  isDead: boolean;
}

export interface RelicCardSocket {
  cardId: string;
  name: string;
  imageUrl: string;
  faction: FactionId;
  passiveBonus: string;
}
