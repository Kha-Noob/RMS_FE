'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { Employee, LeaveRequest, ForgotClockRequest, ShiftTemplate } from '@/types';

type Tab = 'employees' | 'leave' | 'forgot-clock' | 'shifts';

export default function HRManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('employees');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">HR Management</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
        {([
          { key: 'employees', label: 'Employees' },
          { key: 'leave', label: 'Leave Requests' },
          { key: 'forgot-clock', label: 'Forgot Clock' },
          { key: 'shifts', label: 'Shift Templates' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#25439b] text-white'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
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

const inputClass = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b] focus:border-transparent placeholder-slate-400';
const selectClass = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b] focus:border-transparent';
const labelClass = 'block text-sm font-medium text-slate-600 mb-1';
const btnPrimary = 'bg-[#25439b] hover:bg-[#1c3580] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnDanger = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnSuccess = 'bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const tableTh = 'px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider';
const tableTd = 'px-4 py-3 text-sm text-slate-600';

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${styles[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
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
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Employee[]>('/api/hr/employees');
      setEmployees(data);
    } catch {
      toast.error('Failed to load employees');
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
        toast.success('Employee updated');
      } else {
        await api.post('/api/hr/employees/add', body);
        toast.success('Employee added');
      }
      resetForm();
      fetchEmployees();
    } catch {
      toast.error(editingId ? 'Failed to update employee' : 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkEdit = () => {
    if (selectedEmployeeIds.length === 0) return;
    if (selectedEmployeeIds.length > 1) {
      toast.error('Chỉ được phép chỉnh sửa 1 nhân viên tại một thời điểm!');
      return;
    }
    const targetId = selectedEmployeeIds[0];
    const emp = employees.find(e => e.id === targetId);
    if (emp) {
      openEdit(emp);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployeeIds.length === 0) return;
    try {
      setBulkDeleting(true);
      await Promise.all(
        selectedEmployeeIds.map(id => api.post(`/api/hr/employees/delete/${id}`))
      );
      toast.success('Deleted selected employees');
      setSelectedEmployeeIds([]);
      setShowBulkDeleteConfirm(false);
      fetchEmployees();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete selected employees'));
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Employee List</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className={btnPrimary}>
          + Add Employee
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-md font-semibold text-slate-800 mb-4">{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputClass} required={!editingId} />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hire Date</label>
              <input type="date" value={form.hireDate} onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Base Salary</label>
              <input type="number" value={form.baseSalary} onChange={e => setForm(p => ({ ...p, baseSalary: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Salary Type</label>
              <select value={form.salaryType} onChange={e => setForm(p => ({ ...p, salaryType: e.target.value }))} className={selectClass}>
                <option value="MONTHLY">Monthly</option>
                <option value="DAILY">Daily</option>
                <option value="HOURLY">Hourly</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Branch ID</label>
              <input type="text" value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))} className={inputClass} placeholder="Optional" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Saving...' : editingId ? 'Update Employee' : 'Add Employee'}
              </button>
              <button type="button" onClick={resetForm} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedEmployeeIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              Đã chọn {selectedEmployeeIds.length} nhân viên
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkEdit}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Chỉnh sửa (Edit)
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Xóa nhân viên đã chọn
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className={tableTh + ' w-12 text-center'}>
                    <input
                      type="checkbox"
                      checked={employees.length > 0 && selectedEmployeeIds.length === employees.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployeeIds(employees.map(emp => emp.id));
                        } else {
                          setSelectedEmployeeIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                    />
                  </th>
                  <th className={tableTh}>Name</th>
                  <th className={tableTh}>Email</th>
                  <th className={tableTh}>Department</th>
                  <th className={tableTh}>Title</th>
                  <th className={tableTh}>Branch</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const isChecked = selectedEmployeeIds.includes(emp.id);
                  return (
                    <tr key={emp.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isChecked ? 'bg-[#25439b]/5 hover:bg-[#25439b]/5' : ''}`}>
                      <td className={tableTd + ' text-center w-12'}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeeIds(prev => [...prev, emp.id]);
                            } else {
                              setSelectedEmployeeIds(prev => prev.filter(id => id !== emp.id));
                            }
                          }}
                          className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                        />
                      </td>
                      <td className={tableTd}>{emp.user?.name || '-'}</td>
                      <td className={tableTd}>{emp.user?.email || '-'}</td>
                      <td className={tableTd}>{emp.department || '-'}</td>
                      <td className={tableTd}>{emp.title || '-'}</td>
                      <td className={tableTd}>{emp.branch?.name || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom bulk delete confirm modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-xl transform transition-all">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Xóa {selectedEmployeeIds.length} nhân viên?</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa {selectedEmployeeIds.length} nhân viên đã chọn? Tất cả phân lịch và lịch sử liên quan sẽ được tự động xử lý. Hành động này không thể hoàn tác.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {bulkDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaveSection() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<LeaveRequest[]>('/api/hr/leave-requests');
      setRequests(data);
    } catch {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);

  const handleBulkApprove = async () => {
    if (selectedRequestIds.length === 0) return;
    try {
      setProcessingBulk(true);
      await Promise.all(
        selectedRequestIds.map(id => api.post(`/api/hr/leave-requests/approve/${id}`))
      );
      toast.success('Approved selected requests');
      setSelectedRequestIds([]);
      fetchRequests();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to approve requests'));
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequestIds.length === 0) return;
    try {
      setProcessingBulk(true);
      await Promise.all(
        selectedRequestIds.map(id => api.post(`/api/hr/leave-requests/reject/${id}`))
      );
      toast.success('Rejected selected requests');
      setSelectedRequestIds([]);
      fetchRequests();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to reject requests'));
    } finally {
      setProcessingBulk(false);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Bulk actions bar */}
      {selectedRequestIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              Đã chọn {selectedRequestIds.length} yêu cầu nghỉ phép
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkApprove}
              disabled={processingBulk}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {processingBulk ? 'Processing...' : 'Duyệt (Approve)'}
            </button>
            <button
              onClick={handleBulkReject}
              disabled={processingBulk}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {processingBulk ? 'Processing...' : 'Từ chối (Reject)'}
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Pending Leave Requests</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
              Loading...
            </div>
          ) : pending.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No pending requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={tableTh + ' w-12 text-center'}>
                      <input
                        type="checkbox"
                        checked={pending.length > 0 && selectedRequestIds.length === pending.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequestIds(pending.map(r => r.id));
                          } else {
                            setSelectedRequestIds([]);
                          }
                        }}
                        className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                      />
                    </th>
                    <th className={tableTh}>Employee</th>
                    <th className={tableTh}>Type</th>
                    <th className={tableTh}>Start</th>
                    <th className={tableTh}>End</th>
                    <th className={tableTh}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(r => {
                    const isChecked = selectedRequestIds.includes(r.id);
                    return (
                      <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isChecked ? 'bg-[#25439b]/5 hover:bg-[#25439b]/5' : ''}`}>
                        <td className={tableTd + ' text-center w-12'}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRequestIds(prev => [...prev, r.id]);
                              } else {
                                setSelectedRequestIds(prev => prev.filter(id => id !== r.id));
                              }
                            }}
                            className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                          />
                        </td>
                        <td className={tableTd}>{r.employee?.user?.name || '-'}</td>
                        <td className={tableTd}>{r.leaveType}</td>
                        <td className={tableTd}>{new Date(r.startDate).toLocaleDateString()}</td>
                        <td className={tableTd}>{new Date(r.endDate).toLocaleDateString()}</td>
                        <td className={tableTd}>{r.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Processed Requests</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={tableTh}>Employee</th>
                    <th className={tableTh}>Type</th>
                    <th className={tableTh}>Start</th>
                    <th className={tableTh}>End</th>
                    <th className={tableTh}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className={tableTd}>{r.employee?.user?.name || '-'}</td>
                      <td className={tableTd}>{r.leaveType}</td>
                      <td className={tableTd}>{new Date(r.startDate).toLocaleDateString()}</td>
                      <td className={tableTd}>{new Date(r.endDate).toLocaleDateString()}</td>
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
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ForgotClockRequest[]>('/api/hr/forgot-clock');
      setRequests(data);
    } catch {
      toast.error('Failed to load forgot clock requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleBulkApprove = async () => {
    if (selectedRequestIds.length === 0) return;
    try {
      setProcessingBulk(true);
      await Promise.all(
        selectedRequestIds.map(id => api.post(`/api/hr/forgot-clock/approve/${id}`))
      );
      toast.success('Approved selected requests');
      setSelectedRequestIds([]);
      fetchRequests();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to approve requests'));
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequestIds.length === 0) return;
    try {
      setProcessingBulk(true);
      await Promise.all(
        selectedRequestIds.map(id => api.post(`/api/hr/forgot-clock/reject/${id}`))
      );
      toast.success('Rejected selected requests');
      setSelectedRequestIds([]);
      fetchRequests();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to reject requests'));
    } finally {
      setProcessingBulk(false);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Bulk actions bar */}
      {selectedRequestIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              Đã chọn {selectedRequestIds.length} yêu cầu bổ sung công
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkApprove}
              disabled={processingBulk}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {processingBulk ? 'Processing...' : 'Duyệt (Approve)'}
            </button>
            <button
              onClick={handleBulkReject}
              disabled={processingBulk}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {processingBulk ? 'Processing...' : 'Từ chối (Reject)'}
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Pending Forgot Clock Requests</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
              Loading...
            </div>
          ) : pending.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No pending requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={tableTh + ' w-12 text-center'}>
                      <input
                        type="checkbox"
                        checked={pending.length > 0 && selectedRequestIds.length === pending.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequestIds(pending.map(r => r.id));
                          } else {
                            setSelectedRequestIds([]);
                          }
                        }}
                        className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                      />
                    </th>
                    <th className={tableTh}>Employee</th>
                    <th className={tableTh}>Date</th>
                    <th className={tableTh}>Clock Type</th>
                    <th className={tableTh}>Proposed Time</th>
                    <th className={tableTh}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(r => {
                    const isChecked = selectedRequestIds.includes(r.id);
                    return (
                      <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isChecked ? 'bg-[#25439b]/5 hover:bg-[#25439b]/5' : ''}`}>
                        <td className={tableTd + ' text-center w-12'}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRequestIds(prev => [...prev, r.id]);
                              } else {
                                setSelectedRequestIds(prev => prev.filter(id => id !== r.id));
                              }
                            }}
                            className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                          />
                        </td>
                        <td className={tableTd}>{r.employee?.user?.name || '-'}</td>
                        <td className={tableTd}>{new Date(r.date).toLocaleDateString()}</td>
                        <td className={tableTd}>{r.clockType}</td>
                        <td className={tableTd}>{r.timeProposed}</td>
                        <td className={tableTd}>{r.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Processed Requests</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={tableTh}>Employee</th>
                    <th className={tableTh}>Date</th>
                    <th className={tableTh}>Type</th>
                    <th className={tableTh}>Time</th>
                    <th className={tableTh}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className={tableTd}>{r.employee?.user?.name || '-'}</td>
                      <td className={tableTd}>{new Date(r.date).toLocaleDateString()}</td>
                      <td className={tableTd}>{r.clockType}</td>
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
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedShiftIds, setSelectedShiftIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ShiftTemplate[]>('/api/hr/shifts');
      setShifts(data);
    } catch {
      toast.error('Failed to load shifts');
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
      toast.success(editingId ? 'Shift updated' : 'Shift created');
      resetForm();
      fetchShifts();
    } catch {
      toast.error('Failed to save shift');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleting(true);
      await api.delete(`/api/hr/shifts/${deleteTargetId}`);
      toast.success('Shift deleted');
      setDeleteTargetId(null);
      fetchShifts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete shift'));
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkEdit = () => {
    if (selectedShiftIds.length === 0) return;
    if (selectedShiftIds.length > 1) {
      toast.error('Chỉ được phép chỉnh sửa 1 ca làm việc tại một thời điểm!');
      return;
    }
    const targetId = selectedShiftIds[0];
    const shift = shifts.find(s => s.id === targetId);
    if (shift) {
      openEdit(shift);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedShiftIds.length === 0) return;
    try {
      setBulkDeleting(true);
      await Promise.all(
        selectedShiftIds.map(id => api.delete(`/api/hr/shifts/${id}`))
      );
      toast.success('Deleted selected shift templates');
      setSelectedShiftIds([]);
      setShowBulkDeleteConfirm(false);
      fetchShifts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete selected shifts'));
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Shift Templates</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className={btnPrimary}>
          + Add Shift
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-md font-semibold text-slate-800 mb-4">{editingId ? 'Edit Shift' : 'Add Shift'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required placeholder="e.g. Morning Shift" />
            </div>
            <div>
              <label className={labelClass}>Start Time *</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>End Time *</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Duration (hours)</label>
              <input type="number" step="0.5" value={form.durationHours} onChange={e => setForm(p => ({ ...p, durationHours: e.target.value }))} className={inputClass} placeholder="8" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-3">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Saving...' : editingId ? 'Update Shift' : 'Add Shift'}
              </button>
              <button type="button" onClick={resetForm} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedShiftIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              Đã chọn {selectedShiftIds.length} ca làm việc
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkEdit}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Chỉnh sửa (Edit)
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Xóa các ca đã chọn
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
            Loading shifts...
          </div>
        ) : shifts.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">No shift templates found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className={tableTh + ' w-12 text-center'}>
                    <input
                      type="checkbox"
                      checked={shifts.length > 0 && selectedShiftIds.length === shifts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedShiftIds(shifts.map(s => s.id));
                        } else {
                          setSelectedShiftIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                    />
                  </th>
                  <th className={tableTh}>Name</th>
                  <th className={tableTh}>Start Time</th>
                  <th className={tableTh}>End Time</th>
                  <th className={tableTh}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(s => {
                  const isChecked = selectedShiftIds.includes(s.id);
                  return (
                    <tr key={s.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isChecked ? 'bg-[#25439b]/5 hover:bg-[#25439b]/5' : ''}`}>
                      <td className={tableTd + ' text-center w-12'}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedShiftIds(prev => [...prev, s.id]);
                            } else {
                              setSelectedShiftIds(prev => prev.filter(id => id !== s.id));
                            }
                          }}
                          className="rounded border-slate-300 text-[#25439b] focus:ring-[#25439b]"
                        />
                      </td>
                      <td className={tableTd}>{s.name}</td>
                      <td className={tableTd}>{s.startTime}</td>
                      <td className={tableTd}>{s.endTime}</td>
                      <td className={tableTd}>{s.durationHours}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom delete confirm modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-xl transform transition-all">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Delete Shift Template?</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete this shift template? All employee assignments and check-in history associated with this shift template will be unlinked or removed. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom bulk delete confirm modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-xl transform transition-all">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Xóa {selectedShiftIds.length} ca làm việc?</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa {selectedShiftIds.length} ca làm việc đã chọn? Tất cả phân lịch và dữ liệu chấm công liên quan sẽ được tự động xử lý. Hành động này không thể hoàn tác.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {bulkDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
