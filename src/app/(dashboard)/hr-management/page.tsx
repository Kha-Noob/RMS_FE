'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { Employee, LeaveRequest, ForgotClockRequest, ShiftTemplate } from '@/types';

type Tab = 'employees' | 'leave' | 'forgot-clock' | 'shifts';

export default function HRManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('employees');

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Quản trị nhân sự (HR)</h1>
        <p className="text-xs text-slate-400 mt-1">Quản lý danh sách nhân sự, duyệt phép, giải trình chấm công và thiết lập ca làm việc</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/40 overflow-x-auto">
        {([
          { key: 'employees', label: 'Nhân viên' },
          { key: 'leave', label: 'Đơn xin nghỉ' },
          { key: 'forgot-clock', label: 'Quên chấm công' },
          { key: 'shifts', label: 'Ca làm việc mẫu' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'employees' && <EmployeesSection />}
      {activeTab === 'leave' && <LeaveSection />}
      {activeTab === 'forgot-clock' && <ForgotClockSection />}
      {activeTab === 'shifts' && <ShiftsSection />}
    </div>
  );
}

// ─── Reusable Styles ────────────────────────────────────────────────────────
const inputClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder-slate-400';
const selectClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all';
const labelClass = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1';
const btnPrimary = 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-950/10 transition-all disabled:opacity-50';
const btnDanger = 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all';
const btnSuccess = 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all';
const tableTh = 'px-4 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/70 border-b border-slate-100';
const tableTd = 'px-4 py-3.5 text-sm text-slate-600 font-medium';
const tableCardCls = 'bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm';

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
      {status}
    </span>
  );
}

