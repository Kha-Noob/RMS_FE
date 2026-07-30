'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { Package, BookOpen, Utensils, Wheat, Tags, ArrowRightLeft, Plus, Trash2, Edit, Loader2, X, Info, CheckCircle2 } from 'lucide-react';

type Tab = 'stock' | 'recipes' | 'menu' | 'raw-materials' | 'categories' | 'transfer';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'stock', label: 'Stock', icon: Package },
  { key: 'recipes', label: 'Recipes', icon: BookOpen },
  { key: 'menu', label: 'Menu', icon: Utensils },
  { key: 'raw-materials', label: 'Raw Materials', icon: Wheat },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'transfer', label: 'Branch Transfer', icon: ArrowRightLeft },
];

const stringToColorClass = (str: string) => {
  const colors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    'bg-teal-100 text-teal-700 border-teal-200',
  ];
  let hash = 0;
  if (!str) return colors[0];
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getCategoryColorClass = (categoryName: string | undefined, itemName: string) => {
  if (!categoryName) return stringToColorClass(itemName);
  const lower = categoryName.toLowerCase();
  
  if (lower.includes('nướng') || lower.includes('bbq') || lower.includes('chiên') || lower.includes('quay') || lower.includes('rán')) {
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }
  if (lower.includes('nước') || lower.includes('lẩu') || lower.includes('canh') || lower.includes('trà') || lower.includes('uống') || lower.includes('drink') || lower.includes('giải khát')) {
    return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  }
  if (lower.includes('rau') || lower.includes('salad') || lower.includes('chay') || lower.includes('xanh') || lower.includes('gỏi')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  if (lower.includes('cơm') || lower.includes('bún') || lower.includes('phở') || lower.includes('mì') || lower.includes('cháo')) {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }
  if (lower.includes('ngọt') || lower.includes('bánh') || lower.includes('tráng miệng') || lower.includes('dessert') || lower.includes('kem')) {
    return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
  }
  
  return stringToColorClass(categoryName);
};

const getInitials = (name: string) => {
  if (!name) return 'NA';
  return name.substring(0, 2).toUpperCase();
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/60 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl shadow-slate-200/50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Reusable Styles ────────────────────────────────────────────────────────
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#25439b]/10 focus:border-[#25439b] transition-all text-sm';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25439b] hover:bg-[#1c3580] text-white text-sm font-semibold transition-all shadow-md shadow-[#25439b]/20 hover:shadow-lg hover:shadow-[#25439b]/30 active:scale-[0.98]';
const btnDanger = 'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all shadow-sm active:scale-[0.98]';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all border border-slate-200 shadow-sm active:scale-[0.98]';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function InventoryPage() {
  const { activeBranchId } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stock');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your stock, recipes, and branch transfers efficiently.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm inline-flex overflow-x-auto max-w-full hide-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-[#25439b]/10 text-[#25439b] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#25439b]' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <Loader2 className="w-8 h-8 text-[#25439b] animate-spin mb-3" />
      <p className="text-slate-500 font-medium">Loading stock...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-4 px-5">Name</th>
              <th className="py-4 px-5">Unit</th>
              <th className="py-4 px-5">Current Stock</th>
              <th className="py-4 px-5">Minimum Stock</th>
              <th className="py-4 px-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100/50 hover:bg-slate-50/80 transition-colors">
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm ${stringToColorClass(item.name)}`}>
                      {getInitials(item.name)}
                    </div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                  </div>
                </td>
                <td className="py-4 px-5"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{item.unit}</span></td>
                <td className="py-4 px-5 text-slate-800 font-semibold">{item.currentStock}</td>
                <td className="py-4 px-5 text-slate-500">{item.minimumStock}</td>
                <td className="py-4 px-5">
                  {item.currentStock <= 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200/60"><Info size={14} /> Hết hàng</span>
                  ) : item.currentStock <= item.minimumStock ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-200/60"><Info size={14} /> Cần nhập thêm</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200/60"><CheckCircle2 size={14} /> Đủ</span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Package className="text-slate-400 w-8 h-8" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">No stock items found</h3>
                    <p className="text-sm text-slate-500 mt-1">Stock is currently empty.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
 
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <Loader2 className="w-8 h-8 text-[#25439b] animate-spin mb-3" />
      <p className="text-slate-500 font-medium">Loading recipes...</p>
    </div>
  );
 
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                Đã chọn <strong className="text-[#25439b]">{selectedIds.length}</strong> công thức
              </span>
              <button
                onClick={handleBulkDelete}
                className={btnDanger}
              >
                <Trash2 size={16} />
                Xóa đã chọn
              </button>
            </div>
          ) : (
             <div className="text-sm font-medium text-slate-500">Quản lý công thức chế biến</div>
          )}
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          <Plus size={18} />
          New Recipe
        </button>
      </div>
 
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                <th className="py-4 px-5 w-12">
                  <input
                    type="checkbox"
                    checked={recipes.length > 0 && selectedIds.length === recipes.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                  />
                </th>
                <th className="py-4 px-5">Name</th>
                <th className="py-4 px-5">Description</th>
                <th className="py-4 px-5">Ingredients</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className="border-b border-slate-100/50 hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={e => handleSelectOne(r.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                    />
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm ${stringToColorClass(r.name)}`}>
                        {getInitials(r.name)}
                      </div>
                      <span className="font-semibold text-slate-800">{r.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-600">{r.description}</td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-[#25439b] font-medium text-xs border border-blue-100">
                      {r.ingredients?.length ?? 0} items
                    </span>
                  </td>
                </tr>
              ))}
              {recipes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="text-slate-400 w-8 h-8" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800">No recipes found</h3>
                      <p className="text-sm text-slate-500 mt-1">Start by creating a new recipe.</p>
                      <button onClick={() => setShowCreate(true)} className="mt-4 text-[#25439b] font-medium hover:underline flex items-center gap-1"><Plus size={16}/> Create Recipe</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <Loader2 className="w-8 h-8 text-[#25439b] animate-spin mb-3" />
      <p className="text-slate-500 font-medium">Loading menu...</p>
    </div>
  );
 
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                Đã chọn <strong className="text-[#25439b]">{selectedIds.length}</strong> món ăn
              </span>
              <button
                onClick={handleBulkDelete}
                className={btnDanger}
              >
                <Trash2 size={16} />
                Xóa đã chọn
              </button>
            </div>
          ) : (
             <div className="text-sm font-medium text-slate-500">Quản lý thực đơn</div>
          )}
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={18} />
          New Menu Item
        </button>
      </div>
 
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                <th className="py-4 px-5 w-12">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                  />
                </th>
                <th className="py-4 px-5">Name</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">Price</th>
                <th className="py-4 px-5">Variants</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100/50 hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={e => handleSelectOne(item.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                    />
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm ${getCategoryColorClass(item.category?.name, item.name)}`}>
                        {getInitials(item.name)}
                      </div>
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{item.category?.name ?? '—'}</span>
                  </td>
                  <td className="py-4 px-5 text-slate-800 font-semibold">${item.price?.toFixed(2)}</td>
                  <td className="py-4 px-5 text-slate-600">{item.variants?.length ?? 0}</td>
                  <td className="py-4 px-5">
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200/60"><CheckCircle2 size={12} /> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200/60">Inactive</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#25439b] bg-[#25439b]/5 hover:bg-[#25439b]/10 transition-colors active:scale-95"
                      title="Edit"
                    >
                      <Edit size={14} />
                      <span>Sửa</span>
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Utensils className="text-slate-400 w-8 h-8" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800">No menu items found</h3>
                      <p className="text-sm text-slate-500 mt-1">Start by adding items to your menu.</p>
                      <button onClick={openCreate} className="mt-4 text-[#25439b] font-medium hover:underline flex items-center gap-1"><Plus size={16}/> Create Menu Item</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <Loader2 className="w-8 h-8 text-[#25439b] animate-spin mb-3" />
      <p className="text-slate-500 font-medium">Loading raw materials...</p>
    </div>
  );
 
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                Đã chọn <strong className="text-[#25439b]">{selectedIds.length}</strong> nguyên liệu
              </span>
              <button
                onClick={handleBulkDelete}
                className={btnDanger}
              >
                <Trash2 size={16} />
                Xóa đã chọn
              </button>
            </div>
          ) : (
             <div className="text-sm font-medium text-slate-500">Quản lý nguyên vật liệu</div>
          )}
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={18} />
          New Raw Material
        </button>
      </div>
 
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                <th className="py-4 px-5 w-12">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                  />
                </th>
                <th className="py-4 px-5">Name</th>
                <th className="py-4 px-5">Unit</th>
                <th className="py-4 px-5">Minimum Stock</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100/50 hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={e => handleSelectOne(item.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                    />
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm ${stringToColorClass(item.name)}`}>
                        {getInitials(item.name)}
                      </div>
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{item.unit}</span>
                  </td>
                  <td className="py-4 px-5 text-slate-600">{item.minimumStock}</td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#25439b] bg-[#25439b]/5 hover:bg-[#25439b]/10 transition-colors active:scale-95"
                      title="Edit"
                    >
                      <Edit size={14} />
                      <span>Sửa</span>
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Wheat className="text-slate-400 w-8 h-8" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800">No raw materials found</h3>
                      <p className="text-sm text-slate-500 mt-1">Start by adding your first raw material.</p>
                      <button onClick={openCreate} className="mt-4 text-[#25439b] font-medium hover:underline flex items-center gap-1"><Plus size={16}/> Create Raw Material</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <Loader2 className="w-8 h-8 text-[#25439b] animate-spin mb-3" />
      <p className="text-slate-500 font-medium">Loading categories...</p>
    </div>
  );
 
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                Đã chọn <strong className="text-[#25439b]">{selectedIds.length}</strong> danh mục
              </span>
              <button
                onClick={handleBulkDelete}
                className={btnDanger}
              >
                <Trash2 size={16} />
                Xóa đã chọn
              </button>
            </div>
          ) : (
             <div className="text-sm font-medium text-slate-500">Quản lý danh mục</div>
          )}
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          <Plus size={18} />
          New Category
        </button>
      </div>
 
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                <th className="py-4 px-5 w-12">
                  <input
                    type="checkbox"
                    checked={categories.length > 0 && selectedIds.length === categories.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                  />
                </th>
                <th className="py-4 px-5">Name</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-slate-100/50 hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(cat.id)}
                      onChange={e => handleSelectOne(cat.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                    />
                  </td>
                  <td className="py-4 px-5 font-medium text-slate-800">{cat.name}</td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Tags className="text-slate-400 w-8 h-8" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800">No categories found</h3>
                      <p className="text-sm text-slate-500 mt-1">Start by adding your first category.</p>
                      <button onClick={() => setShowCreate(true)} className="mt-4 text-[#25439b] font-medium hover:underline flex items-center gap-1"><Plus size={16}/> Create Category</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <Loader2 className="w-8 h-8 text-[#25439b] animate-spin mb-3" />
      <p className="text-slate-500 font-medium">Loading transfers...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-sm font-medium text-slate-500">Quản lý điều chuyển chi nhánh</div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          <Plus size={18} />
          New Transfer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                <th className="py-4 px-5">ID</th>
                <th className="py-4 px-5">From</th>
                <th className="py-4 px-5">To</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id} className="border-b border-slate-100/50 hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-semibold text-slate-600">#{t.id}</td>
                  <td className="py-4 px-5 font-medium text-slate-800">{t.fromBranch}</td>
                  <td className="py-4 px-5 font-medium text-slate-800">{t.toBranch}</td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      t.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' :
                      t.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200/60' :
                      'bg-slate-50 text-slate-500 border-slate-200/60'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-5 text-right space-x-2">
                    <button 
                      onClick={() => handleViewDetails(t)} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#25439b] bg-[#25439b]/5 hover:bg-[#25439b]/10 transition-colors active:scale-95"
                    >
                      <Info size={14} />
                      <span>Details</span>
                    </button>
                    {t.status === 'PENDING' && (
                      <button 
                        onClick={() => handleApprove(t.id)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors active:scale-95"
                      >
                        <CheckCircle2 size={14} />
                        <span>Approve</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <ArrowRightLeft className="text-slate-400 w-8 h-8" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800">No transfers found</h3>
                      <p className="text-sm text-slate-500 mt-1">Create a transfer to move inventory between branches.</p>
                      <button onClick={() => setShowCreate(true)} className="mt-4 text-[#25439b] font-medium hover:underline flex items-center gap-1"><Plus size={16}/> Create Transfer</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Creating...' : 'Create Transfer'}</button>
          </div>
        </form>
      </Modal>

      {/* Transfer Details Modal */}
      <Modal open={!!selectedTransfer} onClose={() => setSelectedTransfer(null)} title={`Transfer #${selectedTransfer?.id}`}>
        {selectedTransfer && (
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">From</span>
                  <span className="text-slate-800 font-medium">{selectedTransfer.fromBranch}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">To</span>
                  <span className="text-slate-800 font-medium">{selectedTransfer.toBranch}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    selectedTransfer.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    selectedTransfer.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>{selectedTransfer.status}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Date</span>
                  <span className="text-slate-800">{new Date(selectedTransfer.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedTransfer(null)} className={btnSecondary}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
