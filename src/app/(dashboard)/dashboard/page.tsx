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
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + 'B';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return amount.toFixed(0);
}

function formatFullVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

// ── SVG Area Chart with Gradients ───────────────────────────────────────────
function RevenueChart({ data, loading }: { data: { date: string; revenue: number }[] | undefined | null; loading: boolean }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; revenue: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (loading) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Đang xử lý biểu đồ...</span>
      </div>
    );
  }

  const validData = (Array.isArray(data) ? data : [])
    .filter(d => d && typeof d.date === 'string' && d.date.length > 0 && typeof d.revenue === 'number' && isFinite(d.revenue));

  if (validData.length === 0) {
    return <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm font-medium">Chưa có dữ liệu doanh thu</div>;
  }

  const W = 800, H = 280, PAD = { top: 20, right: 20, bottom: 35, left: 65 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxRev = Math.max(...validData.map(d => d.revenue), 1);
  const paddedMax = maxRev * 1.15;

  const getX = (idx: number) => PAD.left + (idx / Math.max(1, validData.length - 1)) * chartW;
  const getY = (val: number) => PAD.top + chartH - (val / paddedMax) * chartH;

  // Path data generators
  let areaPath = '';
  let linePath = '';

  if (validData.length > 1) {
    linePath = `M ${getX(0)} ${getY(validData[0].revenue)}`;
    areaPath = `M ${getX(0)} ${PAD.top + chartH} L ${getX(0)} ${getY(validData[0].revenue)}`;
    
    for (let i = 1; i < validData.length; i++) {
      const cx = getX(i);
      const cy = getY(validData[i].revenue);
      linePath += ` L ${cx} ${cy}`;
      areaPath += ` L ${cx} ${cy}`;
    }
    
    areaPath += ` L ${getX(validData.length - 1)} ${PAD.top + chartH} Z`;
  } else if (validData.length === 1) {
    const cx = PAD.left + chartW / 2;
    const cy = getY(validData[0].revenue);
    linePath = `M ${PAD.left} ${cy} L ${PAD.left + chartW} ${cy}`;
    areaPath = `M ${PAD.left} ${PAD.top + chartH} L ${PAD.left} ${cy} L ${PAD.left + chartW} ${cy} L ${PAD.left + chartW} ${PAD.top + chartH} Z`;
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    
    let closestIdx = 0;
    let minDist = Infinity;
    
    validData.forEach((d, i) => {
      const dist = Math.abs(getX(i) - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });

    const d = validData[closestIdx];
    setTooltip({
      x: getX(closestIdx),
      y: getY(d.revenue),
      date: d.date,
      revenue: d.revenue,
    });
  };

  const yTicks = 4;
  const tickCount = Math.min(validData.length, 8);
  const tickStep = Math.max(1, Math.floor(validData.length / tickCount));

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Horizontal gridlines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const val = (paddedMax / yTicks) * i;
          const y = getY(val);
          return (
            <g key={i} className="transition-all duration-300">
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={PAD.left - 12} y={y + 4} textAnchor="end" className="fill-slate-400 font-semibold" fontSize="10">{formatVND(val)}</text>
            </g>
          );
        })}

        {/* Areas & Lines */}
        {validData.length > 0 && (
          <>
            <path d={areaPath} fill="url(#chartAreaGrad)" />
            <path d={linePath} fill="none" stroke="url(#chartLineGrad)" strokeWidth="3" filter="url(#shadow)" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* X Axis Labels */}
        {validData.map((d, i) => {
          if (i % tickStep !== 0 && i !== validData.length - 1) return null;
          return (
            <text key={i} x={getX(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 font-medium" fontSize="9">
              {d.date}
            </text>
          );
        })}

        {/* Interactive Tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + chartH} stroke="#a5b4fc" strokeWidth="1.5" strokeDasharray="4,4" />
            <circle cx={tooltip.x} cy={tooltip.y} r="6" fill="#4f46e5" stroke="#ffffff" strokeWidth="2.5" />
            <g transform={`translate(${tooltip.x + 15 > W - 140 ? tooltip.x - 155 : tooltip.x + 15}, ${tooltip.y - 25})`}>
              <rect width="140" height="42" rx="8" fill="#1e293b" opacity="0.95" />
              <text x="12" y="18" fill="#94a3b8" fontSize="9" fontWeight="600">{tooltip.date}</text>
              <text x="12" y="32" fill="#ffffff" fontSize="11" fontWeight="700">{formatFullVND(tooltip.revenue)}</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Glassmorphic KPI Card ───────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string;
  accentClass: string;
  iconBg: string;
  icon: React.ReactNode;
}
function KpiCard({ label, value, accentClass, iconBg, icon }: KpiProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${accentClass}`} />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-[13px] text-slate-400 font-bold tracking-wide uppercase">{label}</p>
          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── AI Summary Panel ────────────────────────────────────────────────────────
function AiSummaryPanel({ summary }: { summary: DashboardSummary | null }) {
  const [aiText, setAiText] = useState('Đang kết nối với trợ lý phân tích...');
  const [loading, setLoading] = useState(false);

  const loadAiReport = useCallback(async () => {
    if (!summary) return;
    setLoading(true);
    try {
      const q = `Hãy viết một đoạn tóm tắt ngắn khoảng 3 câu phân tích tình hình kinh doanh của chi nhánh: doanh thu đạt ${summary.totalRevenue} VND, lượt khách là ${summary.customerVisits}, tỷ lệ đặt bàn thành công là ${summary.bookingSuccessRate}%, đánh giá khách hàng đạt ${summary.averageCustomerRating}/5. Chỉ ra điểm nổi bật và đề xuất hành động.`;
      const res = await api.post<{ reply: string }>(`/api/analytics/ai-chat?query=${encodeURIComponent(q)}`);
      setAiText(res.reply || 'Không có phản hồi từ trợ lý.');
    } catch {
      setAiText('Hệ thống AI phân tích đang bận. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [summary]);

  useEffect(() => {
    if (summary) loadAiReport();
  }, [summary, loadAiReport]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between h-full min-h-[220px]">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-slate-800">Trợ lý Phân tích AI</h2>
        </div>
        <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
          {loading ? (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              Đang phân tích số liệu...
            </span>
          ) : aiText}
        </p>
      </div>
      {!loading && (
        <button
          onClick={loadAiReport}
          className="mt-4 w-full py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/60 text-slate-500 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1"
        >
          🔄 Làm mới tóm tắt
        </button>
      )}
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────
const IconUsers = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconRevenue = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconBooking = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>;
const IconStar = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// ── Main Dashboard Component ────────────────────────────────────────────────
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 lg:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight">Chào quay lại, {user?.name || 'Quản lý'} 👋</h1>
            <p className="text-indigo-200/80 text-sm font-medium">
              Đang quản lý: <strong className="text-white">{summary?.branchName || 'Tất cả chi nhánh'}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 px-2">
              <span className="text-xs text-indigo-200 font-bold uppercase">Từ</span>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              />
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-1.5 px-2">
              <span className="text-xs text-indigo-200 font-bold uppercase">Đến</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={fetchDashboard}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-extrabold shadow-md transition-colors"
            >
              Xem số liệu
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Lượt khách ghé thăm"
          value={String(summary?.customerVisits ?? 0)}
          accentClass="bg-gradient-to-b from-indigo-500 to-indigo-600"
          iconBg="bg-gradient-to-tr from-indigo-500 to-indigo-600"
          icon={<IconUsers />}
        />
        <KpiCard
          label="Tổng doanh thu"
          value={formatFullVND(summary?.totalRevenue ?? 0)}
          accentClass="bg-gradient-to-b from-emerald-500 to-emerald-600"
          iconBg="bg-gradient-to-tr from-emerald-500 to-emerald-600"
          icon={<IconRevenue />}
        />
        <KpiCard
          label="Tỷ lệ đặt bàn thành công"
          value={`${summary?.bookingSuccessRate ?? 0}%`}
          accentClass="bg-gradient-to-b from-amber-500 to-amber-600"
          iconBg="bg-gradient-to-tr from-amber-500 to-amber-600"
          icon={<IconBooking />}
        />
        <KpiCard
          label="Đánh giá khách hàng"
          value={`${summary?.averageCustomerRating ?? 0} / 5`}
          accentClass="bg-gradient-to-b from-rose-500 to-rose-600"
          iconBg="bg-gradient-to-tr from-rose-500 to-rose-600"
          icon={<IconStar />}
        />
      </div>

      {/* Analytics Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Revenue Trend */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">Biểu đồ xu hướng doanh thu</h2>
            <p className="text-[11px] text-slate-400 font-semibold">Theo khoảng thời gian đã chọn</p>
          </div>
          <div className="w-full">
            <RevenueChart data={summary?.revenueTrend ?? []} loading={loading} />
          </div>
        </div>

        {/* Right 1/3: AI Report summary */}
        <div className="flex flex-col gap-6">
          <AiSummaryPanel summary={summary} />

          {/* Mini Source breakdown panel */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Phân kênh đơn hàng</h2>
            <div className="space-y-3">
              {/* Online Orders */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Trực tuyến (Online)</span>
                  <span>{summary?.onlineOrderCount ?? 0} đơn</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                    style={{
                      width: `${
                        (summary?.onlineOrderCount ?? 0) + (summary?.offlineOrderCount ?? 0) > 0
                          ? ((summary?.onlineOrderCount ?? 0) / ((summary?.onlineOrderCount ?? 0) + (summary?.offlineOrderCount ?? 0))) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Offline Orders */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Trực tiếp (Offline)</span>
                  <span>{summary?.offlineOrderCount ?? 0} đơn</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-slate-400 to-slate-500 transition-all duration-500"
                    style={{
                      width: `${
                        (summary?.onlineOrderCount ?? 0) + (summary?.offlineOrderCount ?? 0) > 0
                          ? ((summary?.offlineOrderCount ?? 0) / ((summary?.onlineOrderCount ?? 0) + (summary?.offlineOrderCount ?? 0))) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