/* ─── Employees Section ─── */
function EmployeesSection() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', title: '',
    hireDate: '', baseSalary: '', salaryType: 'MONTHLY', branchId: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Employee[]>('/api/hr/employees');
      setEmployees(data);
    } catch {
      toast.error('Không tải được danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', department: '', title: '', hireDate: '', baseSalary: '', salaryType: 'MONTHLY', branchId: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (emp: Employee) => {
    setForm({
      name: emp.user?.name || '',
      email: emp.user?.email || '',
      password: '',
      department: emp.department || '',
      title: emp.title || '',
      hireDate: emp.hireDate?.split('T')[0] || '',
      baseSalary: String(emp.baseSalary || ''),
      salaryType: emp.salaryType || 'MONTHLY',
      branchId: emp.branch?.branchId || '',
    });
    setEditingId(emp.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = {
        name: form.name,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
        department: form.department,
        title: form.title,
        hireDate: form.hireDate,
        baseSalary: Number(form.baseSalary),
        salaryType: form.salaryType,
        branchId: form.branchId || undefined,
      };

      if (editingId) {
        await api.post('/api/hr/employees/update', { id: editingId, ...body });
        toast.success('Đã cập nhật thông tin nhân viên');
      } else {
        await api.post('/api/hr/employees/add', body);
        toast.success('Đã thêm nhân viên mới thành công');
      }
      resetForm();
      fetchEmployees();
    } catch {
      toast.error(editingId ? 'Cập nhật thất bại' : 'Thêm nhân viên thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này khỏi hệ thống?')) return;
    try {
      await api.post(`/api/hr/employees/delete/${id}`);
      toast.success('Đã xóa nhân viên');
      fetchEmployees();
    } catch {
      toast.error('Xóa nhân viên thất bại');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-700">Danh sách nhân viên</h2>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className={btnPrimary}>
            + Thêm nhân viên
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">{editingId ? 'Sửa thông tin nhân viên' : 'Khai báo nhân viên mới'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Họ và tên *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required placeholder="Ví dụ: Nguyễn Văn A" />
            </div>
            <div>
              <label className={labelClass}>Email đăng nhập *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} required placeholder="email@nhahang.com" />
            </div>
            <div>
              <label className={labelClass}>{editingId ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputClass} required={!editingId} placeholder="Tối thiểu 6 ký tự" />
            </div>
            <div>
              <label className={labelClass}>Phòng ban / Bộ phận</label>
              <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className={inputClass} placeholder="Ví dụ: Bếp, Phục vụ" />
            </div>
            <div>
              <label className={labelClass}>Chức danh / Vị trí</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Ví dụ: Tổ trưởng, Phụ bếp" />
            </div>
            <div>
              <label className={labelClass}>Ngày vào làm</label>
              <input type="date" value={form.hireDate} onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Mức lương cơ bản (VND)</label>
              <input type="number" value={form.baseSalary} onChange={e => setForm(p => ({ ...p, baseSalary: e.target.value }))} className={inputClass} placeholder="Ví dụ: 7000000" />
            </div>
            <div>
              <label className={labelClass}>Hình thức tính lương</label>
              <select value={form.salaryType} onChange={e => setForm(p => ({ ...p, salaryType: e.target.value }))} className={selectClass}>
                <option value="MONTHLY">Theo tháng (Monthly)</option>
                <option value="DAILY">Theo ngày (Daily)</option>
                <option value="HOURLY">Theo giờ (Hourly)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Chi nhánh làm việc</label>
              <input type="text" value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))} className={inputClass} placeholder="Mã chi nhánh (ví dụ: BR001)" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2 border-t border-slate-100">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button type="button" onClick={resetForm} className={btnSecondary}>
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={tableCardCls}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-16">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">Đang tải danh sách nhân viên...</span>
          </div>
        ) : employees.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-16 font-medium">Chưa có nhân viên nào trong hệ thống.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableTh}>Họ và tên</th>
                  <th className={tableTh}>Email</th>
                  <th className={tableTh}>Bộ phận</th>
                  <th className={tableTh}>Chức danh</th>
                  <th className={tableTh}>Chi nhánh</th>
                  <th className={tableTh}>Trạng thái</th>
                  <th className={tableTh}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className={tableTd}>{emp.user?.name || '—'}</td>
                    <td className={tableTd}>{emp.user?.email || '—'}</td>
                    <td className={tableTd}>{emp.department || '—'}</td>
                    <td className={tableTd}>{emp.title || '—'}</td>
                    <td className={tableTd}>{emp.branch?.name || '—'}</td>
                    <td className={tableTd}>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${emp.user?.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                        {emp.user?.isActive ? 'Đang làm' : 'Đã nghỉ'}
                      </span>
                    </td>
                    <td className={tableTd}>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(emp)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">Sửa</button>
                        <button onClick={() => handleDelete(emp.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Leave Requests Section ─── */
function LeaveSection() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<LeaveRequest[]>('/api/hr/leave-requests');
      setRequests(data);
    } catch {
      toast.error('Không tải được danh sách đơn nghỉ phép');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      await api.post(`/api/hr/leave-requests/approve/${id}`);
      toast.success('Đã duyệt đơn nghỉ phép');
      fetchRequests();
    } catch {
      toast.error('Phê duyệt đơn thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setProcessingId(id);
      await api.post(`/api/hr/leave-requests/reject/${id}`);
      toast.success('Đã từ chối đơn nghỉ phép');
      fetchRequests();
    } catch {
      toast.error('Từ chối đơn thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3">Đơn chờ duyệt</h2>
        <div className={tableCardCls}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-sm">Đang tải đơn...</span>
            </div>
          ) : pending.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12 font-medium">Không có đơn xin nghỉ nào cần duyệt.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={tableTh}>Nhân viên</th>
                    <th className={tableTh}>Loại phép</th>
                    <th className={tableTh}>Bắt đầu</th>
                    <th className={tableTh}>Kết thúc</th>
                    <th className={tableTh}>Lý do xin nghỉ</th>
                    <th className={tableTh}>Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pending.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className={tableTd}><span className="font-bold text-slate-800">{r.employee?.user?.name || '—'}</span></td>
                      <td className={tableTd}><span className="font-semibold text-slate-700 text-xs">{r.leaveType}</span></td>
                      <td className={tableTd}>{new Date(r.startDate).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}>{new Date(r.endDate).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}>{r.reason}</td>
                      <td className={tableTd}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={processingId === r.id}
                            className={btnSuccess}
                          >
                            {processingId === r.id ? '...' : 'Duyệt'}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={processingId === r.id}
                            className={btnDanger}
                          >
                            {processingId === r.id ? '...' : 'Từ chối'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-3">Lịch sử đơn đã duyệt</h2>
          <div className={tableCardCls}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={tableTh}>Nhân viên</th>
                    <th className={tableTh}>Loại phép</th>
                    <th className={tableTh}>Bắt đầu</th>
                    <th className={tableTh}>Kết thúc</th>
                    <th className={tableTh}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processed.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className={tableTd}>{r.employee?.user?.name || '—'}</td>
                      <td className={tableTd}><span className="font-semibold text-slate-700 text-xs">{r.leaveType}</span></td>
                      <td className={tableTd}>{new Date(r.startDate).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}>{new Date(r.endDate).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}>{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Forgot Clock Section ─── */
function ForgotClockSection() {
  const [requests, setRequests] = useState<ForgotClockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ForgotClockRequest[]>('/api/hr/forgot-clock');
      setRequests(data);
    } catch {
      toast.error('Không tải được yêu cầu quên chấm công');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      await api.post(`/api/hr/forgot-clock/approve/${id}`);
      toast.success('Đã duyệt bổ sung giờ chấm công');
      fetchRequests();
    } catch {
      toast.error('Duyệt bổ sung thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setProcessingId(id);
      await api.post(`/api/hr/forgot-clock/reject/${id}`);
      toast.success('Đã từ chối đơn bổ sung chấm công');
      fetchRequests();
    } catch {
      toast.error('Từ chối đơn thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3">Đơn chờ duyệt</h2>
        <div className={tableCardCls}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-sm">Đang tải đơn...</span>
            </div>
          ) : pending.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12 font-medium">Không có yêu cầu giải trình nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={tableTh}>Nhân viên</th>
                    <th className={tableTh}>Ngày quên</th>
                    <th className={tableTh}>Loại Check</th>
                    <th className={tableTh}>Giờ đề xuất</th>
                    <th className={tableTh}>Lý do giải trình</th>
                    <th className={tableTh}>Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pending.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className={tableTd}><span className="font-bold text-slate-800">{r.employee?.user?.name || '—'}</span></td>
                      <td className={tableTd}>{new Date(r.date).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}><span className="font-bold text-slate-700 text-xs">{r.clockType}</span></td>
                      <td className={tableTd}>{r.timeProposed}</td>
                      <td className={tableTd}>{r.reason}</td>
                      <td className={tableTd}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={processingId === r.id}
                            className={btnSuccess}
                          >
                            {processingId === r.id ? '...' : 'Duyệt'}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={processingId === r.id}
                            className={btnDanger}
                          >
                            {processingId === r.id ? '...' : 'Từ chối'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-3">Lịch sử giải trình</h2>
          <div className={tableCardCls}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={tableTh}>Nhân viên</th>
                    <th className={tableTh}>Ngày quên</th>
                    <th className={tableTh}>Loại Check</th>
                    <th className={tableTh}>Giờ đề xuất</th>
                    <th className={tableTh}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processed.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className={tableTd}>{r.employee?.user?.name || '—'}</td>
                      <td className={tableTd}>{new Date(r.date).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}><span className="font-bold text-slate-700 text-xs">{r.clockType}</span></td>
                      <td className={tableTd}>{r.timeProposed}</td>
                      <td className={tableTd}>{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shift Templates Section ─── */
function ShiftsSection() {
  const [shifts, setShifts] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', startTime: '', endTime: '', durationHours: '' });
  const [saving, setSaving] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ShiftTemplate[]>('/api/hr/shifts');
      setShifts(data);
    } catch {
      toast.error('Không tải được danh sách ca trực mẫu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const resetForm = () => {
    setForm({ name: '', startTime: '', endTime: '', durationHours: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (shift: ShiftTemplate) => {
    setForm({
      name: shift.name,
      startTime: shift.startTime || '',
      endTime: shift.endTime || '',
      durationHours: String(shift.durationHours || ''),
    });
    setEditingId(shift.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        durationHours: Number(form.durationHours) || 0,
      };
      await api.post('/api/hr/shifts/save', body);
      toast.success(editingId ? 'Đã cập nhật ca trực mẫu' : 'Đã lưu ca trực mẫu mới');
      resetForm();
      fetchShifts();
    } catch {
      toast.error('Lưu ca trực mẫu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa ca trực mẫu này?')) return;
    try {
      await api.delete(`/api/hr/shifts/${id}`);
      toast.success('Đã xóa ca trực mẫu');
      fetchShifts();
    } catch {
      toast.error('Xóa ca trực thất bại');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-700">Thiết lập ca làm việc</h2>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className={btnPrimary}>
            + Thêm ca trực mẫu
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">{editingId ? 'Cập nhật ca trực mẫu' : 'Thêm ca trực mẫu'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Tên ca trực *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required placeholder="Ví dụ: Ca sáng (Morning)" />
            </div>
            <div>
              <label className={labelClass}>Giờ bắt đầu *</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Giờ kết thúc *</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Thời lượng định mức (giờ)</label>
              <input type="number" step="0.5" value={form.durationHours} onChange={e => setForm(p => ({ ...p, durationHours: e.target.value }))} className={inputClass} placeholder="Ví dụ: 8" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-3 pt-2 border-t border-slate-100">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật ca' : 'Lưu ca trực'}
              </button>
              <button type="button" onClick={resetForm} className={btnSecondary}>
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={tableCardCls}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">Đang tải ca làm việc...</span>
          </div>
        ) : shifts.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12 font-medium">Chưa thiết lập ca trực mẫu nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableTh}>Tên ca trực</th>
                  <th className={tableTh}>Bắt đầu</th>
                  <th className={tableTh}>Kết thúc</th>
                  <th className={tableTh}>Thời lượng</th>
                  <th className={tableTh}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className={tableTd}><span className="font-bold text-slate-800">{s.name}</span></td>
                    <td className={tableTd}>{s.startTime}</td>
                    <td className={tableTd}>{s.endTime}</td>
                    <td className={tableTd}>
                      <span className="inline-flex px-2 py-0.5 bg-slate-100 rounded text-slate-600 text-xs font-bold">{s.durationHours} giờ</span>
                    </td>
                    <td className={tableTd}>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">Sửa</button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
