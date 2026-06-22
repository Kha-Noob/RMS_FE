'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
const btnPrimary = 'px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition';
const btnDanger = 'px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm transition';
const btnSecondary = 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition';
const btnSuccess = 'px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm transition';

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Modal ───────────────────────────────────────────────────────────────────
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
      <div className={`bg-gray-900 border border-gray-700 rounded-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Procurement Management</h1>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Purchase Order</button>
      </div>

      {/* PO List */}
      {loading ? (
        <div className="text-gray-400 py-8 text-center">Loading purchase orders...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="py-3 px-4">PO #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">#{po.id}</td>
                  <td className="py-3 px-4 text-gray-300">{po.supplier?.name}</td>
                  <td className="py-3 px-4 text-gray-300">{new Date(po.orderDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-gray-300">${po.totalAmount?.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button onClick={() => viewDetails(po)} className="text-blue-400 hover:text-blue-300 text-sm">View</button>
                    {po.status === 'PENDING' && (
                      <button onClick={() => approvePO(po.id)} className="text-green-400 hover:text-green-300 text-sm">Approve</button>
                    )}
                    {po.status === 'APPROVED' && (
                      <>
                        <button onClick={() => { setShowGRN(true); setViewingPO(po); }} className="text-yellow-400 hover:text-yellow-300 text-sm">GRN</button>
                        <button onClick={() => { setShowMatch(true); setViewingPO(po); }} className="text-purple-400 hover:text-purple-300 text-sm">Match</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No purchase orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create PO Modal */}
      <CreatePOModal open={showCreate} onClose={() => { setShowCreate(false); loadOrders(); }} branchId={activeBranchId} />

      {/* PO Details Modal */}
      <Modal open={!!viewingPO && !showGRN && !showMatch} onClose={() => setViewingPO(null)} title={`Purchase Order #${viewingPO?.id}`} wide>
        {viewingPO && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-400 block text-xs">Supplier</span><span className="text-white">{viewingPO.supplier?.name}</span></div>
              <div><span className="text-gray-400 block text-xs">Date</span><span className="text-white">{new Date(viewingPO.orderDate).toLocaleDateString()}</span></div>
              <div><span className="text-gray-400 block text-xs">Total</span><span className="text-white">${viewingPO.totalAmount?.toFixed(2)}</span></div>
              <div><span className="text-gray-400 block text-xs">Status</span><StatusBadge status={viewingPO.status} /></div>
            </div>
            {viewingPO.items && viewingPO.items.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Items</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-700">
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Unit Price</th>
                      <th className="py-2 px-3">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingPO.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-800">
                        <td className="py-2 px-3 text-white">{item.rawMaterialName}</td>
                        <td className="py-2 px-3 text-gray-300">{item.quantity}</td>
                        <td className="py-2 px-3 text-gray-300">${item.unitPrice?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-gray-300">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* GRN Modal */}
      <GRNModal open={showGRN} onClose={() => { setShowGRN(false); setViewingPO(null); loadOrders(); }} po={viewingPO} />

      {/* Invoice Match Modal */}
      <MatchModal open={showMatch} onClose={() => { setShowMatch(false); setViewingPO(null); loadOrders(); }} po={viewingPO} />
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-600/20 text-yellow-400',
    APPROVED: 'bg-green-600/20 text-green-400',
    RECEIVED: 'bg-blue-600/20 text-blue-400',
    MATCHED: 'bg-purple-600/20 text-purple-400',
    CANCELLED: 'bg-red-600/20 text-red-400',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-600/20 text-gray-400'}`}>
      {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PO MODAL
// ═══════════════════════════════════════════════════════════════════════════════
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
          <label className="block text-sm text-gray-300 mb-1">Supplier</label>
          <select className={inputCls} value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
            <option value="">Select supplier...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300 font-medium">Items</label>
            <button type="button" onClick={addItem} className="text-sm text-blue-400 hover:text-blue-300">+ Add Item</button>
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
              <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 pb-2 text-lg">✕</button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="text-right text-sm text-gray-300">
            Total: <span className="text-white font-semibold">${totalAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? 'Creating...' : 'Create PO'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRN MODAL
// ═══════════════════════════════════════════════════════════════════════════════
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
        <p className="text-sm text-gray-400">Record received quantities for each item in this purchase order.</p>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Material</label>
              <input className={inputCls} value={item.rawMaterialName} readOnly />
            </div>
            <div className="w-32">
              <label className="block text-xs text-gray-500 mb-1">Received Qty</label>
              <input type="number" step="0.01" className={inputCls} value={item.receivedQuantity} onChange={e => updateItem(idx, 'receivedQuantity', e.target.value)} />
            </div>
            <div className="w-20">
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <input className={inputCls} value={item.unit} readOnly />
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={submitting} className={btnSuccess}>{submitting ? 'Submitting...' : 'Submit GRN'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVOICE MATCH MODAL
// ═══════════════════════════════════════════════════════════════════════════════
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
        <div className="bg-gray-800 rounded-lg p-3 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>PO Amount:</span>
            <span className="text-white font-medium">${po?.totalAmount?.toFixed(2)}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Invoice Number</label>
          <input className={inputCls} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-001" required />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Invoice Amount</label>
          <input type="number" step="0.01" className={inputCls} value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} required />
        </div>
        {invoiceAmount && po?.totalAmount && (
          <div className="text-sm">
            {parseFloat(invoiceAmount) === po.totalAmount ? (
              <span className="text-green-400">Amounts match</span>
            ) : (
              <span className="text-yellow-400">
                Difference: ${(parseFloat(invoiceAmount) - po.totalAmount).toFixed(2)}
              </span>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={submitting} className={btnSuccess}>{submitting ? 'Matching...' : 'Match Invoice'}</button>
        </div>
      </form>
    </Modal>
  );
}
