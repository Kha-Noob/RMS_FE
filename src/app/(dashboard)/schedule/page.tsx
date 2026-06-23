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
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    days.push({
      date: iso,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }
  return days;
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
      toast.error('Failed to load schedule data');
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
      toast.error('Select an employee and shift');
      return;
    }
    try {
      setAssigning(true);
      await api.post('/api/hr/schedule/assign', {
        employeeId: Number(selectedEmployee),
        shiftTemplateId: Number(selectedShift),
        date: modalDate,
      });
      toast.success('Shift assigned');
      setModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to assign shift');
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
      toast.error('Select employee, shift, and at least one date');
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
      toast.success(`Shift assigned to ${bulkDates.length} day(s)`);
      setBulkMode(false);
      setBulkDates([]);
      setBulkEmployee('');
      setBulkShift('');
      fetchData();
    } catch {
      toast.error('Failed to bulk assign shifts');
    } finally {
      setBulkAssigning(false);
    }
  };

  const inputClass = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b] focus:border-transparent';
  const selectClass = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b] focus:border-transparent';
  const btnPrimary = 'bg-[#25439b] hover:bg-[#1c3580] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Schedule Management</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setBulkMode(!bulkMode); setBulkDates([]); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${bulkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Assign'}
          </button>
          <button onClick={() => navigateWeek(-1)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm transition-colors">
            ← Previous
          </button>
          <span className="text-sm text-slate-600 font-medium">
            {weekDays[0]?.label} - {weekDays[6]?.label}
          </span>
          <button onClick={() => navigateWeek(1)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm transition-colors">
            Next →
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main calendar grid */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 py-20">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
              Loading schedule...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 min-w-[900px]">
              {/* Day headers */}
              {weekDays.map(day => (
                <div key={day.date} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 uppercase">{day.dayName}</p>
                  <p className="text-sm font-medium text-slate-800">{day.label}</p>
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
                    className={`bg-white border rounded-lg p-2 min-h-[200px] transition-colors ${
                      isToday ? 'border-[#25439b]/50' : 'border-slate-200'
                    } ${isBulkSelected ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-slate-50'}`}
                  >
                    {bulkMode ? (
                      <button
                        onClick={() => toggleBulkDate(day.date)}
                        className={`w-full h-full min-h-[180px] rounded text-sm transition-colors ${
                          isBulkSelected ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {isBulkSelected ? '✓ Selected' : 'Click to select'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openAssignModal(day.date)}
                          className="w-full text-left mb-2 text-xs text-slate-400 hover:text-[#25439b] transition-colors"
                        >
                          + Add shift
                        </button>
                        {dayAssignments.length === 0 ? (
                          <p className="text-xs text-slate-400 mt-4 text-center">No shifts</p>
                        ) : (
                          <div className="space-y-1">
                            {dayAssignments.map(a => (
                              <div
                                key={a.id}
                                className="bg-[#25439b]/10 border border-[#25439b]/20 rounded px-2 py-1.5 text-xs"
                              >
                                <p className="text-[#25439b] font-medium truncate">{a.employeeName}</p>
                                <p className="text-slate-500">{a.startTime}-{a.endTime}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Employee sidebar */}
        <div className="w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-4 hidden lg:block shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Employees</h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {employees.length === 0 ? (
              <p className="text-xs text-slate-400">No employees found.</p>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{emp.user?.name || `Employee #${emp.id}`}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bulk assign bar */}
      {bulkMode && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
          <span className="text-sm text-slate-500">
            {bulkDates.length} day(s) selected
          </span>
          <select value={bulkEmployee} onChange={e => setBulkEmployee(e.target.value)} className={selectClass + ' w-48'}>
            <option value="">Select employee</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.user?.name || `#${e.id}`}</option>
            ))}
          </select>
          <select value={bulkShift} onChange={e => setBulkShift(e.target.value)} className={selectClass + ' w-48'}>
            <option value="">Select shift</option>
            {shiftTemplates.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
            ))}
          </select>
          <button onClick={handleBulkAssign} disabled={bulkAssigning} className={btnPrimary}>
            {bulkAssigning ? 'Assigning...' : 'Assign to Selected Days'}
          </button>
        </div>
      )}

      {/* Assign modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Assign Shift</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800 text-xl">&times;</button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Date: {new Date(modalDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Employee</label>
                <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className={selectClass}>
                  <option value="">Select employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.user?.name || `Employee #${e.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Shift Template</label>
                <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className={selectClass}>
                  <option value="">Select shift</option>
                  {shiftTemplates.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleAssign} disabled={assigning} className={btnPrimary}>
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
