import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { getAllStudents } from '../../services/adminService';
import { supabase } from '../../supabaseClient';

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  student_name?: string;
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchStudents = async () => {
    try {
      const studentsData = await getAllStudents();
      setStudents(studentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async (date: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('attendance')
        .select(`
          id,
          student_id,
          date,
          status,
          students(name)
        `)
        .eq('date', date);

      if (fetchError) throw fetchError;

      const attendanceData = (data || []).map((record: any) => ({
        ...record,
        student_name: record.students?.name || 'Unknown',
      }));

      setAttendance(attendanceData);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getAttendanceForDay = (day: number | null) => {
    if (day === null) return null;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.filter((a) => a.date === dateStr);
  };

  const getAttendanceStats = (dayAttendance: AttendanceRecord[] | null) => {
    if (!dayAttendance) return { present: 0, absent: 0, late: 0, total: 0 };
    return {
      present: dayAttendance.filter((a) => a.status === 'present').length,
      absent: dayAttendance.filter((a) => a.status === 'absent').length,
      late: dayAttendance.filter((a) => a.status === 'late').length,
      total: dayAttendance.length,
    };
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);
  const selectedDateAttendance = selectedDate
    ? attendance.filter((a) => a.date === selectedDate)
    : [];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Attendance Calendar</h1>
        <p className="text-slate-600">View and manage student attendance by date</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={24} className="text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-slate-700 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayAttendance = getAttendanceForDay(day);
            const stats = getAttendanceStats(dayAttendance);
            const isSelected = selectedDate ===
              `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day || '').padStart(2, '0')}`;
            const isToday =
              day !== null &&
              new Date().toDateString() ===
                new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            if (day === null) {
              return <div key={index} className="aspect-square"></div>;
            }

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className={`aspect-square p-2 border-2 rounded-lg transition-colors text-left ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50'
                    : isToday
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                  {day}
                </div>
                {stats.total > 0 && (
                  <div className="text-xs space-y-0.5">
                    <div className="text-green-600">P: {stats.present}</div>
                    <div className="text-red-600">A: {stats.absent}</div>
                    {stats.late > 0 && <div className="text-yellow-600">L: {stats.late}</div>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{formatDate(selectedDate)}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {selectedDateAttendance.length} attendance record(s)
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {selectedDateAttendance.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CalendarIcon size={48} className="mx-auto mb-4 text-slate-400" />
              <p>No attendance records for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedDateAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        {record.student_name}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

