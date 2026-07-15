import type { FloorPlanObject } from '@/types';

export interface ObjectDefinition {
  type: string;
  label: string;
  icon: string;
  category: 'furniture' | 'restaurant' | 'building' | 'decoration' | 'text';
  defaultWidth: number;
  defaultHeight: number;
  defaultShape: 'circle' | 'rectangle' | 'line' | 'arc' | null;
  defaultStyle: Record<string, unknown>;
  defaultMetadata: Record<string, unknown>;
  isTable: boolean;
}

export const OBJECT_CATEGORIES = [
  { key: 'furniture', label: 'Furniture', icon: '🪑' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { key: 'building', label: 'Building', icon: '🏗️' },
  { key: 'decoration', label: 'Decoration', icon: '🌿' },
  { key: 'text', label: 'Text & Shape', icon: '📝' },
] as const;

export const OBJECT_REGISTRY: ObjectDefinition[] = [
  // ── Furniture: Table Presets (chairs included) ──
  { type: 'round_table_2', label: 'Round Table (2)', icon: '🪑', category: 'furniture', defaultWidth: 70, defaultHeight: 70, defaultShape: 'circle', defaultStyle: { fillColor: '#8B6914', strokeColor: '#5C4A1E', opacity: 1 }, defaultMetadata: { capacity: 2, isVIP: false, preset: 'round_2' }, isTable: true },
  { type: 'round_table_4', label: 'Round Table (4)', icon: '🪑', category: 'furniture', defaultWidth: 90, defaultHeight: 90, defaultShape: 'circle', defaultStyle: { fillColor: '#8B6914', strokeColor: '#5C4A1E', opacity: 1 }, defaultMetadata: { capacity: 4, isVIP: false, preset: 'round_4' }, isTable: true },
  { type: 'round_table_6', label: 'Round Table (6)', icon: '🪑', category: 'furniture', defaultWidth: 110, defaultHeight: 110, defaultShape: 'circle', defaultStyle: { fillColor: '#8B6914', strokeColor: '#5C4A1E', opacity: 1 }, defaultMetadata: { capacity: 6, isVIP: false, preset: 'round_6' }, isTable: true },
  { type: 'round_table_8', label: 'Round Table (8)', icon: '🪑', category: 'furniture', defaultWidth: 130, defaultHeight: 130, defaultShape: 'circle', defaultStyle: { fillColor: '#8B6914', strokeColor: '#5C4A1E', opacity: 1 }, defaultMetadata: { capacity: 8, isVIP: false, preset: 'round_8' }, isTable: true },
  { type: 'square_table_4', label: 'Square Table (4)', icon: '🪑', category: 'furniture', defaultWidth: 90, defaultHeight: 90, defaultShape: 'rectangle', defaultStyle: { fillColor: '#8B6914', strokeColor: '#5C4A1E', opacity: 1 }, defaultMetadata: { capacity: 4, isVIP: false, preset: 'square_4' }, isTable: true },
  { type: 'rectangle_table_6', label: 'Rectangle Table (6)', icon: '🪑', category: 'furniture', defaultWidth: 150, defaultHeight: 80, defaultShape: 'rectangle', defaultStyle: { fillColor: '#8B6914', strokeColor: '#5C4A1E', opacity: 1 }, defaultMetadata: { capacity: 6, isVIP: false, preset: 'rect_6' }, isTable: true },
  { type: 'rectangle_table_8', label: 'Rectangle Table (8)', icon: '🪑', category: 'furniture', defaultWidth: 180, defaultHeight: 80, defaultShape: 'rectangle', defaultStyle: { fillColor: '#8B6914', strokeColor: '#5C4A1E', opacity: 1 }, defaultMetadata: { capacity: 8, isVIP: false, preset: 'rect_8' }, isTable: true },
  { type: 'vip_sofa', label: 'VIP Sofa', icon: '🛋️', category: 'furniture', defaultWidth: 140, defaultHeight: 140, defaultShape: 'circle', defaultStyle: { fillColor: '#6B3A1F', strokeColor: '#D4AF37', opacity: 1 }, defaultMetadata: { capacity: 8, isVIP: true, preset: 'vip_sofa' }, isTable: true },
  { type: 'booth', label: 'Booth', icon: '🪑', category: 'furniture', defaultWidth: 120, defaultHeight: 100, defaultShape: 'rectangle', defaultStyle: { fillColor: '#8B4513', strokeColor: '#5C2E0E', opacity: 1 }, defaultMetadata: { capacity: 4, isVIP: false, preset: 'booth' }, isTable: true },
  { type: 'bar_counter', label: 'Bar Counter', icon: '🍸', category: 'furniture', defaultWidth: 200, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#2F4F4F', strokeColor: '#1C3030', opacity: 1 }, defaultMetadata: { preset: 'bar_counter' }, isTable: false },

  // ── Restaurant ──
  { type: 'cashier', label: 'Cashier', icon: '💰', category: 'restaurant', defaultWidth: 100, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#DAA520', strokeColor: '#B8860B', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'reception', label: 'Reception', icon: '🏨', category: 'restaurant', defaultWidth: 120, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#4682B4', strokeColor: '#36648B', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'kitchen', label: 'Kitchen', icon: '🍳', category: 'restaurant', defaultWidth: 150, defaultHeight: 120, defaultShape: 'rectangle', defaultStyle: { fillColor: '#FF6347', strokeColor: '#DC381F', opacity: 0.8 }, defaultMetadata: {}, isTable: false },
  { type: 'stage', label: 'Stage', icon: '🎭', category: 'restaurant', defaultWidth: 200, defaultHeight: 100, defaultShape: 'rectangle', defaultStyle: { fillColor: '#8B0000', strokeColor: '#5C0000', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'dj_booth', label: 'DJ Booth', icon: '🎵', category: 'restaurant', defaultWidth: 80, defaultHeight: 80, defaultShape: 'rectangle', defaultStyle: { fillColor: '#4B0082', strokeColor: '#2E0057', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'buffet', label: 'Buffet', icon: '🍱', category: 'restaurant', defaultWidth: 180, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#CD853F', strokeColor: '#8B6914', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'wine_shelf', label: 'Wine Shelf', icon: '🍷', category: 'restaurant', defaultWidth: 60, defaultHeight: 120, defaultShape: 'rectangle', defaultStyle: { fillColor: '#4A2C2A', strokeColor: '#2D1B1A', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'coffee_station', label: 'Coffee Station', icon: '☕', category: 'restaurant', defaultWidth: 100, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#6F4E37', strokeColor: '#4A3525', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'waiting_area', label: 'Waiting Area', icon: '🪑', category: 'restaurant', defaultWidth: 100, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#E8DCC8', strokeColor: '#C4B5A0', opacity: 1 }, defaultMetadata: {}, isTable: false },

  // ── Building ──
  { type: 'wall', label: 'Wall', icon: '🧱', category: 'building', defaultWidth: 200, defaultHeight: 20, defaultShape: 'rectangle', defaultStyle: { fillColor: '#333333', strokeColor: '#1a1a1a', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'glass_wall', label: 'Glass Wall', icon: '🪟', category: 'building', defaultWidth: 200, defaultHeight: 10, defaultShape: 'rectangle', defaultStyle: { fillColor: '#87CEEB', strokeColor: '#4682B4', opacity: 0.5 }, defaultMetadata: {}, isTable: false },
  { type: 'door', label: 'Door', icon: '🚪', category: 'building', defaultWidth: 80, defaultHeight: 20, defaultShape: 'rectangle', defaultStyle: { fillColor: '#8B4513', strokeColor: '#5C2E0E', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'double_door', label: 'Double Door', icon: '🚪', category: 'building', defaultWidth: 120, defaultHeight: 20, defaultShape: 'rectangle', defaultStyle: { fillColor: '#8B4513', strokeColor: '#5C2E0E', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'sliding_door', label: 'Sliding Door', icon: '🚪', category: 'building', defaultWidth: 100, defaultHeight: 15, defaultShape: 'rectangle', defaultStyle: { fillColor: '#708090', strokeColor: '#4A5568', opacity: 0.8 }, defaultMetadata: {}, isTable: false },
  { type: 'emergency_exit', label: 'Emergency Exit', icon: '🚨', category: 'building', defaultWidth: 80, defaultHeight: 20, defaultShape: 'rectangle', defaultStyle: { fillColor: '#FF0000', strokeColor: '#CC0000', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'window', label: 'Window', icon: '🪟', category: 'building', defaultWidth: 80, defaultHeight: 15, defaultShape: 'rectangle', defaultStyle: { fillColor: '#87CEEB', strokeColor: '#4682B4', opacity: 0.6 }, defaultMetadata: {}, isTable: false },
  { type: 'stairs', label: 'Stairs', icon: '🪜', category: 'building', defaultWidth: 80, defaultHeight: 120, defaultShape: 'rectangle', defaultStyle: { fillColor: '#808080', strokeColor: '#606060', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'elevator', label: 'Elevator', icon: '🛗', category: 'building', defaultWidth: 60, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#C0C0C0', strokeColor: '#808080', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'toilet_male', label: 'WC Men', icon: '🚹', category: 'building', defaultWidth: 60, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#4169E1', strokeColor: '#2B4FA0', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'toilet_female', label: 'WC Women', icon: '🚺', category: 'building', defaultWidth: 60, defaultHeight: 60, defaultShape: 'rectangle', defaultStyle: { fillColor: '#FF69B4', strokeColor: '#DB3A7A', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'toilet_accessible', label: 'WC Accessible', icon: '♿', category: 'building', defaultWidth: 70, defaultHeight: 70, defaultShape: 'rectangle', defaultStyle: { fillColor: '#4682B4', strokeColor: '#36648B', opacity: 1 }, defaultMetadata: {}, isTable: false },

  // ── Decoration ──
  { type: 'plant', label: 'Plant', icon: '🌿', category: 'decoration', defaultWidth: 40, defaultHeight: 40, defaultShape: 'circle', defaultStyle: { fillColor: '#228B22', strokeColor: '#1A6B1A', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'tree', label: 'Tree', icon: '🌳', category: 'decoration', defaultWidth: 60, defaultHeight: 60, defaultShape: 'circle', defaultStyle: { fillColor: '#2E8B57', strokeColor: '#1B5E3A', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'divider', label: 'Divider', icon: '🔲', category: 'decoration', defaultWidth: 100, defaultHeight: 10, defaultShape: 'rectangle', defaultStyle: { fillColor: '#D2B48C', strokeColor: '#A0845C', opacity: 0.8 }, defaultMetadata: {}, isTable: false },
  { type: 'carpet', label: 'Carpet', icon: '🟫', category: 'decoration', defaultWidth: 120, defaultHeight: 80, defaultShape: 'rectangle', defaultStyle: { fillColor: '#800020', strokeColor: '#5C0015', opacity: 0.6 }, defaultMetadata: {}, isTable: false },
  { type: 'aquarium', label: 'Aquarium', icon: '🐠', category: 'decoration', defaultWidth: 100, defaultHeight: 40, defaultShape: 'rectangle', defaultStyle: { fillColor: '#00CED1', strokeColor: '#008B8B', opacity: 0.7 }, defaultMetadata: {}, isTable: false },
  { type: 'flower', label: 'Flower', icon: '🌺', category: 'decoration', defaultWidth: 30, defaultHeight: 30, defaultShape: 'circle', defaultStyle: { fillColor: '#FF69B4', strokeColor: '#DB3A7A', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'lamp', label: 'Lamp', icon: '💡', category: 'decoration', defaultWidth: 25, defaultHeight: 25, defaultShape: 'circle', defaultStyle: { fillColor: '#FFD700', strokeColor: '#DAA520', opacity: 0.8 }, defaultMetadata: {}, isTable: false },
  { type: 'tv', label: 'TV', icon: '📺', category: 'decoration', defaultWidth: 60, defaultHeight: 40, defaultShape: 'rectangle', defaultStyle: { fillColor: '#1C1C1C', strokeColor: '#000000', opacity: 1 }, defaultMetadata: {}, isTable: false },
  { type: 'speaker', label: 'Speaker', icon: '🔊', category: 'decoration', defaultWidth: 30, defaultHeight: 30, defaultShape: 'circle', defaultStyle: { fillColor: '#2F2F2F', strokeColor: '#1A1A1A', opacity: 1 }, defaultMetadata: {}, isTable: false },

  // ── Text ──
  { type: 'text_label', label: 'Text Label', icon: '🔤', category: 'text', defaultWidth: 120, defaultHeight: 40, defaultShape: 'rectangle', defaultStyle: { fillColor: 'transparent', strokeColor: 'transparent', opacity: 1, fontSize: '14px', textColor: '#333333' }, defaultMetadata: { text: 'Label' }, isTable: false },
  { type: 'image', label: 'Image', icon: '🖼️', category: 'text', defaultWidth: 100, defaultHeight: 100, defaultShape: 'rectangle', defaultStyle: { fillColor: '#E0E0E0', strokeColor: '#BDBDBD', opacity: 1 }, defaultMetadata: { imageUrl: '' }, isTable: false },
];

export function getObjectDefinition(type: string): ObjectDefinition | undefined {
  return OBJECT_REGISTRY.find(o => o.type === type);
}

export function getObjectsByCategory(category: string): ObjectDefinition[] {
  return OBJECT_REGISTRY.filter(o => o.category === category);
}

export function createDefaultObject(type: string, x: number, y: number): Omit<FloorPlanObject, 'id'> {
  const def = getObjectDefinition(type);
  if (!def) throw new Error(`Unknown object type: ${type}`);

  return {
    objectType: type,
    label: def.label,
    x,
    y,
    width: def.defaultWidth,
    height: def.defaultHeight,
    rotation: 0,
    shape: def.defaultShape,
    zIndex: 10,
    styleJson: { ...def.defaultStyle },
    metadataJson: { ...def.defaultMetadata },
  };
}
