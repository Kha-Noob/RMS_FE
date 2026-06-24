'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';

interface DashboardSummary {
  branchId: string;
  branchName: string;
  startDate: string;
  endDate: string;
  customerVisits: number;
  totalRevenue: number;
  bookingSuccessRate: number;
  onlineBookingCount: number;
  offlineBookingCount: number;
  onlineOrderCount: number;
  offlineOrderCount: number;
  averageCustomerRating: number;
  revenueTrend: { date: string; revenue: number }[];
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + ' tỷ';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + ' triệu';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return amount.toFixed(0);
}

function formatFullVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

// ── SVG Bar Chart ───────────────────────────────────────────────────────────
function RevenueChart({ data, loading }: { data: { date: string; revenue: number }[] | undefined | null; loading: boolean }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; revenue: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (loading) {
    return <div className="h-[260px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" /></div>;
  }

  const validData = (Array.isArray(data) ? data : [])
    .filter(d => d && typeof d.date === 'string' && d.date.length > 0 && typeof d.revenue === 'number' && isFinite(d.revenue));

  if (validData.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">Không có dữ liệu doanh thu</div>;
  }

  const W = 800, H = 260, PAD = { top: 16, right: 20, bottom: 32, left: 65 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxRev = Math.max(...validData.map(d => d.revenue), 1);
  const paddedMax = maxRev * 1.12;

  const barGap = 4;
  const barW = Math.max(4, (chartW - barGap * (validData.length - 1)) / validData.length);

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (paddedMax / yTicks) * i);

  const tickCount = Math.min(validData.length, 8);
  const tickStep = Math.max(1, Math.floor(validData.length / tickCount));

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = validData[0];
    let closestIdx = 0;
    let minDist = Infinity;
    validData.forEach((d, i) => {
      const barX = PAD.left + i * (barW + barGap) + barW / 2;
      const dist = Math.abs(barX - mouseX);
      if (dist < minDist) { minDist = dist; closest = d; closestIdx = i; }
    });
    const barX = PAD.left + closestIdx * (barW + barGap) + barW / 2;
    const barH = (closest.revenue / paddedMax) * chartH;
    setTooltip({ x: barX, y: PAD.top + chartH - barH, date: closest.date, revenue: closest.revenue });
  };

  return (
    <div className="relative w-full">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        {yTickValues.map((v, i) => {
          const y = PAD.top + chartH - (v / paddedMax) * chartH;
          return <g key={i}><line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e2e8f0" strokeWidth="0.5" /><text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize="10">{formatVND(v)}</text></g>;
        })}
        {validData.map((d, i) => {
          const x = PAD.left + i * (barW + barGap);
          const h = (d.revenue / paddedMax) * chartH;
          const y = PAD.top + chartH - h;
          return <rect key={i} x={x} y={y} width={barW} height={h} rx={barW > 10 ? 3 : 1} fill="#25439b" opacity={tooltip && tooltip.date === d.date ? 1 : 0.8} />;
        })}
        {validData.map((d, i) => {
          if (i % tickStep !== 0 && i !== validData.length - 1) return null;
          const x = PAD.left + i * (barW + barGap) + barW / 2;
          return <text key={i} x={x} y={H - 10} textAnchor="middle" className="fill-slate-400" fontSize="9">{d.date}</text>;
        })}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + chartH} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
            <rect x={tooltip.x - 70} y={tooltip.y - 32} width="140" height="26" rx="5" fill="#1e293b" />
            <text x={tooltip.x} y={tooltip.y - 15} textAnchor="middle" fill="white" fontSize="11" fontWeight="500">{tooltip.date} · {formatFullVND(tooltip.revenue)}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="px-4 py-3 rounded-lg bg-white border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-[13px] text-slate-500 leading-tight">{label}</p>
          <p className="text-xl font-semibold text-slate-800 mt-0.5 leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────
const IconUsers = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconRevenue = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconBooking = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>;
const IconStar = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconOnline = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconOffline = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconOrder = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;

// ── Main ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, activeBranchId } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const today = toLocalDateStr(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!activeBranchId) { setSummary(null); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.get<DashboardSummary>(
        `/api/dashboard/summary?startDate=${startDate}&endDate=${endDate}`
      );
      setSummary(data);
    } catch { toast.error('Không tải được dữ liệu dashboard'); }
    finally { setLoading(false); }
  }, [activeBranchId, startDate, endDate]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary?.branchName || '—'}
            {summary?.branchName && user?.name && <span className="text-slate-300"> · </span>}
            {user?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Từ</label>
          <input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)}
            className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#25439b]/30 focus:border-[#25439b]/50" />
          <label className="text-xs text-slate-500">Đến</label>
          <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
            className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#25439b]/30 focus:border-[#25439b]/50" />
          <button onClick={fetchDashboard} className="px-3 py-1.5 text-sm font-medium bg-[#25439b] text-white rounded-lg hover:bg-[#1e3a8a] transition-colors">
            Xem
          </button>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Lượt khách ghé thăm" value={String(summary?.customerVisits ?? 0)} icon={<IconUsers />} />
        <KpiCard label="Tổng doanh thu" value={formatFullVND(summary?.totalRevenue ?? 0)} icon={<IconRevenue />} />
        <KpiCard label="Tỷ lệ đặt bàn thành công" value={`${summary?.bookingSuccessRate ?? 0}%`} icon={<IconBooking />} />
        <KpiCard label="Đánh giá khách hàng" value={String(summary?.averageCustomerRating ?? 0)} icon={<IconStar />} />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Đặt bàn online" value={String(summary?.onlineBookingCount ?? 0)} icon={<IconOnline />} />
        <KpiCard label="Đặt bàn offline" value={String(summary?.offlineBookingCount ?? 0)} icon={<IconOffline />} />
        <KpiCard label="Đơn hàng online" value={String(summary?.onlineOrderCount ?? 0)} icon={<IconOnline />} />
        <KpiCard label="Đơn hàng offline" value={String(summary?.offlineOrderCount ?? 0)} icon={<IconOffline />} />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg bg-white border border-slate-200 p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Biểu đồ doanh thu</h2>
          <p className="text-[11px] text-slate-400">Theo khoảng thời gian đã chọn</p>
        </div>
        <RevenueChart data={summary?.revenueTrend ?? []} loading={loading} />
      </div>
    </div>
  );
}
