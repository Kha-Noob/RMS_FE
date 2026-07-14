'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

// ─── Reusable Styles ────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm';
const btnPrimary = 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-950/10 active:scale-95 transition-all flex items-center gap-1.5';
const btnDanger = 'px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-bold active:scale-95 transition-all';
const btnSecondary = 'px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all';
const btnSuccess = 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold active:scale-95 transition-all';
const tableCardCls = 'bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm';

// --- Types ---
interface PurchaseOrder {
  id: number;
  supplier: { id: number; name: string };
  status: string;
  orderDate: string;
  totalAmount: number;
  branchId: string;
  items: POItem[];
}

interface POItem {
  id?: number;
  rawMaterialName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
}

// ─── Modal ──────────────────────────────────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className={`bg-white border border-slate-100 rounded-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200`}>
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

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

// MAIN PAGE
export default function ProcurementPage() {
  const { activeBranchId } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [showGRN, setShowGRN] = useState(false);
  const [showMatch, setShowMatch] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<PurchaseOrder[]>('/api/procurement/po', {
        params: { branchId: activeBranchId ?? undefined },
      });
      setOrders(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được đơn mua hàng');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const viewDetails = async (po: PurchaseOrder) => {
    try {
      const details = await api.get<PurchaseOrder>(`/api/procurement/po/details/${po.id}`);
      setViewingPO(details);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được chi tiết đơn mua hàng');
    }
  };

  const approvePO = async (poId: number) => {
    if (!confirm('Duyệt đơn mua hàng (PO) này?')) return;
    try {
      await api.post('/api/procurement/po/approve', { poId });
      toast.success('Đã duyệt đơn mua hàng');
      loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duyệt đơn thất bại');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Quản lý thu mua (Procurement)</h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý đơn mua hàng từ nhà cung cấp (PO), nhập kho (GRN) và đối chiếu hóa đơn</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Tạo đơn mua hàng
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-16 text-center flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang tải danh sách đơn hàng...</span>
        </div>
      ) : (
        <div className={tableCardCls}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 font-bold bg-slate-50/70 border-b border-slate-100">
                  <th className="py-4 px-6">Đơn PO #</th>
                  <th className="py-4 px-6">Nhà cung cấp</th>
                  <th className="py-4 px-6">Ngày đặt</th>
                  <th className="py-4 px-6">Tổng tiền</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-500">#{po.id}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{po.supplier?.name}</td>
                    <td className="py-4 px-6 text-slate-500">{new Date(po.orderDate).toLocaleDateString('vi-VN')}</td>
                    <td className="py-4 px-6 text-slate-700 font-bold">{formatVND(po.totalAmount)}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="py-4 px-6 text-right space-x-2.5">
                      <button onClick={() => viewDetails(po)} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm">Chi tiết</button>
                      {po.status === 'PENDING' && (
                        <button onClick={() => approvePO(po.id)} className="text-emerald-600 hover:text-emerald-800 font-bold text-sm">Duyệt</button>
                      )}
                      {po.status === 'APPROVED' && (
                        <>
                          <button onClick={() => { setShowGRN(true); setViewingPO(po); }} className="text-amber-600 hover:text-amber-800 font-bold text-sm">Nhập kho (GRN)</button>
                          <button onClick={() => { setShowMatch(true); setViewingPO(po); }} className="text-purple-600 hover:text-purple-800 font-bold text-sm">Đối chiếu</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                      Chưa có đơn đặt mua hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreatePOModal open={showCreate} onClose={() => { setShowCreate(false); loadOrders(); }} branchId={activeBranchId} />

      <Modal open={!!viewingPO && !showGRN && !showMatch} onClose={() => setViewingPO(null)} title={`Đơn đặt mua hàng (PO) #${viewingPO?.id}`} wide>
        {viewingPO && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Nhà cung cấp</span><span className="text-slate-800 font-semibold mt-0.5 block">{viewingPO.supplier?.name}</span></div>
              <div><span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Ngày lập</span><span className="text-slate-800 font-semibold mt-0.5 block">{new Date(viewingPO.orderDate).toLocaleDateString('vi-VN')}</span></div>
              <div><span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Tổng giá trị</span><span className="text-indigo-600 font-bold mt-0.5 block">{formatVND(viewingPO.totalAmount)}</span></div>
              <div><span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Trạng thái</span><div className="mt-0.5"><StatusBadge status={viewingPO.status} /></div></div>
            </div>
            {viewingPO.items && viewingPO.items.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Danh sách nguyên liệu</h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 font-semibold bg-slate-50/70 border-b border-slate-100">
                        <th className="py-2.5 px-4">Tên nguyên liệu</th>
                        <th className="py-2.5 px-4">Số lượng</th>
                        <th className="py-2.5 px-4">Đơn giá</th>
                        <th className="py-2.5 px-4">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {viewingPO.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-4 text-slate-800 font-medium">{item.rawMaterialName}</td>
                          <td className="py-2.5 px-4 text-slate-600 font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-4 text-slate-500">{formatVND(item.unitPrice)}</td>
                          <td className="py-2.5 px-4 text-slate-400">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewingPO(null)} className={btnSecondary}>Đóng</button>
            </div>
          </div>
        )}
      </Modal>

      <GRNModal open={showGRN} onClose={() => { setShowGRN(false); setViewingPO(null); loadOrders(); }} po={viewingPO} />

      <MatchModal open={showMatch} onClose={() => { setShowMatch(false); setViewingPO(null); loadOrders(); }} po={viewingPO} />
    </div>
  );
}

// --- Status Badge ---
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-600 border border-amber-100',
    APPROVED: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    RECEIVED: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    MATCHED: 'bg-purple-50 text-purple-600 border border-purple-100',
    CANCELLED: 'bg-rose-50 text-rose-600 border border-rose-100',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${colors[status] || 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

// CREATE PO MODAL
function CreatePOModal({
  open,
  onClose,
  branchId,
}: {
  open: boolean;
  onClose: () => void;
  branchId: string | null;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<{ rawMaterialName: string; quantity: string; unitPrice: string; unit: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      api.get<Supplier[]>('/api/procurement/suppliers').catch(() => []),
      api.get<RawMaterial[]>('/api/inventory/items').catch(() => []),
    ]).then(([s, r]) => {
      setSuppliers(s);
      setRawMaterials(r);
    });
    setSupplierId('');
    setItems([]);
  }, [open]);

  const addItem = () => setItems([...items, { rawMaterialName: '', quantity: '', unitPrice: '', unit: '' }]);

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    if (field === 'rawMaterialName') {
      const rm = rawMaterials.find(r => r.name === value);
      if (rm) updated[idx].unit = rm.unit;
    }
    setItems(updated);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) { toast.error('Vui lòng chọn nhà cung cấp'); return; }
    if (items.length === 0) { toast.error('Vui lòng thêm ít nhất một nguyên liệu'); return; }
    try {
      setSubmitting(true);
      await api.post('/api/procurement/po/create', {
        supplierId: Number(supplierId),
        branchId,
        totalAmount,
        items: items.map(i => ({
          rawMaterialName: i.rawMaterialName,
          quantity: parseFloat(i.quantity) || 0,
          unitPrice: parseFloat(i.unitPrice) || 0,
          unit: i.unit,
        })),
      });
      toast.success('Đã tạo đơn mua hàng PO thành công');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Tạo đơn đặt mua hàng (PO) mới" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nhà cung cấp</label>
          <select className={inputCls} value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
            <option value="">Chọn nhà cung cấp...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục nguyên liệu đặt mua</label>
            <button type="button" onClick={addItem} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">+ Thêm dòng</button>
          </div>
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  {idx === 0 && <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nguyên liệu</label>}
                  <select className={inputCls} value={item.rawMaterialName} onChange={e => updateItem(idx, 'rawMaterialName', e.target.value)}>
                    <option value="">Chọn...</option>
                    {rawMaterials.map(rm => <option key={rm.id} value={rm.name}>{rm.name}</option>)}
                  </select>
                </div>
                <div className="w-24">
                  {idx === 0 && <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Số lượng</label>}
                  <input type="number" step="0.01" className={inputCls} placeholder="0.0" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                </div>
                <div className="w-28">
                  {idx === 0 && <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Đơn giá</label>}
                  <input type="number" step="0.01" className={inputCls} placeholder="Giá" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                </div>
                <div className="w-16">
                  {idx === 0 && <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Đơn vị</label>}
                  <input className={inputCls} value={item.unit} readOnly placeholder="kg" />
                </div>
                <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-600 pb-2.5 text-lg">✕</button>
              </div>
            ))}
          </div>
        </div>

        {items.length > 0 && (
          <div className="text-right text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            Tổng trị giá dự kiến: <span className="text-indigo-600 font-extrabold text-base ml-1">{formatVND(totalAmount)}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button type="submit" disabled={submitting} className={btnPrimary}>
            {submitting ? 'Đang tạo...' : 'Gửi đơn PO'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// GRN MODAL
function GRNModal({
  open,
  onClose,
  po,
}: {
  open: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
}) {
  const [items, setItems] = useState<{ rawMaterialName: string; receivedQuantity: string; unit: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (po?.items) {
      setItems(po.items.map(i => ({
        rawMaterialName: i.rawMaterialName,
        receivedQuantity: String(i.quantity),
        unit: i.unit,
      })));
    } else {
      setItems([]);
    }
  }, [po]);

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!po) return;
    try {
      setSubmitting(true);
      await api.post('/api/procurement/po/grn', {
        poId: po.id,
        items: items.map(i => ({
          rawMaterialName: i.rawMaterialName,
          receivedQuantity: parseFloat(i.receivedQuantity) || 0,
          unit: i.unit,
        })),
      });
      toast.success('Nhập kho đơn hàng thành công');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo GRN thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Tạo phiếu nhập kho (GRN) cho đơn PO #${po?.id}`} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-400 font-medium">Xác nhận chính xác số lượng thực tế nhận được từ nhà cung cấp cho mỗi mặt hàng.</p>
        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nguyên liệu</label>
                <input className={inputCls} value={item.rawMaterialName} readOnly />
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">SL thực nhận</label>
                <input type="number" step="0.01" className={inputCls} value={item.receivedQuantity} onChange={e => updateItem(idx, 'receivedQuantity', e.target.value)} required />
              </div>
              <div className="w-20">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đơn vị</label>
                <input className={inputCls} value={item.unit} readOnly />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button type="submit" disabled={submitting} className={btnSuccess}>
            {submitting ? 'Đang thực hiện...' : 'Xác nhận Nhập kho'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// INVOICE MATCH MODAL
function MatchModal({
  open,
  onClose,
  po,
}: {
  open: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
}) {
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setInvoiceAmount('');
    setInvoiceNumber('');
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!po) return;
    if (!invoiceAmount || parseFloat(invoiceAmount) <= 0) {
      toast.error('Vui lòng nhập trị giá hóa đơn hợp lệ');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/api/procurement/po/match', {
        poId: po.id,
        invoiceAmount: parseFloat(invoiceAmount),
        invoiceNumber,
      });
      toast.success('Đối chiếu và thanh toán thành công');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đối chiếu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const diff = invoiceAmount && po?.totalAmount ? parseFloat(invoiceAmount) - po.totalAmount : 0;

  return (
    <Modal open={open} onClose={onClose} title={`Đối chiếu hóa đơn tài chính cho PO #${po?.id}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center text-sm font-semibold">
          <span className="text-slate-400">Trị giá đơn PO gốc:</span>
          <span className="text-slate-800 font-bold">{po ? formatVND(po.totalAmount) : '—'}</span>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mã hóa đơn nhà cung cấp</label>
          <input className={inputCls} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Ví dụ: INV-2026-001" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trị giá thanh toán thực tế (VND)</label>
          <input type="number" className={inputCls} value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} placeholder="Nhập số tiền hóa đơn nhận được" required />
        </div>
        {invoiceAmount && po?.totalAmount && (
          <div className="text-xs font-semibold p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400 font-medium">Chênh lệch:</span>
            {diff === 0 ? (
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Hoàn toàn khớp</span>
            ) : (
              <span className={diff > 0 ? 'text-rose-600' : 'text-amber-600'}>
                {diff > 0 ? 'Thừa: ' : 'Thiếu: '} {formatVND(Math.abs(diff))}
              </span>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
          <button type="submit" disabled={submitting} className={btnSuccess}>
            {submitting ? 'Đang đối chiếu...' : 'Xác nhận Đối chiếu'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
