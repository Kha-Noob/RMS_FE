'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface BranchDto {
  branchId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export default function BranchManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { locale } = useLanguage();

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    branchId: '',
    name: '',
    address: '',
    phone: ''
  });

  // Check role permission
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const hasAccess = user.roles.some(r => ['ADMIN', 'COOPERATOR'].includes(r));
    if (!hasAccess) {
      toast.error(locale === 'vi' ? 'Bạn không có quyền truy cập trang này!' : 'Access Denied!');
      router.push('/');
    }
  }, [user, router, locale]);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<BranchDto[]>('/api/branches/all');
      setBranches(data);
    } catch {
      toast.error(locale === 'vi' ? 'Không thể tải danh sách chi nhánh' : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (user && user.roles.some(r => ['ADMIN', 'COOPERATOR'].includes(r))) {
      fetchBranches();
    }
  }, [user, fetchBranches]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branchId.trim() || !form.name.trim() || !form.address.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập đầy đủ các trường bắt buộc!' : 'Please fill all required fields!');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/branches', form);
      toast.success(locale === 'vi' ? 'Tạo chi nhánh mới thành công!' : 'Branch created successfully!');
      setShowModal(false);
      setForm({ branchId: '', name: '', address: '', phone: '' });
      fetchBranches();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || (locale === 'vi' ? 'Tạo chi nhánh thất bại!' : 'Failed to create branch!');
      toast.error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.name.trim() || !editingBranch.address.trim()) return;

    try {
      setSubmitting(true);
      await api.put(`/api/branches/${editingBranch.branchId}`, {
        name: editingBranch.name,
        address: editingBranch.address,
        phone: editingBranch.phone
      });
      toast.success(locale === 'vi' ? 'Cập nhật chi nhánh thành công!' : 'Branch updated successfully!');
      setEditingBranch(null);
      fetchBranches();
    } catch {
      toast.error(locale === 'vi' ? 'Cập nhật thất bại!' : 'Failed to update branch');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (branch: BranchDto) => {
    try {
      await api.delete(`/api/branches/${branch.branchId}`);
      toast.success(locale === 'vi' ? 'Đã thay đổi trạng thái chi nhánh!' : 'Branch status updated!');
      fetchBranches();
    } catch {
      toast.error(locale === 'vi' ? 'Thao tác thất bại!' : 'Failed to toggle branch status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {locale === 'vi' ? 'Quản lý Chi nhánh chuỗi' : 'Chain Branch Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {locale === 'vi' ? 'Xem, thêm mới, hoặc điều chỉnh thông tin các chi nhánh của chuỗi nhà hàng.' : 'View, create, or update branches belonging to your restaurant chain.'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#25439b] hover:bg-[#1c3580] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200"
        >
          {locale === 'vi' ? '+ Tạo Chi Nhánh Mới' : '+ Add New Branch'}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex justify-center items-center shadow-sm">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-[#25439b] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs shadow-sm">
              {locale === 'vi' ? 'Chưa có chi nhánh nào được đăng ký' : 'No branches registered yet'}
            </div>
          ) : (
            branches.map((b) => (
              <div
                key={b.branchId}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{b.name}</h3>
                    <span
                      onClick={() => toggleStatus(b)}
                      className={`cursor-pointer px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border transition-all ${
                        b.isActive
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                      }`}
                    >
                      {b.isActive ? (locale === 'vi' ? 'Hoạt động' : 'Active') : (locale === 'vi' ? 'Tạm dừng' : 'Inactive')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {b.branchId}</div>
                  
                  <div className="space-y-1 pt-2">
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="text-slate-400 flex-shrink-0 mt-0.5">📍</span>
                      <span className="line-clamp-2">{b.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="text-slate-400 flex-shrink-0">📞</span>
                      <span>{b.phone || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-50">
                  <button
                    onClick={() => setEditingBranch(b)}
                    className="text-[#25439b] hover:text-[#1c3580] font-semibold text-xs transition-colors"
                  >
                    {locale === 'vi' ? 'Chỉnh sửa' : 'Edit Details'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">{locale === 'vi' ? 'Thêm chi nhánh mới' : 'Add New Branch'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Mã định danh chi nhánh (ID) *' : 'Branch ID / Code *'}</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. gg-haiphong"
                  value={form.branchId}
                  onChange={e => setForm({...form, branchId: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Tên chi nhánh *' : 'Branch Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Chi nhánh Hải Phòng"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Địa chỉ chi nhánh *' : 'Branch Address *'}</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. 21 Đường Hải Phòng, Thạch Thang, Đà Nẵng"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Số điện thoại liên hệ' : 'Contact Phone'}</label>
                <input
                  type="text"
                  placeholder="E.g. 02363555444"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="flex gap-2.5 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-500"
                >
                  {locale === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-xl font-semibold shadow-sm flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? (locale === 'vi' ? 'Đang tạo...' : 'Creating...') : (locale === 'vi' ? 'Tạo chi nhánh' : 'Create Branch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">{locale === 'vi' ? 'Chỉnh sửa thông tin chi nhánh' : 'Edit Branch Details'}</h3>
              <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Tên chi nhánh *' : 'Branch Name *'}</label>
                <input
                  type="text"
                  required
                  value={editingBranch.name}
                  onChange={e => setEditingBranch({...editingBranch, name: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Địa chỉ chi nhánh *' : 'Branch Address *'}</label>
                <input
                  type="text"
                  required
                  value={editingBranch.address}
                  onChange={e => setEditingBranch({...editingBranch, address: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Số điện thoại liên hệ' : 'Contact Phone'}</label>
                <input
                  type="text"
                  value={editingBranch.phone}
                  onChange={e => setEditingBranch({...editingBranch, phone: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="flex gap-2.5 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-500"
                >
                  {locale === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-xl font-semibold shadow-sm flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? (locale === 'vi' ? 'Đang lưu...' : 'Saving...') : (locale === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
