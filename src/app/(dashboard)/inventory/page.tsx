'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'stock' | 'recipes' | 'menu' | 'raw-materials' | 'categories' | 'transfer';

const TABS: { key: Tab; label: string }[] = [
  { key: 'stock', label: 'Stock' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'menu', label: 'Menu' },
  { key: 'raw-materials', label: 'Raw Materials' },
  { key: 'categories', label: 'Categories' },
  { key: 'transfer', label: 'Branch Transfer' },
];

interface StockItem {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  branchName: string;
}

interface Recipe {
  id: number;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
}

interface RecipeIngredient {
  id?: number;
  rawMaterialId: number;
  rawMaterialName: string;
  quantity: number;
  unit: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: { id: number; name: string };
  variants: MenuVariant[];
  isActive: boolean;
}

interface MenuVariant {
  id?: number;
  name: string;
  price: number;
}

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  minimumStock: number;
}

interface Category {
  id: number;
  name: string;
}

interface Transfer {
  id: number;
  fromBranch: string;
  toBranch: string;
  status: string;
  createdAt: string;
}

interface Branch {
  branchId: string;
  name: string;
}

// ─── Modal Component ─────────────────────────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-xl">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Reusable Styles ────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b] text-sm';
const btnPrimary = 'px-4 py-2 rounded-lg bg-[#25439b] hover:bg-[#1c3580] text-white text-sm font-medium transition';
const btnDanger = 'px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition';
const btnSecondary = 'px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium transition';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function InventoryPage() {
  const { activeBranchId } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stock');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-[#25439b] text-[#25439b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stock' && <StockTab activeBranchId={activeBranchId} />}
      {activeTab === 'recipes' && <RecipesTab />}
      {activeTab === 'menu' && <MenuTab activeBranchId={activeBranchId} />}
      {activeTab === 'raw-materials' && <RawMaterialsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'transfer' && <TransferTab activeBranchId={activeBranchId} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK TAB
// ═══════════════════════════════════════════════════════════════════════════════
function StockTab({ activeBranchId }: { activeBranchId: string | null }) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeBranchId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.get<StockItem[]>('/api/inventory/stock');
      setItems(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-slate-500 py-8 text-center flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" /> Loading stock...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Unit</th>
            <th className="py-3 px-4">Current Stock</th>
            <th className="py-3 px-4">Minimum Stock</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4 text-slate-800">{item.name}</td>
              <td className="py-3 px-4 text-slate-600">{item.unit}</td>
              <td className="py-3 px-4 text-slate-600">{item.currentStock}</td>
              <td className="py-3 px-4 text-slate-600">{item.minimumStock}</td>
              <td className="py-3 px-4">
                {item.currentStock <= 0 ? (
                  <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">Hết hàng</span>
                ) : item.currentStock <= item.minimumStock ? (
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">Cần nhập thêm</span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">Đủ</span>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} className="py-8 text-center text-slate-400">No stock items found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECIPES TAB
// ═══════════════════════════════════════════════════════════════════════════════
function RecipesTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [ingredients, setIngredients] = useState<{ rawMaterialId: number; quantity: number; unit: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
 
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [r, rm] = await Promise.all([
        api.get<Recipe[]>('/api/inventory/recipes'),
        api.get<RawMaterial[]>('/api/inventory/items'),
      ]);
      setRecipes(r);
      setRawMaterials(rm);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { load(); }, [load]);
 
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(recipes.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected recipe(s)?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/api/inventory/recipes/${id}`)));
      toast.success('Successfully deleted selected recipes');
      setSelectedIds([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete selected recipes');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { rawMaterialId: 0, quantity: 0, unit: '' }]);
  };
 
  const updateIngredient = (idx: number, field: string, value: string | number) => {
    const updated = [...ingredients];
    (updated[idx] as any)[field] = value;
    if (field === 'rawMaterialId') {
      const rm = rawMaterials.find(r => r.id === Number(value));
      if (rm) updated[idx].unit = rm.unit;
    }
    setIngredients(updated);
  };
 
  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };
 
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Recipe name is required'); return; }
    if (ingredients.length === 0) { toast.error('Add at least one ingredient'); return; }
    try {
      setSubmitting(true);
      await api.post('/api/inventory/recipes', {
        name: form.name,
        description: form.description,
        ingredients: ingredients.map(i => ({
          rawMaterialId: i.rawMaterialId,
          quantity: i.quantity,
          unit: i.unit,
        })),
      });
      toast.success('Recipe created');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      setIngredients([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create recipe');
    } finally {
      setSubmitting(false);
    }
  };
 
  if (loading) return <div className="text-slate-500 py-8 text-center flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" /> Loading recipes...</div>;
 
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">
                Đã chọn <strong className="text-[#25439b]">{selectedIds.length}</strong> công thức
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
              >
                Xóa đã chọn
              </button>
            </div>
          )}
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Recipe</button>
      </div>
 
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-3 px-4 w-12">
                <input
                  type="checkbox"
                  checked={recipes.length > 0 && selectedIds.length === recipes.length}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                />
              </th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Ingredients</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={e => handleSelectOne(r.id, e.target.checked)}
                    className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                  />
                </td>
                <td className="py-3 px-4 text-slate-800">{r.name}</td>
                <td className="py-3 px-4 text-slate-600">{r.description}</td>
                <td className="py-3 px-4 text-slate-600">
                  {r.ingredients?.length ?? 0} items
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">No recipes found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Recipe Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Recipe">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Description</label>
            <input className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600 font-medium">Ingredients</label>
              <button type="button" onClick={addIngredient} className="text-sm text-[#25439b] hover:text-[#1c3580]">+ Add</button>
            </div>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  {idx === 0 && <label className="block text-xs text-slate-400 mb-1">Material</label>}
                  <select
                    className={inputCls}
                    value={ing.rawMaterialId}
                    onChange={e => updateIngredient(idx, 'rawMaterialId', e.target.value)}
                  >
                    <option value={0}>Select...</option>
                    {rawMaterials.map(rm => (
                      <option key={rm.id} value={rm.id}>{rm.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  {idx === 0 && <label className="block text-xs text-slate-400 mb-1">Qty</label>}
                  <input
                    type="number"
                    className={inputCls}
                    value={ing.quantity || ''}
                    onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="w-20">
                  {idx === 0 && <label className="block text-xs text-slate-400 mb-1">Unit</label>}
                  <input className={inputCls} value={ing.unit} readOnly />
                </div>
                <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 hover:text-red-600 pb-2 text-lg">✕</button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENU TAB
// ═══════════════════════════════════════════════════════════════════════════════
function MenuTab({ activeBranchId }: { activeBranchId: string | null }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', price: '', isActive: true });
  const [variants, setVariants] = useState<{ id?: number; name: string; price: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
 
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [m, c] = await Promise.all([
        api.get<MenuItem[]>('/api/inventory/menu'),
        api.get<Category[]>('/api/inventory/categories'),
      ]);
      setItems(m);
      setCategories(c);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);
 
  useEffect(() => { load(); }, [load]);
 
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected menu item(s)?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/api/inventory/menu/${id}`)));
      toast.success('Successfully deleted selected menu items');
      setSelectedIds([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete selected items');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ name: '', description: '', categoryId: '', price: '', isActive: true });
    setVariants([]);
    setShowCreate(true);
  };
 
  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      categoryId: String(item.category?.id ?? ''),
      price: String(item.price),
      isActive: item.isActive,
    });
    setVariants(item.variants?.map(v => ({ id: v.id, name: v.name, price: String(v.price) })) ?? []);
    setShowCreate(true);
  };
 
  const addVariant = () => setVariants([...variants, { name: '', price: '' }]);
  const updateVariant = (idx: number, field: string, value: string) => {
    const u = [...variants];
    (u[idx] as any)[field] = value;
    setVariants(u);
  };
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    try {
      setSubmitting(true);
      const body = {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        variants: variants.map(v => ({ id: v.id, name: v.name, price: parseFloat(v.price) || 0 })),
        isActive: form.isActive,
      };
      if (editingItem) {
        await api.put(`/api/inventory/menu/${editingItem.id}`, body);
        toast.success('Menu item updated');
      } else {
        await api.post('/api/inventory/menu', body);
        toast.success('Menu item created');
      }
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save menu item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500 py-8 text-center flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" /> Loading menu...</div>;
 
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">
                Đã chọn <strong className="text-[#25439b]">{selectedIds.length}</strong> món ăn
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
              >
                Xóa đã chọn
              </button>
            </div>
          )}
        </div>
        <button onClick={openCreate} className={btnPrimary}>+ New Menu Item</button>
      </div>
 
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-3 px-4 w-12">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                />
              </th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Variants</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={e => handleSelectOne(item.id, e.target.checked)}
                    className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                  />
                </td>
                <td className="py-3 px-4 text-slate-800">{item.name}</td>
                <td className="py-3 px-4 text-slate-600">{item.category?.name ?? '—'}</td>
                <td className="py-3 px-4 text-slate-600">${item.price?.toFixed(2)}</td>
                <td className="py-3 px-4 text-slate-600">{item.variants?.length ?? 0}</td>
                <td className="py-3 px-4">
                  {item.isActive ? (
                    <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs">Active</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs">Inactive</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#25439b] bg-[#25439b]/5 hover:bg-[#25439b]/10 transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                    <span>Sửa</span>
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">No menu items found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editingItem ? 'Edit Menu Item' : 'New Menu Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Description</label>
            <input className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Category</label>
              <select className={inputCls} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Base Price</label>
              <input type="number" step="0.01" className={inputCls} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
            />
            <label htmlFor="isActive" className="text-sm text-slate-600 font-medium cursor-pointer select-none">
              Trạng thái kinh doanh (Active)
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600 font-medium">Variants</label>
              <button type="button" onClick={addVariant} className="text-sm text-[#25439b] hover:text-[#1c3580]">+ Add</button>
            </div>
            {variants.map((v, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <input className={inputCls} placeholder="Variant name" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} />
                </div>
                <div className="w-32">
                  <input type="number" step="0.01" className={inputCls} placeholder="Price" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} />
                </div>
                <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:text-red-600 pb-2 text-lg">✕</button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAW MATERIALS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function RawMaterialsTab() {
  const [items, setItems] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMaterial | null>(null);
  const [form, setForm] = useState({ name: '', unit: '', minimumStock: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
 
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<RawMaterial[]>('/api/inventory/items');
      setItems(data);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { load(); }, [load]);
 
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected raw material(s)?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/api/inventory/items/${id}`)));
      toast.success('Successfully deleted selected raw materials');
      setSelectedIds([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete selected items');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ name: '', unit: '', minimumStock: '' });
    setShowCreate(true);
  };
 
  const openEdit = (item: RawMaterial) => {
    setEditingItem(item);
    setForm({ name: item.name, unit: item.unit, minimumStock: String(item.minimumStock) });
    setShowCreate(true);
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.unit.trim()) { toast.error('Unit is required'); return; }
    try {
      setSubmitting(true);
      const body = { name: form.name, unit: form.unit, minimumStock: parseFloat(form.minimumStock) || 0 };
      if (editingItem) {
        await api.put(`/api/inventory/items/${editingItem.id}`, body);
        toast.success('Raw material updated');
      } else {
        await api.post('/api/inventory/items', body);
        toast.success('Raw material created');
      }
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500 py-8 text-center flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" /> Loading raw materials...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">
                Đã chọn <strong className="text-[#25439b]">{selectedIds.length}</strong> nguyên liệu
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
              >
                Xóa đã chọn
              </button>
            </div>
          )}
        </div>
        <button onClick={openCreate} className={btnPrimary}>+ New Raw Material</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-3 px-4 w-12">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                />
              </th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4">Minimum Stock</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={e => handleSelectOne(item.id, e.target.checked)}
                    className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                  />
                </td>
                <td className="py-3 px-4 text-slate-800">{item.name}</td>
                <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                <td className="py-3 px-4 text-slate-600">{item.minimumStock}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#25439b] bg-[#25439b]/5 hover:bg-[#25439b]/10 transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                    <span>Sửa</span>
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">No raw materials found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editingItem ? 'Edit Raw Material' : 'New Raw Material'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Unit</label>
            <input className={inputCls} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. kg, liter, pcs" required />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Minimum Stock</label>
            <input type="number" step="0.01" className={inputCls} value={form.minimumStock} onChange={e => setForm({ ...form, minimumStock: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES TAB
// ═══════════════════════════════════════════════════════════════════════════════
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
 
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Category[]>('/api/inventory/categories');
      setCategories(data);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { load(); }, [load]);
 
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(categories.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected category/categories?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/api/inventory/categories/${id}`)));
      toast.success('Successfully deleted selected categories');
      setSelectedIds([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete selected categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    try {
      setSubmitting(true);
      await api.post('/api/inventory/categories', { name });
      toast.success('Category created');
      setShowCreate(false);
      setName('');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/api/inventory/categories/${id}`);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) return <div className="text-slate-500 py-8 text-center flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" /> Loading categories...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">
                Đã chọn <strong className="text-[#25439b]">{selectedIds.length}</strong> danh mục
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
              >
                Xóa đã chọn
              </button>
            </div>
          )}
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Category</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-3 px-4 w-12">
                <input
                  type="checkbox"
                  checked={categories.length > 0 && selectedIds.length === categories.length}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                />
              </th>
              <th className="py-3 px-4">Name</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cat.id)}
                    onChange={e => handleSelectOne(cat.id, e.target.checked)}
                    className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                  />
                </td>
                <td className="py-3 px-4 text-slate-800">{cat.name}</td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={2} className="py-8 text-center text-slate-400">No categories found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Category">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Category Name</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRANCH TRANSFER TAB
// ═══════════════════════════════════════════════════════════════════════════════
function TransferTab({ activeBranchId }: { activeBranchId: string | null }) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [form, setForm] = useState({ toBranchId: '', rawMaterialId: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!activeBranchId) {
      setTransfers([]);
      setBranches([]);
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [t, b, i] = await Promise.all([
        api.get<Transfer[]>('/api/inventory/transfer'),
        api.get<Branch[]>('/api/branches/my-branches'),
        api.get<StockItem[]>('/api/inventory/stock'),
      ]);
      setTransfers(t);
      setBranches(b);
      setItems(i);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.toBranchId) { toast.error('Select destination branch'); return; }
    if (!form.rawMaterialId) { toast.error('Select an item'); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) { toast.error('Enter a valid quantity'); return; }
    try {
      setSubmitting(true);
      await api.post('/api/inventory/transfer/create', {
        toBranchId: form.toBranchId,
        rawMaterialId: Number(form.rawMaterialId),
        quantity: parseFloat(form.quantity),
      });
      toast.success('Transfer created');
      setShowCreate(false);
      setForm({ toBranchId: '', rawMaterialId: '', quantity: '' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this transfer?')) return;
    try {
      await api.post(`/api/inventory/transfer/approve/${id}`);
      toast.success('Transfer approved');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleViewDetails = async (transfer: Transfer) => {
    try {
      const details = await api.get<any>(`/api/inventory/transfer/details/${transfer.id}`);
      setSelectedTransfer({ ...transfer, ...details });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load details');
    }
  };

  if (loading) return <div className="text-slate-500 py-8 text-center flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" /> Loading transfers...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Transfer</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">From</th>
              <th className="py-3 px-4">To</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-600">#{t.id}</td>
                <td className="py-3 px-4 text-slate-800">{t.fromBranch}</td>
                <td className="py-3 px-4 text-slate-800">{t.toBranch}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    t.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                    t.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>{t.status}</span>
                </td>
                <td className="py-3 px-4 text-slate-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={() => handleViewDetails(t)} className="text-[#25439b] hover:text-[#1c3580] text-sm">Details</button>
                  {t.status === 'PENDING' && (
                    <button onClick={() => handleApprove(t.id)} className="text-emerald-600 hover:text-emerald-700 text-sm">Approve</button>
                  )}
                </td>
              </tr>
            ))}
            {transfers.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No transfers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Transfer Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Branch Transfer">
        <form onSubmit={handleCreate} className="space-y-4">
          {activeBranchId && (
            <div>
              <label className="block text-sm text-slate-600 mb-1">From Branch (Current)</label>
              <input className={inputCls} value={branches.find(b => b.branchId === activeBranchId)?.name || activeBranchId} readOnly />
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-600 mb-1">To Branch</label>
            <select className={inputCls} value={form.toBranchId} onChange={e => setForm({ ...form, toBranchId: e.target.value })} required>
              <option value="">Select branch...</option>
              {branches.filter(b => b.branchId !== activeBranchId).map(b => (
                <option key={b.branchId} value={b.branchId}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Item</label>
            <select className={inputCls} value={form.rawMaterialId} onChange={e => setForm({ ...form, rawMaterialId: e.target.value })} required>
              <option value="">Select item...</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.currentStock} {i.unit} available)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Quantity</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Creating...' : 'Create Transfer'}</button>
          </div>
        </form>
      </Modal>

      {/* Transfer Details Modal */}
      <Modal open={!!selectedTransfer} onClose={() => setSelectedTransfer(null)} title={`Transfer #${selectedTransfer?.id}`}>
        {selectedTransfer && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-500">From:</span> <span className="text-slate-800 ml-2">{selectedTransfer.fromBranch}</span></div>
              <div><span className="text-slate-500">To:</span> <span className="text-slate-800 ml-2">{selectedTransfer.toBranch}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className="text-slate-800 ml-2">{selectedTransfer.status}</span></div>
              <div><span className="text-slate-500">Date:</span> <span className="text-slate-800 ml-2">{new Date(selectedTransfer.createdAt).toLocaleString()}</span></div>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <button onClick={() => setSelectedTransfer(null)} className={btnSecondary}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
