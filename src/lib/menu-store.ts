// ─── Menu API Service ───────────────────────────────────────────────────────
// Single source of truth for restaurant menu items (dishes/drinks for POS).
// This module is SEPARATE from Inventory (ingredients/stock/procurement).
// All calls go to the backend at /api/menu/*.

import { api } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  priceVnd: number;
  imageUrl: string | null;
  category: { id: number; name: string } | null;
  variants: MenuVariant[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MenuVariant {
  id: number;
  name: string;
  priceVnd: number;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  displayOrder?: number;
  active?: boolean;
}

// ─── Menu Items ─────────────────────────────────────────────────────────────
export async function getMenuItems(): Promise<MenuItem[]> {
  return api.get<MenuItem[]>('/api/menu');
}

export async function getActiveMenuItems(): Promise<MenuItem[]> {
  return api.get<MenuItem[]>('/api/menu/active');
}

export async function getMenuItem(id: number): Promise<MenuItem> {
  return api.get<MenuItem>(`/api/menu/${id}`);
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  return api.post<MenuItem>('/api/menu', item);
}

export async function updateMenuItem(id: number, item: Partial<MenuItem>): Promise<MenuItem> {
  return api.put<MenuItem>(`/api/menu/${id}`, item);
}

export async function patchMenuItemStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<MenuItem> {
  return api.patch<MenuItem>(`/api/menu/${id}/status`, { status });
}

export async function deleteMenuItem(id: number): Promise<void> {
  return api.delete(`/api/menu/${id}`);
}

export async function deleteMenuItemsBulk(ids: number[]): Promise<void> {
  return api.delete('/api/menu/bulk', { body: ids });
}

// ─── Menu Categories ────────────────────────────────────────────────────────
export async function getMenuCategories(): Promise<MenuCategory[]> {
  return api.get<MenuCategory[]>('/api/menu/categories');
}

export async function createMenuCategory(category: Omit<MenuCategory, 'id'>): Promise<MenuCategory> {
  return api.post<MenuCategory>('/api/menu/categories', category);
}

export async function updateMenuCategory(id: number, category: Partial<MenuCategory>): Promise<MenuCategory> {
  return api.put<MenuCategory>(`/api/menu/categories/${id}`, category);
}

export async function deleteMenuCategory(id: number): Promise<void> {
  return api.delete(`/api/menu/categories/${id}`);
}
