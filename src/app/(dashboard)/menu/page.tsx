'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/Toast';
import { getApiErrorMessage } from '@/lib/api';
import {
  getMenuItems, getMenuCategories, createMenuItem, updateMenuItem,
  deleteMenuItem, deleteMenuItemsBulk, patchMenuItemStatus,
  type MenuItem, type MenuCategory,
} from '@/lib/menu-store';

// ─── Price Formatting ───────────────────────────────────────────────────────
function formatVND(price: number): string {
  return price.toLocaleString('vi-VN') + ' ₫';
}

// ─── Modal Component ────────────────────────────────────────────────────────
function Modal({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg" onClick={e => e.stopPropagation()}>
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
const btnSecondary = 'px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium transition';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', priceVnd: '', imageUrl: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' });
  const [variants, setVariants] = useState<{ name: string; priceVnd: string }[]>([]);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Clear selection when filter or search changes
  useEffect(() => {
    setSelectedIds([]);
  }, [search, filterCategory]);

  // ─── Load from API ────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [m, c] = await Promise.all([getMenuItems(), getMenuCategories()]);
      setItems(m);
      setCategories(c);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không tải được thực đơn'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  // ─── Filtered Items ──────────────────────────────────────────────────────
  const filteredItems = items.filter(item => {
    const matchCategory = filterCategory === null || item.category?.id === filterCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // ─── Form Helpers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setForm({ name: '', description: '', categoryId: '', priceVnd: '', imageUrl: '', status: 'ACTIVE' });
    setVariants([]);
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      categoryId: String(item.category?.id ?? ''),
      priceVnd: String(item.priceVnd),
      imageUrl: item.imageUrl ?? '',
      status: item.status,
    });
    setVariants(item.variants?.map(v => ({ name: v.name, priceVnd: String(v.priceVnd) })) ?? []);
    setShowForm(true);
  };

  const addVariant = () => setVariants([...variants, { name: '', priceVnd: '' }]);
  const updateVariant = (idx: number, field: string, value: string) => {
    const u = [...variants];
    (u[idx] as Record<string, string>)[field] = value;
    setVariants(u);
  };
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));

  // ─── CRUD ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Tên món ăn là bắt buộc'); return; }
    const cat = form.categoryId ? categories.find(c => c.id === Number(form.categoryId)) ?? null : null;
    const variantData = variants.map((v, vi) => ({ id: vi + 1, name: v.name, priceVnd: parseFloat(v.priceVnd) || 0 }));

    const originalItems = [...items];
    const tempId = Date.now();
    const tempItem: MenuItem = {
      id: tempId,
      name: form.name,
      description: form.description,
      priceVnd: parseFloat(form.priceVnd) || 0,
      imageUrl: form.imageUrl || null,
      category: cat,
      variants: variantData,
      status: form.status,
    };

    // 1. Optimistic Update (Immediate state update and modal close)
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...tempItem, id: editingItem.id } : i));
    } else {
      setItems(prev => [...prev, tempItem]);
    }
    setShowForm(false);

    // 2. Background Sync
    try {
      setSubmitting(true);
      if (editingItem) {
        await updateMenuItem(editingItem.id, {
          name: form.name, description: form.description, priceVnd: parseFloat(form.priceVnd) || 0,
          imageUrl: form.imageUrl || null, category: cat, variants: variantData, status: form.status,
        });
        toast.success('Cập nhật món ăn thành công');
      } else {
        await createMenuItem({
          name: form.name, description: form.description, priceVnd: parseFloat(form.priceVnd) || 0,
          imageUrl: form.imageUrl || null, category: cat, variants: variantData, status: form.status,
        });
        toast.success('Thêm món ăn thành công');
      }
      await load(true); // Silent reload in background to sync database IDs
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lưu món ăn thất bại'));
      setItems(originalItems); // Rollback
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa món ăn này?')) return;
    const originalItems = [...items];

    // 1. Optimistic Update
    setItems(prev => prev.filter(i => i.id !== id));

    // 2. Background Sync
    try {
      await deleteMenuItem(id);
      toast.success('Xóa món ăn thành công');
      await load(true); // Silent reload
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Xóa món ăn thất bại'));
      setItems(originalItems); // Rollback
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Xóa ${selectedIds.length} món ăn đã chọn?`)) return;
    const originalItems = [...items];
    const idsToDelete = [...selectedIds];

    // 1. Optimistic Update
    setItems(prev => prev.filter(i => !idsToDelete.includes(i.id)));
    setSelectedIds([]);

    // 2. Background Sync
    try {
      await deleteMenuItemsBulk(idsToDelete);
      toast.success(`Đã xóa ${idsToDelete.length} món ăn thành công`);
      await load(true); // Silent reload
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Xóa món ăn thất bại'));
      setItems(originalItems); // Rollback
    }
  };

  const handleToggleStatus = async (item: MenuItem) => {
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const originalItems = [...items];

    // 1. Optimistic Update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));

    // 2. Background Sync
    try {
      await patchMenuItemStatus(item.id, newStatus);
      toast.success(newStatus === 'ACTIVE' ? 'Đang bán' : 'Đã ngừng bán');
      await load(true); // Silent reload
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Cập nhật trạng thái thất bại'));
      setItems(originalItems); // Rollback
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý thực đơn</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý món ăn, đồ uống và giá bán</p>
        </div>
        <button onClick={openCreate} className={btnPrimary}>+ Thêm món mới</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input type="text" placeholder="Tìm kiếm món ăn..." value={search} onChange={e => setSearch(e.target.value)} className={inputCls} />
        </div>
        <div className="w-full sm:w-48">
          <select value={filterCategory ?? ''} onChange={e => setFilterCategory(e.target.value ? Number(e.target.value) : null)} className={inputCls}>
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Tổng số món</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{items.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Đang bán</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter(i => i.status === 'ACTIVE').length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Ngừng bán</div>
          <div className="text-2xl font-bold text-slate-400 mt-1">{items.filter(i => i.status === 'INACTIVE').length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Danh mục</div>
          <div className="text-2xl font-bold text-[#25439b] mt-1">{categories.length}</div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#25439b]">{selectedIds.length}</span>
            <span className="text-sm text-slate-600">món ăn đã được chọn</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
            >
              Hủy chọn
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 py-8 text-center flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
          Đang tải thực đơn...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 w-10">
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedIds(filteredItems.map(item => item.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                      <div className="w-5 h-5 border-2 border-slate-300 rounded bg-white peer-checked:bg-[#25439b] peer-checked:border-[#25439b] flex items-center justify-center transition-all duration-150">
                        <svg
                          className={`w-3.5 h-3.5 text-white transition-opacity duration-150 ${(filteredItems.length > 0 && selectedIds.length === filteredItems.length) ? 'opacity-100' : 'opacity-0'}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    </label>
                  </th>
                  <th className="py-3 px-4">Món ăn</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4">Biến thể</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 w-10">
                      <label className="flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={selectedIds.includes(item.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, item.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(x => x !== item.id));
                            }
                          }}
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 rounded bg-white peer-checked:bg-[#25439b] peer-checked:border-[#25439b] flex items-center justify-center transition-all duration-150">
                          <svg
                            className={`w-3.5 h-3.5 text-white transition-opacity duration-150 ${selectedIds.includes(item.id) ? 'opacity-100' : 'opacity-0'}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      </label>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                          </div>
                        )}
                        <div>
                          <div className="text-slate-800 font-medium">{item.name}</div>
                          {item.description && <div className="text-xs text-slate-400 truncate max-w-[200px]">{item.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.category?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{formatVND(item.priceVnd)}</td>
                    <td className="py-3 px-4 text-slate-600">{item.variants?.length ?? 0}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggleStatus(item)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} title={item.status === 'ACTIVE' ? 'Đang bán — nhấn để ngừng bán' : 'Ngừng bán — nhấn để bán lại'}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`ml-2 text-xs font-medium ${item.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {item.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#25439b] hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-200 cursor-pointer"
                          title="Sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">Chưa có món ăn nào. Hãy thêm món ăn đầu tiên!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingItem ? 'Sửa món ăn' : 'Thêm món mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Tên món *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Gà nướng sả ớt" required />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Mô tả</label>
            <textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn gọn về món ăn" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Danh mục</label>
              <select className={inputCls} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Chọn danh mục...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Giá bán (VNĐ)</label>
              <input type="number" step="1000" min="0" className={inputCls} value={form.priceVnd} onChange={e => setForm({ ...form, priceVnd: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">URL hình ảnh</label>
            <input className={inputCls} value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://example.com/hinh-anh.jpg" />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-slate-700">Trạng thái bán</div>
              <div className="text-xs text-slate-400 mt-0.5">{form.status === 'ACTIVE' ? 'Món ăn đang được bày bán' : 'Món ăn đã ngừng bán'}</div>
            </div>
            <button type="button" onClick={() => setForm({ ...form, status: form.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600 font-medium">Biến thể</label>
              <button type="button" onClick={addVariant} className="text-sm text-[#25439b] hover:text-[#1c3580] font-medium">+ Thêm biến thể</button>
            </div>
            {variants.length === 0 && <p className="text-xs text-slate-400">Chưa có biến thể. Thêm biến thể cho kích thước, tùy chọn, v.v.</p>}
            {variants.map((v, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1"><input className={inputCls} placeholder="Tên biến thể" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} /></div>
                <div className="w-32"><input type="number" step="1000" min="0" className={inputCls} placeholder="Giá" value={v.priceVnd} onChange={e => updateVariant(idx, 'priceVnd', e.target.value)} /></div>
                <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:text-red-600 pb-2 text-lg">✕</button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={() => setShowForm(false)} className={btnSecondary}>Hủy</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Thêm mới'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
