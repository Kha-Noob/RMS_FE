'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Percent, 
  DollarSign, 
  Ticket, 
  Calendar, 
  Search, 
  Filter, 
  ArrowUpDown
} from 'lucide-react';

interface LedgerItem {
  id: number;
  title: string;
  restaurantName: string;
  isExpired: boolean;
  bookingDeadline: string | null;
  ticketPrice: number;
  totalTickets: number;
  totalRevenue: number;
  commissionRate: number;
  commissionAmount: number;
}

interface KPIStats {
  totalCommission: number;
  totalRevenue: number;
  totalTickets: number;
  activeEventsCount: number;
  expiredEventsCount: number;
}

export default function AdminCommissionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { locale } = useLanguage();

  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [kpis, setKpis] = useState<KPIStats>({
    totalCommission: 0,
    totalRevenue: 0,
    totalTickets: 0,
    activeEventsCount: 0,
    expiredEventsCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [sortField, setSortField] = useState<keyof LedgerItem>('commissionAmount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Authorization Check
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const isAdmin = user.roles.includes('ADMIN');
    if (!isAdmin) {
      toast.error(locale === 'vi' ? 'Bạn không có quyền truy cập trang này!' : 'Access Denied!');
      router.push('/');
    }
  }, [user, router, locale]);

  const fetchCommissionReport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ kpis: KPIStats; ledger: LedgerItem[] }>('/api/dashboard/admin/commissions');
      if (data) {
        setLedger(data.ledger || []);
        setKpis(data.kpis || {
          totalCommission: 0,
          totalRevenue: 0,
          totalTickets: 0,
          activeEventsCount: 0,
          expiredEventsCount: 0
        });
      }
    } catch (err) {
      toast.error(locale === 'vi' ? 'Không thể tải báo cáo đối soát hoa hồng' : 'Failed to load commission report');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (user && user.roles.includes('ADMIN')) {
      fetchCommissionReport();
    }
  }, [user, fetchCommissionReport]);

  const handleSort = (field: keyof LedgerItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered & Sorted Ledger
  const processedLedger = useMemo(() => {
    let result = [...ledger];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.restaurantName.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      result = result.filter(item => !item.isExpired);
    } else if (statusFilter === 'EXPIRED') {
      result = result.filter(item => item.isExpired);
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      // Numeric sort
      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    return result;
  }, [ledger, searchQuery, statusFilter, sortField, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full w-max">
            {locale === 'vi' ? 'Hệ thống đối soát & Phân tích' : 'Platform Settled & Analytics'}
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {locale === 'vi' ? 'Báo Cáo Hoa Hồng Hệ Thống' : 'System Commission Report'}
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            {locale === 'vi' 
              ? 'Tổng hợp phí hoa hồng tích lũy từ các sự kiện ẩm thực/workshop của các chuỗi và đối tác trên toàn hệ thống.' 
              : 'Aggregated platform commission fees accrued from culinary events and workshops across all partner chains.'}
          </p>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-450">{locale === 'vi' ? 'Đang chuẩn bị báo cáo tài chính...' : 'Preparing financial statement...'}</span>
          </div>
        ) : (
          <>
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Commission */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Percent className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {locale === 'vi' ? 'Tổng hoa hồng nhận' : 'Net Commission'}
                  </span>
                  <span className="text-xl font-black text-slate-800 mt-1 block">
                    {kpis.totalCommission.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">
                    {locale === 'vi' ? 'Đã tích lũy thành công' : 'Accrued successfully'}
                  </span>
                </div>
              </div>

              {/* Total Event Revenue */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {locale === 'vi' ? 'Doanh số bán vé' : 'Gross Event Ticket Sales'}
                  </span>
                  <span className="text-xl font-black text-slate-800 mt-1 block">
                    {kpis.totalRevenue.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                    {locale === 'vi' ? 'Từ các sự kiện có bán vé' : 'From ticketed events'}
                  </span>
                </div>
              </div>

              {/* Tickets Sold */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                  <Ticket className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {locale === 'vi' ? 'Vé đã bán' : 'Total Tickets Sold'}
                  </span>
                  <span className="text-xl font-black text-slate-800 mt-1 block">
                    {kpis.totalTickets} {locale === 'vi' ? 'vé' : 'tickets'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                    {locale === 'vi' ? 'Đã được đặt & thanh toán' : 'Booked & prepaid'}
                  </span>
                </div>
              </div>

              {/* Events Ratio */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="h-12 w-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {locale === 'vi' ? 'Trạng thái sự kiện' : 'Events Settled Ratio'}
                  </span>
                  <span className="text-xl font-black text-slate-800 mt-1 block">
                    {kpis.expiredEventsCount} / {kpis.activeEventsCount + kpis.expiredEventsCount}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                    {locale === 'vi' 
                      ? `${kpis.activeEventsCount} sự kiện đang mở đăng ký` 
                      : `${kpis.activeEventsCount} events open for booking`}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={locale === 'vi' ? 'Tìm sự kiện, nhà hàng...' : 'Search event, cooperator...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50 font-bold text-slate-650"
                >
                  <option value="ALL">{locale === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}</option>
                  <option value="ACTIVE">{locale === 'vi' ? 'Đang hoạt động (Còn hạn)' : 'Active (Open Booking)'}</option>
                  <option value="EXPIRED">{locale === 'vi' ? 'Đã chốt (Hết hạn)' : 'Settled (Expired)'}</option>
                </select>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 font-extrabold text-slate-500 select-none">
                      <th className="p-4">{locale === 'vi' ? 'Sự Kiện' : 'Event'}</th>
                      <th className="p-4">{locale === 'vi' ? 'Đối Tác / Chuỗi' : 'Cooperator'}</th>
                      <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('isExpired')}>
                        <span className="flex items-center gap-1">
                          {locale === 'vi' ? 'Trạng Thái' : 'Status'}
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </span>
                      </th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('ticketPrice')}>
                        <span className="flex items-center justify-end gap-1">
                          {locale === 'vi' ? 'Giá Vé' : 'Ticket Price'}
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </span>
                      </th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('totalTickets')}>
                        <span className="flex items-center justify-end gap-1">
                          {locale === 'vi' ? 'Vé Đã Bán' : 'Tickets Sold'}
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </span>
                      </th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('totalRevenue')}>
                        <span className="flex items-center justify-end gap-1">
                          {locale === 'vi' ? 'Doanh Thu' : 'Revenue'}
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </span>
                      </th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('commissionRate')}>
                        <span className="flex items-center justify-end gap-1">
                          {locale === 'vi' ? 'Tỷ Lệ' : 'Rate'}
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </span>
                      </th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100 font-black text-indigo-650 bg-indigo-50/20" onClick={() => handleSort('commissionAmount')}>
                        <span className="flex items-center justify-end gap-1">
                          {locale === 'vi' ? 'Phí Hoa Hồng' : 'Commission Fee'}
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedLedger.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                          {locale === 'vi' ? 'Không tìm thấy dữ liệu đối soát nào phù hợp.' : 'No commission records found matching filters.'}
                        </td>
                      </tr>
                    ) : (
                      processedLedger.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-800 max-w-[220px] truncate" title={item.title}>
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                              <span>
                                {item.bookingDeadline 
                                  ? (locale === 'vi' ? 'Hạn: ' : 'Deadline: ') + new Date(item.bookingDeadline).toLocaleString('vi-VN')
                                  : (locale === 'vi' ? 'Không có hạn' : 'No deadline')}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-600">
                            {item.restaurantName}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              item.isExpired 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {item.isExpired ? (locale === 'vi' ? 'Đã Chốt' : 'Settled') : (locale === 'vi' ? 'Đang Nhận' : 'Active')}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-700">
                            {item.ticketPrice > 0 
                              ? item.ticketPrice.toLocaleString('vi-VN') + ' đ' 
                              : (locale === 'vi' ? 'Miễn phí' : 'Free')}
                          </td>
                          <td className="p-4 text-right font-extrabold text-slate-800">
                            {item.totalTickets}
                          </td>
                          <td className="p-4 text-right font-bold text-slate-750">
                            {item.totalRevenue.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-4 text-right font-bold text-slate-500">
                            {item.commissionRate}%
                          </td>
                          <td className="p-4 text-right font-black text-indigo-700 bg-indigo-50/20 text-xs">
                            {item.commissionAmount.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
