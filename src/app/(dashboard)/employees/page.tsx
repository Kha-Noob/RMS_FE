'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import type { LeaveRequest, ForgotClockRequest, EmployeeShiftAssignment } from '@/types';

interface AttendanceStatus {
  isClockedIn: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [clockActionLoading, setClockActionLoading] = useState(false);

  // Leave request state
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', leaveType: 'ANNUAL', reason: '' });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Forgot clock state
  const [forgotForm, setForgotForm] = useState({ date: '', clockType: 'CLOCK_IN', timeProposed: '', reason: '' });
  const [forgotRequests, setForgotRequests] = useState<ForgotClockRequest[]>([]);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [submittingForgot, setSubmittingForgot] = useState(false);

  // Schedule state
  const [scheduleMonth, setScheduleMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [schedule, setSchedule] = useState<EmployeeShiftAssignment[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const data = await api.get<AttendanceStatus>('/api/employee/attendance/status');
      setAttendance(data);
    } catch {
      toast.error('Không tải được trạng thái chấm công');
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLeaveLoading(true);
      const data = await api.get<LeaveRequest[]>('/api/employee/leave-requests');
      setLeaveRequests(data);
    } catch {
      toast.error('Không tải được danh sách đơn xin nghỉ');
    } finally {
      setLeaveLoading(false);
    }
  }, []);

  const fetchForgotRequests = useCallback(async () => {
    try {
      setForgotLoading(true);
      const data = await api.get<ForgotClockRequest[]>('/api/employee/forgot-clock-requests');
      setForgotRequests(data);
    } catch {
      toast.error('Không tải được đơn quên chấm công');
    } finally {
      setForgotLoading(false);
    }
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      setScheduleLoading(true);
      const data = await api.get<EmployeeShiftAssignment[]>('/api/hr/schedule/my-schedule', {
        params: { month: scheduleMonth },
      });
      setSchedule(data);
    } catch {
      toast.error('Không tải được lịch làm việc');
    } finally {
      setScheduleLoading(false);
    }
  }, [scheduleMonth]);

  useEffect(() => {
    fetchAttendance();
    fetchLeaveRequests();
    fetchForgotRequests();
    fetchSchedule();
  }, [fetchAttendance, fetchLeaveRequests, fetchForgotRequests, fetchSchedule]);

  const handleClockIn = async () => {
    try {
      setClockActionLoading(true);
      await api.post('/api/employee/clock-in');
      toast.success('Bắt đầu ca làm việc (Clock In) thành công!');
      fetchAttendance();
    } catch {
      toast.error('Không thể Clock In');
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockActionLoading(true);
      await api.post('/api/employee/clock-out');
      toast.success('Kết thúc ca làm việc (Clock Out) thành công!');
      fetchAttendance();
    } catch {
      toast.error('Không thể Clock Out');
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error('Vui lòng nhập đủ các trường bắt buộc');
      return;
    }
    try {
      setSubmittingLeave(true);
      await api.post('/api/employee/leave-request', leaveForm);
      toast.success('Gửi đơn xin nghỉ thành công');
      setLeaveForm({ startDate: '', endDate: '', leaveType: 'ANNUAL', reason: '' });
      fetchLeaveRequests();
    } catch {
      toast.error('Gửi đơn xin nghỉ thất bại');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotForm.date || !forgotForm.timeProposed || !forgotForm.reason) {
      toast.error('Vui lòng điền đầy đủ các trường');
      return;
    }
    try {
      setSubmittingForgot(true);
      await api.post('/api/employee/forgot-clock-request', forgotForm);
      toast.success('Gửi đơn giải trình quên chấm công thành công');
      setForgotForm({ date: '', clockType: 'CLOCK_IN', timeProposed: '', reason: '' });
      fetchForgotRequests();
    } catch {
      toast.error('Gửi yêu cầu thất bại');
    } finally {
      setSubmittingForgot(false);
    }
  };

  const navigateMonth = (dir: number) => {
    const [y, m] = scheduleMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setScheduleMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const statusBadge = (status: string) => {
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
  };

  const inputClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder-slate-400';
  const selectClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all';
  const labelClass = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1';
  const btnPrimary = 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-950/10 transition-all disabled:opacity-50';
  const btnDanger = 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-950/10 transition-all disabled:opacity-50';
  
  const cardCls = 'bg-white rounded-2xl border border-slate-100 p-6 shadow-sm';
  const tableTh = 'px-4 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/70 border-b border-slate-100';
  const tableTd = 'px-4 py-3.5 text-sm text-slate-600 font-medium';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-6">
      {/* Header Profile Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold border-2 border-white/20 shadow-md">
            {user?.name?.substring(0, 2).toUpperCase() || 'NV'}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
              Cổng thông tin nhân viên
            </h1>
            <p className="text-xs text-indigo-200/80 mt-1 font-semibold">
              Mã NV: #{user?.id || '—'} · Bộ phận: Phục vụ
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Section */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⏰</span>
          <h2 className="text-base font-bold text-slate-800">Chấm công hàng ngày</h2>
        </div>
        {loadingAttendance ? (
          <div className="flex items-center gap-2 text-slate-500 py-4">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Đang tải dữ liệu chấm công...</span>
          </div>
        ) : attendance ? (
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${attendance.isClockedIn ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-300'}`} />
                <span className="text-sm font-bold text-slate-700">Trạng thái hiện tại:</span>
                <span className={`text-sm font-extrabold uppercase ${attendance.isClockedIn ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {attendance.isClockedIn ? 'Đã Clock-in' : 'Chưa Clock-in'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 pt-1">
                <div>Giờ vào: <span className="text-slate-800 font-bold ml-1">{attendance.clockInTime ? new Date(attendance.clockInTime).toLocaleTimeString('vi-VN') : '—'}</span></div>
                <div>Giờ ra: <span className="text-slate-800 font-bold ml-1">{attendance.clockOutTime ? new Date(attendance.clockOutTime).toLocaleTimeString('vi-VN') : '—'}</span></div>
              </div>
            </div>
            <div className="flex gap-3 justify-end items-center">
              <button
                onClick={handleClockIn}
                disabled={clockActionLoading || attendance.isClockedIn}
                className={btnPrimary}
              >
                {clockActionLoading ? 'Đang xử lý...' : 'Vào ca (Clock In)'}
              </button>
              <button
                onClick={handleClockOut}
                disabled={clockActionLoading || !attendance.isClockedIn}
                className={btnDanger}
              >
                {clockActionLoading ? 'Đang xử lý...' : 'Tan ca (Clock Out)'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Request Section */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <span className="text-lg">🏖️</span>
            <h2 className="text-base font-bold text-slate-800">Xin nghỉ phép</h2>
          </div>
          <form onSubmit={handleLeaveSubmit} className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className={labelClass}>Từ ngày *</label>
              <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Đến ngày *</label>
              <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))} className={inputClass} required />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Loại nghỉ</label>
              <select value={leaveForm.leaveType} onChange={e => setLeaveForm(p => ({ ...p, leaveType: e.target.value }))} className={selectClass}>
                <option value="ANNUAL">Nghỉ phép năm (Annual)</option>
                <option value="SICK">Nghỉ ốm (Sick)</option>
                <option value="PERSONAL">Việc riêng (Personal)</option>
                <option value="UNPAID">Nghỉ không lương (Unpaid)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Lý do xin nghỉ *</label>
              <input type="text" value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} className={inputClass} placeholder="Ghi rõ lý do nghỉ phép..." required />
            </div>
            <div className="col-span-2 pt-2">
              <button type="submit" disabled={submittingLeave} className={btnPrimary}>
                {submittingLeave ? 'Đang gửi...' : 'Gửi đơn xin nghỉ phép'}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            {leaveLoading ? (
              <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs">Đang tải lịch sử đơn...</span>
              </div>
            ) : leaveRequests.length === 0 ? (
              <p className="text-slate-400 py-8 text-center text-xs font-semibold">Chưa có đơn xin nghỉ phép nào.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={tableTh}>Phân loại</th>
                    <th className={tableTh}>Bắt đầu</th>
                    <th className={tableTh}>Kết thúc</th>
                    <th className={tableTh}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests.map(lr => (
                    <tr key={lr.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className={tableTd}>
                        <span className="font-bold text-slate-800 text-xs">{lr.leaveType}</span>
                      </td>
                      <td className={tableTd}>{new Date(lr.startDate).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}>{new Date(lr.endDate).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}>{statusBadge(lr.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Forgot Clock Request Section */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <span className="text-lg">📝</span>
            <h2 className="text-base font-bold text-slate-800">Giải trình quên chấm công</h2>
          </div>
          <form onSubmit={handleForgotSubmit} className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className={labelClass}>Ngày quên *</label>
              <input type="date" value={forgotForm.date} onChange={e => setForgotForm(p => ({ ...p, date: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Loại quên</label>
              <select value={forgotForm.clockType} onChange={e => setForgotForm(p => ({ ...p, clockType: e.target.value }))} className={selectClass}>
                <option value="CLOCK_IN">Quên Check-In</option>
                <option value="CLOCK_OUT">Quên Check-Out</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Giờ đề xuất *</label>
              <input type="time" value={forgotForm.timeProposed} onChange={e => setForgotForm(p => ({ ...p, timeProposed: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Lý do giải trình *</label>
              <input type="text" value={forgotForm.reason} onChange={e => setForgotForm(p => ({ ...p, reason: e.target.value }))} className={inputClass} placeholder="Ghi rõ lý do quên..." required />
            </div>
            <div className="col-span-2 pt-2">
              <button type="submit" disabled={submittingForgot} className={btnPrimary}>
                {submittingForgot ? 'Đang gửi...' : 'Gửi đơn giải trình'}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            {forgotLoading ? (
              <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs">Đang tải lịch sử đơn...</span>
              </div>
            ) : forgotRequests.length === 0 ? (
              <p className="text-slate-400 py-8 text-center text-xs font-semibold">Chưa có đơn giải trình nào.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={tableTh}>Ngày</th>
                    <th className={tableTh}>Check Type</th>
                    <th className={tableTh}>Giờ đề xuất</th>
                    <th className={tableTh}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forgotRequests.map(fr => (
                    <tr key={fr.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className={tableTd}>{new Date(fr.date).toLocaleDateString('vi-VN')}</td>
                      <td className={tableTd}>
                        <span className="font-bold text-slate-800 text-xs">{fr.clockType}</span>
                      </td>
                      <td className={tableTd}>{fr.timeProposed}</td>
                      <td className={tableTd}>{statusBadge(fr.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Personal Schedule Section */}
      <div className={cardCls}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <h2 className="text-base font-bold text-slate-800">Lịch làm việc cá nhân</h2>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/40">
            <button onClick={() => navigateMonth(-1)} className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all border border-slate-200/60">
              ← Tháng trước
            </button>
            <span className="text-xs text-slate-600 font-bold px-3 py-1 rounded-lg uppercase tracking-wider">{formatMonthLabel(scheduleMonth)}</span>
            <button onClick={() => navigateMonth(1)} className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all border border-slate-200/60">
              Tháng sau →
            </button>
          </div>
        </div>

        {scheduleLoading ? (
          <div className="flex items-center gap-2 text-slate-500 py-16 justify-center">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm font-semibold">Đang tải lịch làm việc...</span>
          </div>
        ) : schedule.length === 0 ? (
          <p className="text-slate-400 py-16 text-center text-sm font-semibold">Không tìm thấy ca làm việc nào được phân trong tháng này.</p>
        ) : (
          <div className={tableCardCls}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={tableTh}>Ngày làm việc</th>
                    <th className={tableTh}>Tên ca trực</th>
                    <th className={tableTh}>Thời gian làm việc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedule.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className={tableTd}>{new Date(s.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
                      <td className={tableTd}>
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold">
                          {s.shiftTemplateName}
                        </span>
                      </td>
                      <td className={tableTd}>{s.startTime} - {s.endTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
