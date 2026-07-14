'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { Employee, ShiftTemplate, EmployeeShiftAssignment } from '@/types';

interface WeekDay {
  date: string;
  label: string;
  dayName: string;
}

function getWeekDays(offset: number): WeekDay[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);

  const days: WeekDay[] = [];
  const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    days.push({
      date: iso,
      label: d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }),
      dayName: weekdayLabels[i],
    });
  }
  return days;
}

// ─── Modal Component ─────────────────────────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>(() => getWeekDays(0));
  const [assignments, setAssignments] = useState<EmployeeShiftAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Bulk assign state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEmployee, setBulkEmployee] = useState('');
  const [bulkShift, setBulkShift] = useState('');
  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const days = getWeekDays(weekOffset);
      setWeekDays(days);

      const start = days[0].date;
      const end = days[6].date;

      const [assignData, empData, shiftData] = await Promise.all([
        api.get<EmployeeShiftAssignment[]>('/api/hr/schedule/range', { params: { start, end } }),
        api.get<Employee[]>('/api/hr/employees'),
        api.get<ShiftTemplate[]>('/api/hr/shifts'),
      ]);

      setAssignments(assignData);
      setEmployees(empData);
      setShiftTemplates(shiftData);
    } catch {
      toast.error('Không tải được lịch làm việc');
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateWeek = (dir: number) => {
    setWeekOffset(prev => prev + dir);
  };

  const getAssignmentsForDate = (date: string) => {
    return assignments.filter(a => a.date === date);
  };

  const openAssignModal = (date: string) => {
    setModalDate(date);
    setSelectedEmployee('');
    setSelectedShift('');
    setModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedEmployee || !selectedShift) {
      toast.error('Vui lòng chọn nhân viên và ca trực');
      return;
    }
    try {
      setAssigning(true);
      await api.post('/api/hr/schedule/assign', {
        employeeId: Number(selectedEmployee),
        shiftTemplateId: Number(selectedShift),
        date: modalDate,
      });
      toast.success('Đã phân ca thành công!');
      setModalOpen(false);
      fetchData();
    } catch {
      toast.error('Phân ca thất bại');
    } finally {
      setAssigning(false);
    }
  };

  const toggleBulkDate = (date: string) => {
    setBulkDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const handleBulkAssign = async () => {
    if (!bulkEmployee || !bulkShift || bulkDates.length === 0) {
      toast.error('Vui lòng chọn nhân viên, ca trực và chọn ít nhất 1 ngày');
      return;
    }
    try {
      setBulkAssigning(true);
      await Promise.all(
        bulkDates.map(date =>
          api.post('/api/hr/schedule/assign-bulk', {
            employeeId: Number(bulkEmployee),
            shiftTemplateId: Number(bulkShift),
            date,
          })
        )
      );
      toast.success(`Đã phân ca hàng loạt cho ${bulkDates.length} ngày thành công!`);
      setBulkMode(false);
      setBulkDates([]);
      setBulkEmployee('');
      setBulkShift('');
      fetchData();
    } catch {
      toast.error('Phân ca hàng loạt thất bại');
    } finally {
      setBulkAssigning(false);
    }
  };

  const selectClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all';
  const btnPrimary = 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-950/10 transition-all disabled:opacity-50';
  const btnSecondary = 'px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all';

  return (
    <div className="space-y-6 pb-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Quản lý ca trực & Phân lịch</h1>
          <p className="text-xs text-slate-400 mt-1">Phân ca làm việc hàng tuần cho nhân viên theo từng ngày hoặc phân ca hàng loạt</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setBulkMode(!bulkMode); setBulkDates([]); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-sm border ${
              bulkMode 
                ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white' 
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            {bulkMode ? '✓ Thoát phân hàng loạt' : '⚙️ Phân ca hàng loạt'}
          </button>
          
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
            <button onClick={() => navigateWeek(-1)} className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all border border-slate-200/40">
              ← Tuần trước
            </button>
            <span className="text-xs text-slate-600 font-bold px-3 py-1 bg-white/40 rounded-lg whitespace-nowrap uppercase tracking-wider">
              {weekDays[0]?.label} - {weekDays[6]?.label}
            </span>
            <button onClick={() => navigateWeek(1)} className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all border border-slate-200/40">
              Tuần sau →
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main calendar grid */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-28 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-sm font-semibold">Đang tải lịch phân ca...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3 min-w-[950px]">
              {/* Day headers */}
              {weekDays.map(day => (
                <div key={day.date} className="bg-slate-50/70 border border-slate-100 rounded-xl py-3 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{day.dayName}</p>
                  <p className="text-sm font-extrabold text-slate-700 mt-0.5">{day.label}</p>
                </div>
              ))}

              {/* Day cells */}
              {weekDays.map(day => {
                const dayAssignments = getAssignmentsForDate(day.date);
                const isBulkSelected = bulkDates.includes(day.date);
                const isToday = day.date === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={day.date}
                    className={`bg-white border rounded-xl p-3 min-h-[220px] transition-all flex flex-col justify-between ${
                      isToday ? 'ring-2 ring-indigo-500/30 border-indigo-500 shadow-sm' : 'border-slate-100 shadow-sm'
                    } ${isBulkSelected ? 'ring-2 ring-emerald-500/40 bg-emerald-50/50 border-emerald-400' : 'hover:bg-slate-50/30'}`}
                  >
                    <div className="flex-1">
                      {bulkMode ? (
                        <button
                          onClick={() => toggleBulkDate(day.date)}
                          className={`w-full h-full min-h-[160px] rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                            isBulkSelected 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                              : 'text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isBulkSelected ? '✓ Đã chọn' : '+ Chọn ngày'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openAssignModal(day.date)}
                            className="w-full text-left mb-3.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                          >
                            <span>➕</span> PHÂN CA
                          </button>
                          {dayAssignments.length === 0 ? (
                            <div className="h-[120px] flex items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                              Trống ca
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {dayAssignments.map(a => (
                                <div
                                  key={a.id}
                                  className="bg-indigo-50/50 border border-indigo-100/60 rounded-lg p-2 text-[11px] hover:border-indigo-200 transition-colors"
                                >
                                  <p className="text-indigo-900 font-bold truncate leading-tight">{a.employeeName}</p>
                                  <p className="text-slate-400 font-semibold text-[9px] mt-0.5">{a.startTime} - {a.endTime}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Employee sidebar */}
        <div className="w-full lg:w-68 shrink-0 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Danh sách nhân sự</h3>
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {employees.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Không có nhân viên.</p>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-xs font-semibold text-slate-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
                  <span className="truncate">{emp.user?.name || `Nhân viên #${emp.id}`}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bulk assign panel */}
      {bulkMode && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg animate-in slide-in-from-bottom duration-300">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Đang chọn:
            </span>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-100">
              {bulkDates.length} ngày đã chọn
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <select value={bulkEmployee} onChange={e => setBulkEmployee(e.target.value)} className={selectClass + ' md:w-56'}>
              <option value="">Chọn nhân viên...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.user?.name || `#${e.id}`}</option>
              ))}
            </select>
            <select value={bulkShift} onChange={e => setBulkShift(e.target.value)} className={selectClass + ' md:w-56'}>
              <option value="">Chọn ca làm việc mẫu...</option>
              {shiftTemplates.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
              ))}
            </select>
            <button onClick={handleBulkAssign} disabled={bulkAssigning} className={btnPrimary}>
              {bulkAssigning ? 'Đang phân ca...' : 'Áp dụng phân ca'}
            </button>
          </div>
        </div>
      )}

      {/* Assign modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Phân ca làm việc ngày">
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            Ngày trực: <span className="text-indigo-600 font-bold">{modalDate ? new Date(modalDate + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nhân viên</label>
              <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className={selectClass}>
                <option value="">Chọn nhân viên...</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.user?.name || `Employee #${e.id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ca làm việc mẫu</label>
              <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className={selectClass}>
                <option value="">Chọn ca làm việc...</option>
                {shiftTemplates.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => setModalOpen(false)} className={btnSecondary}>
              Hủy
            </button>
            <button onClick={handleAssign} disabled={assigning} className={btnPrimary}>
              {assigning ? 'Đang phân...' : 'Xác nhận phân ca'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
