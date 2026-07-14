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
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const validData = (Array.isArray(data) ? data : [])
    .filter(d => d && typeof d.date === 'string' && d.date.length > 0 && typeof d.revenue === 'number' && isFinite(d.revenue));

  if (validData.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v16.5M21 19.5H3.75M6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0-6h.008v.008H6.75V9zm0-3h.008v.008H6.75V6zm3 6h.008v.008h-.008V12zm0 3h.008v.008h-.008V15zm0-6h.008v.008h-.008V9zm0-3h.008v.008h-.008V6zm3 6h.008v.008h-.008V12zm0 3h.008v.008h-.008V15zm0-6h.008v.008h-.008V9zm0-3h.008v.008h-.008V6zm3 6h.008v.008h-.008V12zm0 3h.008v.008h-.008V15zm0-6h.008v.008h-.008V9zm0-3h.008v.008h-.008V6zm3 6h.008v.008h-.008V12zm0 3h.008v.008h-.008V15zm0-6h.008v.008h-.008V9zm0-3h.008v.008h-.008V6zm3 6h.008v.008h-.008V12zm0 3h.008v.008h-.008V15zm0-6h.008v.008h-.008V9zm0-3h.008v.008h-.008V6z" />
        </svg>
        <span>Không có dữ liệu doanh thu</span>
      </div>
    );
  }

  const W = 800, H = 280, PAD = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxRev = Math.max(...validData.map(d => d.revenue), 1);
  const paddedMax = maxRev * 1.15;

  const barGap = 6;
  const barW = Math.max(6, (chartW - barGap * (validData.length - 1)) / validData.length);

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (paddedMax / yTicks) * i);

  const tickCount = Math.min(validData.length, 10);
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
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {yTickValues.map((v, i) => {
          const y = PAD.top + chartH - (v / paddedMax) * chartH;
          return (
            <g key={i} className="opacity-70">
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <text x={PAD.left - 12} y={y + 4} textAnchor="end" className="fill-slate-400 font-medium" fontSize="10">{formatVND(v)}</text>
            </g>
          );
        })}

        {validData.map((d, i) => {
          const x = PAD.left + i * (barW + barGap);
          const h = (d.revenue / paddedMax) * chartH;
          const y = PAD.top + chartH - h;
          const isHovered = tooltip && tooltip.date === d.date;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={Math.min(4, barW / 3)}
              fill={isHovered ? 'url(#barGradHover)' : 'url(#barGrad)'}
              className="transition-all duration-200"
            />
          );
        })}

        {validData.map((d, i) => {
          if (i % tickStep !== 0 && i !== validData.length - 1) return null;
          const x = PAD.left + i * (barW + barGap) + barW / 2;
          return <text key={i} x={x} y={H - 12} textAnchor="middle" className="fill-slate-400 font-medium" fontSize="9">{d.date}</text>;
        })}

        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + chartH} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#4f46e5" stroke="white" strokeWidth="2" className="shadow-sm" />
            <g transform={`translate(${tooltip.x > W - 160 ? tooltip.x - 150 : tooltip.x + 10}, ${tooltip.y > H - 80 ? tooltip.y - 65 : tooltip.y + 10})`}>
              <rect width="140" height="52" rx="8" fill="#1e293b" opacity="0.95" className="shadow-xl" />
              <text x="12" y="20" fill="#94a3b8" fontSize="10" fontWeight="500">{tooltip.date}</text>
              <text x="12" y="38" fill="white" fontSize="12" fontWeight="600">{formatFullVND(tooltip.revenue)}</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, gradient }: { label: string; value: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className="group relative overflow-hidden px-5 py-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider leading-none">{label}</p>
          <p className="text-xl font-bold text-slate-800 mt-2 tracking-tight truncate leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────
const IconUsers = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconRevenue = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconBooking = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>;
const IconStar = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconOnline = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconOffline = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

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
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
            Bảng điều khiển
          </h1>
          <p className="text-xs text-indigo-200/70 mt-1 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {summary?.branchName || 'Đang tải chi nhánh...'}
            <span className="text-white/20">|</span>
            Xin chào, {user?.name}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-200/90">Từ</span>
            <input 
              type="date" 
              value={startDate} 
              max={endDate} 
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950/40 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-200/90">Đến</span>
            <input 
              type="date" 
              value={endDate} 
              min={startDate} 
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950/40 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
            />
          </div>
          <button 
            onClick={fetchDashboard} 
            className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white rounded-lg shadow-sm transition-all"
          >
            Lọc báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Chỉ số kinh doanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Lượt khách" value={String(summary?.customerVisits ?? 0)} icon={<IconUsers />} gradient="from-indigo-500 to-blue-600" />
          <KpiCard label="Tổng doanh thu" value={formatFullVND(summary?.totalRevenue ?? 0)} icon={<IconRevenue />} gradient="from-emerald-500 to-teal-600" />
          <KpiCard label="Duyệt đặt bàn" value={`${summary?.bookingSuccessRate ?? 0}%`} icon={<IconBooking />} gradient="from-purple-500 to-pink-600" />
          <KpiCard label="Đánh giá TB" value={`${summary?.averageCustomerRating ?? 0} ★`} icon={<IconStar />} gradient="from-amber-400 to-orange-500" />
        </div>
      </div>

      {/* KPI Cards - Row 2 */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Đơn hàng & Đặt bàn</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Đặt bàn Online" value={String(summary?.onlineBookingCount ?? 0)} icon={<IconOnline />} gradient="from-sky-400 to-blue-500" />
          <KpiCard label="Đặt bàn Offline" value={String(summary?.offlineBookingCount ?? 0)} icon={<IconOffline />} gradient="from-slate-500 to-slate-700" />
          <KpiCard label="Đơn Online" value={String(summary?.onlineOrderCount ?? 0)} icon={<IconOnline />} gradient="from-indigo-400 to-indigo-600" />
          <KpiCard label="Đơn Offline" value={String(summary?.offlineOrderCount ?? 0)} icon={<IconOffline />} gradient="from-slate-500 to-slate-700" />
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Biểu đồ doanh thu</h2>
            <p className="text-xs text-slate-400 mt-1">Trực quan doanh số theo dòng thời gian đã chọn</p>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            VND - Việt Nam Đồng
          </span>
        </div>
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <RevenueChart data={summary?.revenueTrend ?? []} loading={loading} />
        </div>
      </div>
    </div>
  );
}
