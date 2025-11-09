import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getTeacherStudents,
  getAttendanceForDate,
  upsertAttendance,
  Student,
  AttendanceRecord,
} from '../../services/teacherService';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface ContextType {
  profile: Profile;
}

interface StudentWithAttendance extends Student {
  status: 'present' | 'absent' | 'late' | null;
}

export function AttendancePage() {
  const { profile } = useOutletContext<ContextType>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const studentsList = await getTeacherStudents(profile.id);

        if (studentsList.length === 0) {
          setError('No students found for your classes.');
          setStudents([]);
          return;
        }

        const attendance = await getAttendanceForDate(
          studentsList.map((s) => s.id),
          selectedDate
        );

        const attendanceMap = new Map(attendance.map((a) => [a.student_id, a.status]));

        const studentsWithAttendance = studentsList.map((student) => ({
          ...student,
          status: (attendanceMap.get(student.id) as 'present' | 'absent' | 'late' | null) || null,
        }));

        setStudents(studentsWithAttendance);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile.id, selectedDate]);

  const handleStatusChange = async (
    studentId: string,
    newStatus: 'present' | 'absent' | 'late'
  ) => {
    try {
      setSaving(studentId);
      await upsertAttendance(studentId, selectedDate, newStatus, profile.id);

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
      );

      setSuccess(`Attendance updated for ${students.find((s) => s.id === studentId)?.name}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update attendance');
      console.error('Error updating attendance:', err);
    } finally {
      setSaving(null);
    }
  };

  const handlePreviousDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // Add T00:00:00 to ensure correct date parsing in local timezone
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Attendance Management</h1>
        <p className="text-slate-600">Record and manage student attendance</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviousDate}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Previous date"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(selectedDate)}</span>
              </div>

              <button
                onClick={handleNextDate}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Next date"
              >
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
          </div>

          {!isToday && (
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm"
            >
              Back to Today
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600">Loading students...</p>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-slate-600 text-lg">No students found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student Name</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{student.name}</p>
                      {student.dob && (
                        <p className="text-xs text-slate-500">DOB: {new Date(student.dob).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleStatusChange(student.id, 'present')}
                          disabled={saving === student.id}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            student.status === 'present'
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                          } ${saving === student.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          disabled={saving === student.id}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            student.status === 'absent'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                          } ${saving === student.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'late')}
                          disabled={saving === student.id}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            student.status === 'late'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                          } ${saving === student.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
