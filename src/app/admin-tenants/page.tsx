'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface TenantDto {
  tenantId: string;
  name: string;
  domain: string;
  isActive: boolean;
  ownerEmail: string;
  ownerName: string;
}

export default function AdminTenantsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { locale } = useLanguage();

  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    domain: '',
    ownerEmail: '',
    ownerName: '',
    ownerPassword: ''
  });

  // Check role permission
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

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<TenantDto[]>('/api/admin/tenants');
      setTenants(data);
    } catch {
      toast.error(locale === 'vi' ? 'Không thể tải danh sách khách hàng thuê' : 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (user && user.roles.includes('ADMIN')) {
      fetchTenants();
    }
  }, [user, fetchTenants]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.ownerEmail.trim() || !form.ownerName.trim() || !form.ownerPassword.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập đầy đủ các trường bắt buộc!' : 'Please fill all required fields!');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/admin/tenants', form);
      toast.success(locale === 'vi' ? 'Cấp chuỗi thuê ứng dụng thành công!' : 'Tenant provisioned successfully!');
      setShowModal(false);
      setForm({ name: '', domain: '', ownerEmail: '', ownerName: '', ownerPassword: '' });
      fetchTenants();
    } catch (err: any) {
      const errMsg = err?.response?.data || (locale === 'vi' ? 'Thao tác thất bại!' : 'Failed to provision tenant!');
      toast.error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant || !editingTenant.name.trim()) return;

    try {
      setSubmitting(true);
      await api.put(`/api/admin/tenants/${editingTenant.tenantId}`, {
        name: editingTenant.name,
        domain: editingTenant.domain
      });
      toast.success(locale === 'vi' ? 'Cập nhật thông tin thành công!' : 'Tenant updated successfully!');
      setEditingTenant(null);
      fetchTenants();
    } catch {
      toast.error(locale === 'vi' ? 'Cập nhật thất bại!' : 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (tenant: TenantDto) => {
    try {
      await api.put(`/api/admin/tenants/${tenant.tenantId}`, {
        isActive: !tenant.isActive
      });
      toast.success(locale === 'vi' ? 'Đã đổi trạng thái hoạt động!' : 'Status updated successfully!');
      fetchTenants();
    } catch {
      toast.error(locale === 'vi' ? 'Thao tác thất bại!' : 'Failed to toggle status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {locale === 'vi' ? 'Cấp quyền & Quản lý chuỗi thuê (Tenants)' : 'Tenant Provisioning & Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {locale === 'vi' ? 'Quản lý danh sách các chuỗi nhà hàng đang thuê sử dụng hệ thống RMS.' : 'Manage restaurant chains renting and using the RMS.'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#25439b] hover:bg-[#1c3580] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200"
        >
          {locale === 'vi' ? '+ Cấp Chuỗi Mới' : '+ Provision New Tenant'}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex justify-center items-center shadow-sm">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-[#25439b] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-left">{locale === 'vi' ? 'Tên chuỗi' : 'Chain Name'}</th>
                  <th className="py-4 px-6 text-left">{locale === 'vi' ? 'Mã Tenant' : 'Tenant ID'}</th>
                  <th className="py-4 px-6 text-left">{locale === 'vi' ? 'Tên miền' : 'Domain'}</th>
                  <th className="py-4 px-6 text-left">{locale === 'vi' ? 'Chủ chuỗi (Email)' : 'Owner (Email)'}</th>
                  <th className="py-4 px-6 text-center">{locale === 'vi' ? 'Trạng thái' : 'Status'}</th>
                  <th className="py-4 px-6 text-center">{locale === 'vi' ? 'Hành động' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {locale === 'vi' ? 'Chưa có chuỗi nào được cấp quyền' : 'No tenants provisioned yet'}
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.tenantId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-800">{t.name}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono">{t.tenantId}</td>
                      <td className="py-4 px-6">{t.domain || '—'}</td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-700">{t.ownerName || '—'}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{t.ownerEmail || '—'}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => toggleStatus(t)}
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide border transition-all ${
                            t.isActive
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                          }`}
                        >
                          {t.isActive ? (locale === 'vi' ? 'Hoạt động' : 'Active') : (locale === 'vi' ? 'Khóa' : 'Inactive')}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setEditingTenant(t)}
                          className="text-[#25439b] hover:text-[#1c3580] font-semibold text-xs transition-colors"
                        >
                          {locale === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">{locale === 'vi' ? 'Cấp chuỗi thuê ứng dụng mới' : 'Provision New Chain Tenant'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Tên chuỗi nhà hàng *' : 'Restaurant Chain Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Golden Gate Group"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Tên miền liên kết' : 'Linked Domain (optional)'}</label>
                <input
                  type="text"
                  placeholder="E.g. goldengate.com"
                  value={form.domain}
                  onChange={e => setForm({...form, domain: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="border-t border-dashed border-slate-100 my-4 pt-3">
                <h4 className="font-bold text-slate-700 mb-2">{locale === 'vi' ? 'Tài khoản Chủ chuỗi' : 'Chain Owner Credentials'}</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Họ và tên *' : 'Full Name *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Nguyen Van Owner"
                      value={form.ownerName}
                      onChange={e => setForm({...form, ownerName: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Email chủ chuỗi *' : 'Owner Email *'}</label>
                    <input
                      type="email"
                      required
                      placeholder="E.g. admin@goldengate.com"
                      value={form.ownerEmail}
                      onChange={e => setForm({...form, ownerEmail: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Mật khẩu quản trị *' : 'Admin Password *'}</label>
                  <input
                    type="password"
                    required
                    placeholder="E.g. Admin123!"
                    value={form.ownerPassword}
                    onChange={e => setForm({...form, ownerPassword: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                  />
                </div>
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
                  {submitting ? (locale === 'vi' ? 'Đang tạo...' : 'Creating...') : (locale === 'vi' ? 'Tạo chuỗi' : 'Create Tenant')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">{locale === 'vi' ? 'Chỉnh sửa thông tin chuỗi' : 'Edit Chain Details'}</h3>
              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Tên chuỗi nhà hàng *' : 'Restaurant Chain Name *'}</label>
                <input
                  type="text"
                  required
                  value={editingTenant.name}
                  onChange={e => setEditingTenant({...editingTenant, name: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-500">{locale === 'vi' ? 'Tên miền liên kết' : 'Linked Domain'}</label>
                <input
                  type="text"
                  value={editingTenant.domain}
                  onChange={e => setEditingTenant({...editingTenant, domain: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="flex gap-2.5 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
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
