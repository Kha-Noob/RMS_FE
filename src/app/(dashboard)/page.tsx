'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';

interface RevenueSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItem: string;
}

interface OrderLog {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  createdBy: string;
}

export default function DashboardPage() {
  const { user, activeBranchId } = useAuth();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBranchId) {
      setSummary(null);
      setOrderLogs([]);
      setLoading(false);
      return;
    }
    const fetchDashboard = async () => {
      try {
        const [summaryData, logsData] = await Promise.all([
          api.get<RevenueSummary>('/api/pos/order-logs/summary?range=day'),
          api.get<OrderLog[]>('/api/pos/order-logs?range=day'),
        ]);
        setSummary(summaryData);
        setOrderLogs(logsData);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [activeBranchId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const cards = summary
    ? [
        { label: 'Today\'s Revenue', value: formatCurrency(summary.totalRevenue), icon: '💰' },
        { label: 'Total Orders', value: summary.totalOrders.toString(), icon: '📋' },
        { label: 'Avg Order Value', value: formatCurrency(summary.averageOrderValue), icon: '📊' },
        { label: 'Top Item', value: summary.topSellingItem || 'N/A', icon: '🏆' },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">{card.label}</span>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Orders Today</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Cashier</th>
              </tr>
            </thead>
            <tbody>
              {orderLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No orders today
                  </td>
                </tr>
              ) : (
                orderLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-medium text-slate-700">{log.orderNumber}</td>
                    <td className="px-5 py-3 text-slate-700">{formatCurrency(log.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-600'
                          : log.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{log.paymentMethod}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{log.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
