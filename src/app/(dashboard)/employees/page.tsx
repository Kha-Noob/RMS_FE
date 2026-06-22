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
      toast.error('Failed to load attendance status');
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
      toast.error('Failed to load leave requests');
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
      toast.error('Failed to load forgot clock requests');
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
      toast.error('Failed to load schedule');
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
      toast.success('Clocked in successfully');
      fetchAttendance();
    } catch {
      toast.error('Failed to clock in');
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockActionLoading(true);
      await api.post('/api/employee/clock-out');
      toast.success('Clocked out successfully');
      fetchAttendance();
    } catch {
      toast.error('Failed to clock out');
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setSubmittingLeave(true);
      await api.post('/api/employee/leave-request', leaveForm);
      toast.success('Leave request submitted');
      setLeaveForm({ startDate: '', endDate: '', leaveType: 'ANNUAL', reason: '' });
      fetchLeaveRequests();
    } catch {
      toast.error('Failed to submit leave request');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotForm.date || !forgotForm.timeProposed || !forgotForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setSubmittingForgot(true);
      await api.post('/api/employee/forgot-clock-request', forgotForm);
      toast.success('Forgot clock request submitted');
      setForgotForm({ date: '', clockType: 'CLOCK_IN', timeProposed: '', reason: '' });
      fetchForgotRequests();
    } catch {
      toast.error('Failed to submit forgot clock request');
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
    return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      APPROVED: 'bg-green-600/20 text-green-400 border-green-600/30',
      REJECTED: 'bg-red-600/20 text-red-400 border-red-600/30',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${styles[status] || 'bg-gray-600/20 text-gray-400 border-gray-600/30'}`}>
        {status}
      </span>
    );
  };

  const inputClass = 'w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400';
  const selectClass = 'w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';
  const btnPrimary = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const btnDanger = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const tableTh = 'px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider';
  const tableTd = 'px-4 py-3 text-sm text-gray-300';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Employee Portal</h1>

      {/* Attendance Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Attendance</h2>
        {loadingAttendance ? (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : attendance ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="bg-gray-700/50 rounded-lg p-4 flex-1">
              <p className="text-sm text-gray-400">Status</p>
              <p className={`text-lg font-bold ${attendance.isClockedIn ? 'text-green-400' : 'text-gray-400'}`}>
                {attendance.isClockedIn ? 'Clocked In' : 'Not Clocked In'}
              </p>
              {attendance.clockInTime && (
                <p className="text-xs text-gray-400 mt-1">In: {new Date(attendance.clockInTime).toLocaleTimeString()}</p>
              )}
              {attendance.clockOutTime && (
                <p className="text-xs text-gray-400 mt-1">Out: {new Date(attendance.clockOutTime).toLocaleTimeString()}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClockIn}
                disabled={clockActionLoading || attendance.isClockedIn}
                className={btnPrimary}
              >
                {clockActionLoading ? 'Processing...' : 'Clock In'}
              </button>
              <button
                onClick={handleClockOut}
                disabled={clockActionLoading || !attendance.isClockedIn}
                className={btnDanger}
              >
                {clockActionLoading ? 'Processing...' : 'Clock Out'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Leave Request Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Leave Request</h2>
        <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>Start Date *</label>
            <input
              type="date"
              value={leaveForm.startDate}
              onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>End Date *</label>
            <input
              type="date"
              value={leaveForm.endDate}
              onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Leave Type</label>
            <select
              value={leaveForm.leaveType}
              onChange={e => setLeaveForm(p => ({ ...p, leaveType: e.target.value }))}
              className={selectClass}
            >
              <option value="ANNUAL">Annual</option>
              <option value="SICK">Sick</option>
              <option value="PERSONAL">Personal</option>
              <option value="MATERNITY">Maternity</option>
              <option value="PATERNITY">Paternity</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Reason *</label>
            <input
              type="text"
              value={leaveForm.reason}
              onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
              className={inputClass}
              placeholder="Reason for leave"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={submittingLeave} className={btnPrimary}>
              {submittingLeave ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          {leaveLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-4">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : leaveRequests.length === 0 ? (
            <p className="text-gray-500 py-4 text-sm">No leave requests found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className={tableTh}>Type</th>
                  <th className={tableTh}>Start</th>
                  <th className={tableTh}>End</th>
                  <th className={tableTh}>Reason</th>
                  <th className={tableTh}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map(lr => (
                  <tr key={lr.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className={tableTd}>{lr.leaveType}</td>
                    <td className={tableTd}>{new Date(lr.startDate).toLocaleDateString()}</td>
                    <td className={tableTd}>{new Date(lr.endDate).toLocaleDateString()}</td>
                    <td className={tableTd}>{lr.reason}</td>
                    <td className={tableTd}>{statusBadge(lr.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Forgot Clock Request Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Forgot Clock Request</h2>
        <form onSubmit={handleForgotSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date"
              value={forgotForm.date}
              onChange={e => setForgotForm(p => ({ ...p, date: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Clock Type</label>
            <select
              value={forgotForm.clockType}
              onChange={e => setForgotForm(p => ({ ...p, clockType: e.target.value }))}
              className={selectClass}
            >
              <option value="CLOCK_IN">Clock In</option>
              <option value="CLOCK_OUT">Clock Out</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Proposed Time *</label>
            <input
              type="time"
              value={forgotForm.timeProposed}
              onChange={e => setForgotForm(p => ({ ...p, timeProposed: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Reason *</label>
            <input
              type="text"
              value={forgotForm.reason}
              onChange={e => setForgotForm(p => ({ ...p, reason: e.target.value }))}
              className={inputClass}
              placeholder="Why did you forget to clock?"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={submittingForgot} className={btnPrimary}>
              {submittingForgot ? 'Submitting...' : 'Submit Forgot Clock Request'}
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          {forgotLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-4">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : forgotRequests.length === 0 ? (
            <p className="text-gray-500 py-4 text-sm">No forgot clock requests found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className={tableTh}>Date</th>
                  <th className={tableTh}>Type</th>
                  <th className={tableTh}>Time Proposed</th>
                  <th className={tableTh}>Reason</th>
                  <th className={tableTh}>Status</th>
                </tr>
              </thead>
              <tbody>
                {forgotRequests.map(fr => (
                  <tr key={fr.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className={tableTd}>{new Date(fr.date).toLocaleDateString()}</td>
                    <td className={tableTd}>{fr.clockType}</td>
                    <td className={tableTd}>{fr.timeProposed}</td>
                    <td className={tableTd}>{fr.reason}</td>
                    <td className={tableTd}>{statusBadge(fr.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Personal Schedule Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Schedule</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => navigateMonth(-1)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
              ← Prev
            </button>
            <span className="text-sm text-gray-300 font-medium">{formatMonthLabel(scheduleMonth)}</span>
            <button onClick={() => navigateMonth(1)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
              Next →
            </button>
          </div>
        </div>

        {scheduleLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-4">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Loading schedule...
          </div>
        ) : schedule.length === 0 ? (
          <p className="text-gray-500 py-4 text-sm">No shifts scheduled for this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className={tableTh}>Date</th>
                  <th className={tableTh}>Shift</th>
                  <th className={tableTh}>Time</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(s => (
                  <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className={tableTd}>{new Date(s.date).toLocaleDateString()}</td>
                    <td className={tableTd}>{s.shiftTemplateName}</td>
                    <td className={tableTd}>{s.startTime} - {s.endTime}</td>
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
