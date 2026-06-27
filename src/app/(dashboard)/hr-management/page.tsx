'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
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

  const executeDelete = async (id: number) => {
    try {
      await api.post(`/api/hr/employees/delete/${id}`);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch {
      toast.error('Failed to delete employee');
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
                  <th className={tableTh}>Name</th>
                  <th className={tableTh}>Email</th>
                  <th className={tableTh}>Department</th>
                  <th className={tableTh}>Title</th>
                  <th className={tableTh}>Branch</th>
                  <th className={tableTh}>Status</th>
                  <th className={tableTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className={tableTd}>{emp.user?.name || '-'}</td>
                    <td className={tableTd}>{emp.user?.email || '-'}</td>
                    <td className={tableTd}>{emp.department || '-'}</td>
                    <td className={tableTd}>{emp.title || '-'}</td>
                    <td className={tableTd}>{emp.branch?.name || '-'}</td>
                    <td className={tableTd}>
                      <span className={`px-2 py-1 rounded-full text-xs border ${emp.user?.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {emp.user?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={tableTd}>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(emp)} className="text-[#25439b] hover:text-[#1c3580] text-xs">Edit</button>
                        <button onClick={() => setDeleteConfirmId(emp.id)} className="text-red-500 hover:text-red-600 text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-slate-100 transform scale-100 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-500 text-sm mb-6">Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Thao tác này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  await executeDelete(id);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-xl text-sm transition-colors"
              >
                Xóa
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-xl text-sm transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
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
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      await api.post(`/api/hr/leave-requests/approve/${id}`);
      toast.success('Leave request approved');
      fetchRequests();
    } catch {
      toast.error('Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setProcessingId(id);
      await api.post(`/api/hr/leave-requests/reject/${id}`);
      toast.success('Leave request rejected');
      fetchRequests();
    } catch {
      toast.error('Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
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
                    <th className={tableTh}>Employee</th>
                    <th className={tableTh}>Type</th>
                    <th className={tableTh}>Start</th>
                    <th className={tableTh}>End</th>
                    <th className={tableTh}>Reason</th>
                    <th className={tableTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className={tableTd}>{r.employee?.user?.name || '-'}</td>
                      <td className={tableTd}>{r.leaveType}</td>
                      <td className={tableTd}>{new Date(r.startDate).toLocaleDateString()}</td>
                      <td className={tableTd}>{new Date(r.endDate).toLocaleDateString()}</td>
                      <td className={tableTd}>{r.reason}</td>
                      <td className={tableTd}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={processingId === r.id}
                            className={btnSuccess + ' text-xs px-3 py-1'}
                          >
                            {processingId === r.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={processingId === r.id}
                            className={btnDanger + ' text-xs px-3 py-1'}
                          >
                            {processingId === r.id ? '...' : 'Reject'}
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
  const [processingId, setProcessingId] = useState<number | null>(null);

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

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      await api.post(`/api/hr/forgot-clock/approve/${id}`);
      toast.success('Request approved');
      fetchRequests();
    } catch {
      toast.error('Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setProcessingId(id);
      await api.post(`/api/hr/forgot-clock/reject/${id}`);
      toast.success('Request rejected');
      fetchRequests();
    } catch {
      toast.error('Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
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
                    <th className={tableTh}>Employee</th>
                    <th className={tableTh}>Date</th>
                    <th className={tableTh}>Clock Type</th>
                    <th className={tableTh}>Proposed Time</th>
                    <th className={tableTh}>Reason</th>
                    <th className={tableTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className={tableTd}>{r.employee?.user?.name || '-'}</td>
                      <td className={tableTd}>{new Date(r.date).toLocaleDateString()}</td>
                      <td className={tableTd}>{r.clockType}</td>
                      <td className={tableTd}>{r.timeProposed}</td>
                      <td className={tableTd}>{r.reason}</td>
                      <td className={tableTd}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={processingId === r.id}
                            className={btnSuccess + ' text-xs px-3 py-1'}
                          >
                            {processingId === r.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={processingId === r.id}
                            className={btnDanger + ' text-xs px-3 py-1'}
                          >
                            {processingId === r.id ? '...' : 'Reject'}
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

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this shift template?')) return;
    try {
      await api.delete(`/api/hr/shifts/${id}`);
      toast.success('Shift deleted');
      fetchShifts();
    } catch {
      toast.error('Failed to delete shift');
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
                  <th className={tableTh}>Name</th>
                  <th className={tableTh}>Start Time</th>
                  <th className={tableTh}>End Time</th>
                  <th className={tableTh}>Duration</th>
                  <th className={tableTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className={tableTd}>{s.name}</td>
                    <td className={tableTd}>{s.startTime}</td>
                    <td className={tableTd}>{s.endTime}</td>
                    <td className={tableTd}>{s.durationHours}h</td>
                    <td className={tableTd}>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="text-[#25439b] hover:text-[#1c3580] text-xs">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-600 text-xs">Delete</button>
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
