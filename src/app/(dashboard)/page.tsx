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
  const { user } = useAuth();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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
        <div className="text-gray-400 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-xl bg-gray-900/80 backdrop-blur border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">{card.label}</span>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-gray-900/80 backdrop-blur border border-gray-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold">Recent Orders Today</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700/50">
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
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                    No orders today
                  </td>
                </tr>
              ) : (
                orderLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-700/30 hover:bg-gray-800/50 transition">
                    <td className="px-5 py-3 font-medium">{log.orderNumber}</td>
                    <td className="px-5 py-3">{formatCurrency(log.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'COMPLETED'
                          ? 'bg-green-900/50 text-green-400'
                          : log.status === 'CANCELLED'
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">{log.paymentMethod}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3">{log.createdBy}</td>
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
