'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
const btnPrimary = 'px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition';
const btnSecondary = 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition';

interface LoyaltyCustomer {
  id: number;
  name: string;
  phone: string;
  email: string;
  points: number;
  tier: string;
}

interface Transaction {
  id: number;
  date: string;
  amount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  description: string;
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  SILVER: 'text-gray-300 bg-gray-300/10 border-gray-300/30',
  GOLD: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  PLATINUM: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

export default function CustomerPortalPage() {
  const [view, setView] = useState<'register' | 'lookup' | 'dashboard'>('register');
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lookupPhone, setLookupPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Registration ────────────────────────────────────────────────────────
  const [regForm, setRegForm] = useState({ name: '', phone: '', email: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name.trim()) { toast.error('Name is required'); return; }
    if (!regForm.phone.trim()) { toast.error('Phone is required'); return; }
    try {
      setRegSubmitting(true);
      const result = await api.post<LoyaltyCustomer>('/api/pos/customer/register', regForm);
      setCustomer(result);
      toast.success('Registration successful!');
      setView('dashboard');
      loadTransactions(result.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegSubmitting(false);
    }
  };

  // ─── Lookup ──────────────────────────────────────────────────────────────
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone.trim()) { toast.error('Enter your phone number'); return; }
    try {
      setLoading(true);
      const result = await api.get<LoyaltyCustomer>(`/api/pos/customer/lookup`, {
        params: { phone: lookupPhone },
      });
      setCustomer(result);
      setView('dashboard');
      loadTransactions(result.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Customer not found');
    } finally {
      setLoading(false);
    }
  };

  // ─── Transactions ────────────────────────────────────────────────────────
  const loadTransactions = useCallback(async (customerId: number) => {
    try {
      const data = await api.get<Transaction[]>(`/api/pos/customer/${customerId}/transactions`);
      setTransactions(data);
    } catch {
      setTransactions([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Loyalty Program</h1>
          {customer && (
            <div className="flex gap-3">
              <button onClick={() => setView('dashboard')} className={`text-sm px-3 py-1.5 rounded-lg transition ${view === 'dashboard' ? 'bg-blue-600' : 'text-gray-400 hover:text-white'}`}>
                Dashboard
              </button>
              <button onClick={() => { setCustomer(null); setTransactions([]); setView('lookup'); }} className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ─── Register / Lookup View ─────────────────────────────────────── */}
        {!customer && (
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-3xl font-bold">Earn Rewards with Every Visit</h2>
              <p className="text-gray-400 max-w-md mx-auto">
                Join our loyalty program to earn points, unlock exclusive tiers, and enjoy special perks.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Register Card */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">New Member? Register</h3>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                    <input
                      className={inputCls}
                      value={regForm.name}
                      onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Phone Number</label>
                    <input
                      className={inputCls}
                      value={regForm.phone}
                      onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="+1 234 567 890"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <button type="submit" disabled={regSubmitting} className={btnPrimary + ' w-full'}>
                    {regSubmitting ? 'Registering...' : 'Join Now'}
                  </button>
                </form>
              </div>

              {/* Lookup Card */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Already a Member? Sign In</h3>
                <form onSubmit={handleLookup} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Phone Number</label>
                    <input
                      className={inputCls}
                      value={lookupPhone}
                      onChange={e => setLookupPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className={btnPrimary + ' w-full'}>
                    {loading ? 'Looking up...' : 'View My Points'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ─── Dashboard View ──────────────────────────────────────────────── */}
        {customer && (
          <div className="space-y-6">
            {/* Points & Tier */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Welcome Back</p>
                <p className="text-xl font-bold">{customer.name}</p>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Available Points</p>
                <p className="text-4xl font-bold text-blue-400">{customer.points}</p>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Loyalty Tier</p>
                <span className={`inline-block px-4 py-2 rounded-full border text-lg font-bold ${TIER_COLORS[customer.tier] || 'text-gray-400 bg-gray-400/10 border-gray-400/30'}`}>
                  {customer.tier}
                </span>
              </div>
            </div>

            {/* Tier Benefits */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Tier Benefits</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { tier: 'BRONZE', range: '0-999 pts', perks: '1x points' },
                  { tier: 'SILVER', range: '1,000-4,999 pts', perks: '1.5x points, birthday reward' },
                  { tier: 'GOLD', range: '5,000-14,999 pts', perks: '2x points, free item/month' },
                  { tier: 'PLATINUM', range: '15,000+ pts', perks: '3x points, VIP access' },
                ].map((t) => (
                  <div
                    key={t.tier}
                    className={`rounded-lg p-3 border ${
                      customer.tier === t.tier
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800/50'
                    }`}
                  >
                    <p className={`font-bold ${customer.tier === t.tier ? 'text-blue-400' : 'text-white'}`}>{t.tier}</p>
                    <p className="text-gray-500 text-xs mt-1">{t.range}</p>
                    <p className="text-gray-400 text-xs mt-1">{t.perks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No transactions yet. Start earning points!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-right">Points Earned</th>
                        <th className="py-2 px-3 text-right">Points Redeemed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-800">
                          <td className="py-2 px-3 text-gray-300">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-white">{tx.description}</td>
                          <td className="py-2 px-3 text-gray-300 text-right">${tx.amount.toFixed(2)}</td>
                          <td className="py-2 px-3 text-green-400 text-right">
                            {tx.pointsEarned > 0 ? `+${tx.pointsEarned}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-red-400 text-right">
                            {tx.pointsRedeemed > 0 ? `-${tx.pointsRedeemed}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
