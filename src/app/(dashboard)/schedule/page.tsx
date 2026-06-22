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

  const inputClass = 'w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const selectClass = 'w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const btnPrimary = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Schedule Management</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setBulkMode(!bulkMode); setBulkDates([]); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${bulkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Assign'}
          </button>
          <button onClick={() => navigateWeek(-1)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            ← Previous
          </button>
          <span className="text-sm text-gray-300 font-medium">
            {weekDays[0]?.label} - {weekDays[6]?.label}
          </span>
          <button onClick={() => navigateWeek(1)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Next →
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main calendar grid */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-gray-400 py-20">
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Loading schedule...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 min-w-[900px]">
              {/* Day headers */}
              {weekDays.map(day => (
                <div key={day.date} className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 uppercase">{day.dayName}</p>
                  <p className="text-sm font-medium text-white">{day.label}</p>
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
                    className={`bg-gray-800 border rounded-lg p-2 min-h-[200px] transition-colors ${
                      isToday ? 'border-blue-500/50' : 'border-gray-700/50'
                    } ${isBulkSelected ? 'ring-2 ring-green-500 bg-green-900/20' : 'hover:bg-gray-750'}`}
                  >
                    {bulkMode ? (
                      <button
                        onClick={() => toggleBulkDate(day.date)}
                        className={`w-full h-full min-h-[180px] rounded text-sm transition-colors ${
                          isBulkSelected ? 'bg-green-600/20 text-green-400' : 'text-gray-500 hover:bg-gray-700'
                        }`}
                      >
                        {isBulkSelected ? '✓ Selected' : 'Click to select'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openAssignModal(day.date)}
                          className="w-full text-left mb-2 text-xs text-gray-500 hover:text-blue-400 transition-colors"
                        >
                          + Add shift
                        </button>
                        {dayAssignments.length === 0 ? (
                          <p className="text-xs text-gray-600 mt-4 text-center">No shifts</p>
                        ) : (
                          <div className="space-y-1">
                            {dayAssignments.map(a => (
                              <div
                                key={a.id}
                                className="bg-blue-600/20 border border-blue-600/30 rounded px-2 py-1.5 text-xs"
                              >
                                <p className="text-blue-400 font-medium truncate">{a.employeeName}</p>
                                <p className="text-gray-400">{a.startTime}-{a.endTime}</p>
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
        <div className="w-64 shrink-0 bg-gray-800 border border-gray-700 rounded-xl p-4 hidden lg:block">
          <h3 className="text-sm font-semibold text-white mb-3">Employees</h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {employees.length === 0 ? (
              <p className="text-xs text-gray-500">No employees found.</p>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-700 text-sm text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="truncate">{emp.user?.name || `Employee #${emp.id}`}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bulk assign bar */}
      {bulkMode && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="text-sm text-gray-400">
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
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Assign Shift</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Date: {new Date(modalDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Employee</label>
                <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className={selectClass}>
                  <option value="">Select employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.user?.name || `Employee #${e.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Shift Template</label>
                <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className={selectClass}>
                  <option value="">Select shift</option>
                  {shiftTemplates.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
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
