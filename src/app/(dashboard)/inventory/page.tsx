'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'stock' | 'recipes' | 'menu' | 'raw-materials' | 'categories' | 'transfer';

const TABS: { key: Tab; label: string }[] = [
  { key: 'stock', label: 'Tồn Kho' },
  { key: 'recipes', label: 'Công thức' },
  { key: 'menu', label: 'Thực đơn' },
  { key: 'raw-materials', label: 'Nguyên liệu' },
  { key: 'categories', label: 'Danh mục' },
  { key: 'transfer', label: 'Điều chuyển' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Reusable Styles ────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm';
const btnPrimary = 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-950/10 active:scale-95 transition-all flex items-center gap-1.5';
const btnDanger = 'px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-bold active:scale-95 transition-all';
const btnSecondary = 'px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all';
const tableCardCls = 'bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function InventoryPage() {
  const { activeBranchId } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stock');

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Quản lý kho hàng</h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý định lượng, nguyên liệu và điều chuyển kho giữa các chi nhánh</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/40 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
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
      toast.error(err instanceof Error ? err.message : 'Không thể tải kho hàng');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="text-slate-500 py-16 text-center flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải tồn kho...</span>
      </div>
    );
  }

  return (
    <div className={tableCardCls}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 font-bold bg-slate-50/70 border-b border-slate-100">
              <th className="py-4 px-6">Tên nguyên liệu</th>
              <th className="py-4 px-6">Đơn vị</th>
              <th className="py-4 px-6">Tồn hiện tại</th>
              <th className="py-4 px-6">Tồn tối thiểu</th>
              <th className="py-4 px-6">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">{item.name}</td>
                <td className="py-4 px-6 text-slate-500">{item.unit}</td>
                <td className="py-4 px-6 text-slate-700 font-medium">{item.currentStock}</td>
                <td className="py-4 px-6 text-slate-400">{item.minimumStock}</td>
                <td className="py-4 px-6">
                  {item.currentStock <= 0 ? (
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 text-xs font-semibold">Hết hàng</span>
                  ) : item.currentStock <= item.minimumStock ? (
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-xs font-semibold">Cần nhập kho</span>
                  ) : (
                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-semibold">Đủ hàng</span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-400 font-medium">
                  Không tìm thấy nguyên liệu nào trong kho chi nhánh
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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [r, rm] = await Promise.all([
        api.get<Recipe[]>('/api/inventory/recipes'),
        api.get<RawMaterial[]>('/api/inventory/items'),
      ]);
      setRecipes(r);
      setRawMaterials(rm);
    } catch {
      toast.error('Không thể tải dữ liệu công thức');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (!form.name.trim()) { toast.error('Yêu cầu nhập tên công thức'); return; }
    if (ingredients.length === 0) { toast.error('Yêu cầu thêm ít nhất một nguyên liệu'); return; }
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
      toast.success('Đã lưu công thức mới');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      setIngredients([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa công thức định lượng món ăn này?')) return;
    try {
      await api.delete(`/api/inventory/recipes/${id}`);
      toast.success('Đã xóa công thức');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  if (loading) {
    return (
      <div className="text-slate-500 py-16 text-center flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải định lượng món ăn...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Thêm công thức
        </button>
      </div>

      <div className={tableCardCls}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 font-bold bg-slate-50/70 border-b border-slate-100">
                <th className="py-4 px-6">Món ăn</th>
                <th className="py-4 px-6">Mô tả</th>
                <th className="py-4 px-6">Số lượng nguyên liệu</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">{r.name}</td>
                  <td className="py-4 px-6 text-slate-500">{r.description || '—'}</td>
                  <td className="py-4 px-6 text-slate-600">
                    <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs font-semibold">
                      {r.ingredients?.length ?? 0} nguyên liệu
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => handleDelete(r.id)} className={btnDanger}>Xóa</button>
                  </td>
                </tr>
              ))}
              {recipes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 font-medium">
                    Chưa thiết lập định lượng món ăn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Thêm công thức định lượng món ăn">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tên món ăn</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Phở Bò Chín" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả công thức</label>
            <input className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ví dụ: Công thức định lượng chuẩn" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nguyên liệu thành phần</label>
              <button type="button" onClick={addIngredient} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Thêm dòng</button>
            </div>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {idx === 0 && <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nguyên liệu</label>}
                    <select
                      className={inputCls}
                      value={ing.rawMaterialId}
                      onChange={e => updateIngredient(idx, 'rawMaterialId', e.target.value)}
                    >
                      <option value={0}>Chọn...</option>
                      {rawMaterials.map(rm => (
                        <option key={rm.id} value={rm.id}>{rm.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    {idx === 0 && <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Đ.Lượng</label>}
                    <input
                      type="number"
                      className={inputCls}
                      value={ing.quantity || ''}
                      onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="w-20">
                    {idx === 0 && <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Đơn vị</label>}
                    <input className={inputCls} value={ing.unit} readOnly placeholder="kg" />
                  </div>
                  <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 hover:text-red-600 pb-2.5 text-lg">✕</button>
                </div>
              ))}
              {ingredients.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Bấm "+ Thêm dòng" để bắt đầu thiết lập</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Hủy</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? 'Đang tạo...' : 'Lưu công thức'}
            </button>
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
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', price: '' });
  const [variants, setVariants] = useState<{ name: string; price: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [m, c] = await Promise.all([
        api.get<MenuItem[]>('/api/inventory/menu'),
        api.get<Category[]>('/api/inventory/categories'),
      ]);
      setItems(m);
      setCategories(c);
    } catch {
      toast.error('Không tải được thực đơn');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ name: '', description: '', categoryId: '', price: '' });
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
    });
    setVariants(item.variants?.map(v => ({ name: v.name, price: String(v.price) })) ?? []);
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
    if (!form.name.trim()) { toast.error('Tên là bắt buộc'); return; }
    try {
      setSubmitting(true);
      const body = {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        variants: variants.map(v => ({ name: v.name, price: parseFloat(v.price) || 0 })),
      };
      if (editingItem) {
        await api.put(`/api/inventory/menu/${editingItem.id}`, body);
        toast.success('Đã cập nhật món ăn');
      } else {
        await api.post('/api/inventory/menu', body);
        toast.success('Đã thêm món ăn');
      }
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa món ăn này khỏi thực đơn?')) return;
    try {
      await api.delete(`/api/inventory/menu/${id}`);
      toast.success('Đã xóa món ăn');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  if (loading) {
    return (
      <div className="text-slate-500 py-16 text-center flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải thực đơn...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Món ăn mới
        </button>
      </div>

      <div className={tableCardCls}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 font-bold bg-slate-50/70 border-b border-slate-100">
                <th className="py-4 px-6">Tên món ăn</th>
                <th className="py-4 px-6">Danh mục</th>
                <th className="py-4 px-6">Giá cơ bản</th>
                <th className="py-4 px-6">Số biến thể (size, vị)</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">{item.name}</td>
                  <td className="py-4 px-6 text-slate-500">{item.category?.name ?? '—'}</td>
                  <td className="py-4 px-6 text-slate-700 font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-semibold">
                      {item.variants?.length ?? 0} tùy chọn
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {item.isActive ? (
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-semibold">Bán hàng</span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 text-xs font-semibold">Tạm dừng</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => openEdit(item)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Sửa</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-semibold text-sm">Xóa</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                    Không tìm thấy món ăn nào trong thực đơn
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editingItem ? 'Cập nhật món ăn' : 'Món ăn thực đơn mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tên món ăn</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Phở Đặc Biệt" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả chi tiết</label>
            <input className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Nguyên liệu chính, cách phục vụ..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Danh mục</label>
              <select className={inputCls} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Chọn...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Giá cơ bản (VND)</label>
              <input type="number" className={inputCls} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="45000" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tùy chọn biến thể (Sizes/Vị)</label>
              <button type="button" onClick={addVariant} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Thêm dòng</button>
            </div>
            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {variants.map((v, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input className={inputCls} placeholder="Tên biến thể (ví dụ: Size Lớn)" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} required />
                  </div>
                  <div className="w-32">
                    <input type="number" className={inputCls} placeholder="Giá (VND)" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} required />
                  </div>
                  <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:text-red-600 pb-2.5 text-lg">✕</button>
                </div>
              ))}
              {variants.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Món ăn bán giá cố định, chưa có phân loại</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Hủy</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? 'Đang lưu...' : 'Lưu món ăn'}
            </button>
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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<RawMaterial[]>('/api/inventory/items');
      setItems(data);
    } catch {
      toast.error('Không tải được danh sách nguyên liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (!form.name.trim()) { toast.error('Tên nguyên liệu không được trống'); return; }
    if (!form.unit.trim()) { toast.error('Đơn vị tính không được trống'); return; }
    try {
      setSubmitting(true);
      const body = { name: form.name, unit: form.unit, minimumStock: parseFloat(form.minimumStock) || 0 };
      if (editingItem) {
        await api.put(`/api/inventory/items/${editingItem.id}`, body);
        toast.success('Đã cập nhật nguyên liệu');
      } else {
        await api.post('/api/inventory/items', body);
        toast.success('Đã thêm nguyên liệu');
      }
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa nguyên liệu này khỏi danh mục hệ thống?')) return;
    try {
      await api.delete(`/api/inventory/items/${id}`);
      toast.success('Đã xóa nguyên liệu');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  if (loading) {
    return (
      <div className="text-slate-500 py-16 text-center flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải danh sách nguyên liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nguyên liệu mới
        </button>
      </div>

      <div className={tableCardCls}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 font-bold bg-slate-50/70 border-b border-slate-100">
                <th className="py-4 px-6">Tên nguyên liệu</th>
                <th className="py-4 px-6">Đơn vị tính</th>
                <th className="py-4 px-6">Định mức tồn tối thiểu</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">{item.name}</td>
                  <td className="py-4 px-6 text-slate-600">{item.unit}</td>
                  <td className="py-4 px-6 text-slate-600 font-medium">{item.minimumStock}</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => openEdit(item)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Sửa</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-semibold text-sm">Xóa</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 font-medium">
                    Chưa tạo nguyên liệu thô nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editingItem ? 'Sửa thông tin nguyên liệu' : 'Khai báo nguyên liệu mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tên nguyên liệu</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Thịt Bò Mỹ, Sữa Tươi..." required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đơn vị tính</label>
            <input className={inputCls} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Ví dụ: kg, lít, hộp, túi..." required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tồn tối thiểu cảnh báo</label>
            <input type="number" step="0.01" className={inputCls} value={form.minimumStock} onChange={e => setForm({ ...form, minimumStock: e.target.value })} placeholder="Nhận cảnh báo khi tồn dưới số này" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Hủy</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>Lưu lại</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES TAB
// ═══════════════════════════════════════════════════════════════════════════════
// Tab Danh mục món ăn
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Category[]>('/api/inventory/categories');
      setCategories(data);
    } catch {
      toast.error('Không tải được danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Yêu cầu điền tên danh mục'); return; }
    try {
      setSubmitting(true);
      await api.post('/api/inventory/categories', { name });
      toast.success('Đã thêm danh mục mới');
      setShowCreate(false);
      setName('');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa danh mục này? Món ăn thuộc danh mục sẽ bị ảnh hưởng')) return;
    try {
      await api.delete(`/api/inventory/categories/${id}`);
      toast.success('Đã xóa danh mục');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  if (loading) {
    return (
      <div className="text-slate-500 py-16 text-center flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải danh mục...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Danh mục mới
        </button>
      </div>

      <div className={tableCardCls}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 font-bold bg-slate-50/70 border-b border-slate-100">
                <th className="py-4 px-6">Tên phân loại danh mục</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">{cat.name}</td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => handleDelete(cat.id)} className={btnDanger}>Xóa danh mục</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-16 text-center text-slate-400 font-medium">
                    Chưa tạo danh mục món ăn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Thêm danh mục phân loại món ăn">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tên danh mục</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Đồ Uống, Món Khai Vị..." required autoFocus />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Hủy</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>Lưu lại</button>
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
    } catch {
      toast.error('Không tải được lịch sử điều chuyển kho');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.toBranchId) { toast.error('Vui lòng chọn chi nhánh đích'); return; }
    if (!form.rawMaterialId) { toast.error('Vui lòng chọn một nguyên liệu'); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) { toast.error('Nhập số lượng hợp lệ'); return; }
    try {
      setSubmitting(true);
      await api.post('/api/inventory/transfer/create', {
        toBranchId: form.toBranchId,
        rawMaterialId: Number(form.rawMaterialId),
        quantity: parseFloat(form.quantity),
      });
      toast.success('Yêu cầu điều chuyển kho đã được gửi');
      setShowCreate(false);
      setForm({ toBranchId: '', rawMaterialId: '', quantity: '' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Duyệt yêu cầu điều chuyển kho này? Hàng sẽ được khấu trừ trong hệ thống')) return;
    try {
      await api.post(`/api/inventory/transfer/approve/${id}`);
      toast.success('Yêu cầu điều chuyển đã duyệt thành công!');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duyệt thất bại');
    }
  };

  const handleViewDetails = async (transfer: Transfer) => {
    try {
      const details = await api.get<any>(`/api/inventory/transfer/details/${transfer.id}`);
      setSelectedTransfer({ ...transfer, ...details });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được chi tiết điều chuyển');
    }
  };

  if (loading) {
    return (
      <div className="text-slate-500 py-16 text-center flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải danh sách điều chuyển kho...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          Điều kho mới
        </button>
      </div>

      <div className={tableCardCls}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 font-bold bg-slate-50/70 border-b border-slate-100">
                <th className="py-4 px-6">Mã đơn</th>
                <th className="py-4 px-6">Từ chi nhánh</th>
                <th className="py-4 px-6">Đến chi nhánh</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Ngày tạo</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 text-slate-500 font-medium">#{t.id}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{t.fromBranch}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{t.toBranch}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                      t.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      t.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' :
                      'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>{t.status}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleViewDetails(t)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Chi tiết</button>
                    {t.status === 'PENDING' && (
                      <button onClick={() => handleApprove(t.id)} className="text-emerald-600 hover:text-emerald-800 font-semibold text-sm">Phê duyệt</button>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                    Không tìm thấy lịch sử điều chuyển nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tạo phiếu yêu cầu điều chuyển kho chi nhánh">
        <form onSubmit={handleCreate} className="space-y-4">
          {activeBranchId && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Từ kho nguồn (Chi nhánh hiện tại)</label>
              <input className={inputCls} value={branches.find(b => b.branchId === activeBranchId)?.name || activeBranchId} readOnly />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đến kho đích (Chi nhánh nhận)</label>
            <select className={inputCls} value={form.toBranchId} onChange={e => setForm({ ...form, toBranchId: e.target.value })} required>
              <option value="">Chọn chi nhánh...</option>
              {branches.filter(b => b.branchId !== activeBranchId).map(b => (
                <option key={b.branchId} value={b.branchId}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nguyên liệu cần chuyển</label>
            <select className={inputCls} value={form.rawMaterialId} onChange={e => setForm({ ...form, rawMaterialId: e.target.value })} required>
              <option value="">Chọn nguyên liệu...</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name} (Hiện có: {i.currentStock} {i.unit})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Số lượng chuyển</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0.0" required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Hủy</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>Gửi yêu cầu</button>
          </div>
        </form>
      </Modal>

      {/* Transfer Details Modal */}
      <Modal open={!!selectedTransfer} onClose={() => setSelectedTransfer(null)} title={`Yêu cầu điều chuyển kho #${selectedTransfer?.id}`}>
        {selectedTransfer && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Từ kho nguồn:</span> <span className="text-slate-800 font-semibold block mt-0.5">{selectedTransfer.fromBranch}</span></div>
              <div><span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Đến kho nhận:</span> <span className="text-slate-800 font-semibold block mt-0.5">{selectedTransfer.toBranch}</span></div>
              <div className="mt-2"><span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Trạng thái:</span> <span className="text-slate-800 font-bold block mt-0.5">{selectedTransfer.status}</span></div>
              <div className="mt-2"><span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Ngày tạo:</span> <span className="text-slate-800 font-semibold block mt-0.5">{new Date(selectedTransfer.createdAt).toLocaleString('vi-VN')}</span></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelectedTransfer(null)} className={btnSecondary}>Đóng</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
