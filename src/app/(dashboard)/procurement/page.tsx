'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Truck, FileCheck, Eye, Plus, Package, CheckCircle2, Info } from 'lucide-react';

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

const getInitials = (name: string) => {
  if (!name) return 'NA';
  return name.substring(0, 2).toUpperCase();
};

const inputCls = 'w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b] text-sm';
const btnPrimary = 'px-4 py-2 rounded-lg bg-[#25439b] hover:bg-[#1c3580] text-white text-sm font-medium transition';
const btnDanger = 'px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition';
const btnSecondary = 'px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium transition';
const btnSuccess = 'px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm transition';

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

// --- Modal ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className={`bg-white border border-slate-200 rounded-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto shadow-lg`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-xl">x</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
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
      toast.error(err instanceof Error ? err.message : 'Failed to load purchase orders');
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
      toast.error(err instanceof Error ? err.message : 'Failed to load PO details');
    }
  };

  const approvePO = async (poId: number) => {
    if (!confirm('Approve this purchase order?')) return;
    try {
      await api.post('/api/procurement/po/approve', { poId });
      toast.success('Purchase order approved');
      loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve PO');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="text-[#25439b]" />
            Procurement Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage purchase orders and receive goods</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={`${btnPrimary} flex items-center gap-2`}>
          <Plus size={18} />
          New Purchase Order
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#25439b] rounded-full animate-spin mb-3" />
          <p className="text-slate-500 font-medium">Loading purchase orders...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <th className="py-4 px-5">PO #</th>
                  <th className="py-4 px-5">Supplier</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Amount</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <tr key={po.id} className="border-b border-slate-100/50 hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-semibold text-[#25439b]">#{po.id}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm ${stringToColorClass(po.supplier?.name)}`}>
                          {getInitials(po.supplier?.name)}
                        </div>
                        <span className="font-semibold text-slate-800">{po.supplier?.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-medium">{new Date(po.orderDate).toLocaleDateString()}</td>
                    <td className="py-4 px-5 text-slate-800 font-bold">${po.totalAmount?.toFixed(2)}</td>
                    <td className="py-4 px-5">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button onClick={() => viewDetails(po)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#25439b] bg-[#25439b]/5 hover:bg-[#25439b]/10 transition-colors" title="View Details">
                        <Eye size={14} /> View
                      </button>
                      {po.status === 'PENDING' && (
                        <button onClick={() => approvePO(po.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors" title="Approve">
                          <CheckCircle2 size={14} /> Approve
                        </button>
                      )}
                      {po.status === 'APPROVED' && (
                        <>
                          <button onClick={() => { setShowGRN(true); setViewingPO(po); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors" title="Good Receive Note">
                            <Truck size={14} /> GRN
                          </button>
                          <button onClick={() => { setShowMatch(true); setViewingPO(po); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors" title="Match Invoice">
                            <FileCheck size={14} /> Match
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Package className="text-slate-400 w-8 h-8" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800">No purchase orders found</h3>
                        <p className="text-sm text-slate-500 mt-1">Start by creating a new purchase order.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreatePOModal open={showCreate} onClose={() => { setShowCreate(false); loadOrders(); }} branchId={activeBranchId} />

      <Modal open={!!viewingPO && !showGRN && !showMatch} onClose={() => setViewingPO(null)} title={`Purchase Order #${viewingPO?.id}`} wide>
        {viewingPO && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-500 block text-xs">Supplier</span><span className="text-slate-800">{viewingPO.supplier?.name}</span></div>
              <div><span className="text-slate-500 block text-xs">Date</span><span className="text-slate-800">{new Date(viewingPO.orderDate).toLocaleDateString()}</span></div>
              <div><span className="text-slate-500 block text-xs">Total</span><span className="text-slate-800">${viewingPO.totalAmount?.toFixed(2)}</span></div>
              <div><span className="text-slate-500 block text-xs">Status</span><StatusBadge status={viewingPO.status} /></div>
            </div>
            {viewingPO.items && viewingPO.items.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-2">Items</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-200">
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Unit Price</th>
                      <th className="py-2 px-3">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingPO.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="py-2 px-3 text-slate-800">{item.rawMaterialName}</td>
                        <td className="py-2 px-3 text-slate-600">{item.quantity}</td>
                        <td className="py-2 px-3 text-slate-600">${item.unitPrice?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-600">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
  const badgeProps: Record<string, { color: string; icon: React.ReactNode }> = {
    PENDING: { color: 'bg-amber-50 text-amber-600 border-amber-200/60', icon: <Info size={14} /> },
    APPROVED: { color: 'bg-emerald-50 text-emerald-600 border-emerald-200/60', icon: <CheckCircle2 size={14} /> },
    RECEIVED: { color: 'bg-blue-50 text-[#25439b] border-blue-200/60', icon: <Truck size={14} /> },
    MATCHED: { color: 'bg-purple-50 text-purple-600 border-purple-200/60', icon: <FileCheck size={14} /> },
    CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200/60', icon: <Info size={14} /> },
  };
  const style = badgeProps[status] || { color: 'bg-slate-100 text-slate-500 border-slate-200/60', icon: <Info size={14} /> };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.color}`}>
      {style.icon} {status}
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
    if (!supplierId) { toast.error('Select a supplier'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }
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
      toast.success('Purchase order created');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create PO');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Purchase Order" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Supplier</label>
          <select className={inputCls} value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
            <option value="">Select supplier...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-600 font-medium">Items</label>
            <button type="button" onClick={addItem} className="text-sm text-[#25439b] hover:text-[#1c3580]">+ Add Item</button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <select className={inputCls} value={item.rawMaterialName} onChange={e => updateItem(idx, 'rawMaterialName', e.target.value)}>
                  <option value="">Material...</option>
                  {rawMaterials.map(rm => <option key={rm.id} value={rm.name}>{rm.name}</option>)}
                </select>
              </div>
              <div className="w-24">
                <input type="number" step="0.01" className={inputCls} placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
              </div>
              <div className="w-28">
                <input type="number" step="0.01" className={inputCls} placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
              </div>
              <div className="w-16">
                <input className={inputCls} value={item.unit} readOnly />
              </div>
              <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-600 pb-2 text-lg">x</button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="text-right text-sm text-slate-600">
            Total: <span className="text-slate-800 font-semibold">${totalAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Creating...' : 'Create PO'}</button>
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
      toast.success('GRN created successfully');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create GRN');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Create GRN for PO #${po?.id}`} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">Record received quantities for each item in this purchase order.</p>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Material</label>
              <input className={inputCls} value={item.rawMaterialName} readOnly />
            </div>
            <div className="w-32">
              <label className="block text-xs text-slate-400 mb-1">Received Qty</label>
              <input type="number" step="0.01" className={inputCls} value={item.receivedQuantity} onChange={e => updateItem(idx, 'receivedQuantity', e.target.value)} />
            </div>
            <div className="w-20">
              <label className="block text-xs text-slate-400 mb-1">Unit</label>
              <input className={inputCls} value={item.unit} readOnly />
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={submitting} className={btnSuccess}>{submitting ? 'Submitting...' : 'Submit GRN'}</button>
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
      toast.error('Enter a valid invoice amount');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/api/procurement/po/match', {
        poId: po.id,
        invoiceAmount: parseFloat(invoiceAmount),
        invoiceNumber,
      });
      toast.success('Invoice matched successfully');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to match invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Match Invoice for PO #${po?.id}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>PO Amount:</span>
            <span className="text-slate-800 font-medium">${po?.totalAmount?.toFixed(2)}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Invoice Number</label>
          <input className={inputCls} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-001" required />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Invoice Amount</label>
          <input type="number" step="0.01" className={inputCls} value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} required />
        </div>
        {invoiceAmount && po?.totalAmount && (
          <div className="text-sm">
            {parseFloat(invoiceAmount) === po.totalAmount ? (
              <span className="text-emerald-600">Amounts match</span>
            ) : (
              <span className="text-amber-600">
                Difference: ${(parseFloat(invoiceAmount) - po.totalAmount).toFixed(2)}
              </span>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={submitting} className={btnSuccess}>{submitting ? 'Matching...' : 'Match Invoice'}</button>
        </div>
      </form>
    </Modal>
  );
}
