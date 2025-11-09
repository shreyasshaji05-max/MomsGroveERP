import { useEffect, useState } from 'react';
import { Users, BookOpen, DollarSign, CalendarCheck, Plus } from 'lucide-react';
import { getSchoolStats, SchoolStats, getRecentEnrollments, Student } from '../../services/adminService';

export function AdminDashboard() {
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<(Student & { days_ago: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [schoolStats, enrollments] = await Promise.all([
          getSchoolStats(),
          getRecentEnrollments(5),
        ]);
        setStats(schoolStats);
        setRecentEnrollments(enrollments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Welcome to your administrative control panel.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Students</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total_students}</p>
            </div>
            <Users size={36} className="text-slate-400" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Teachers</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total_teachers}</p>
            </div>
            <BookOpen size={36} className="text-slate-400" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Students Present Today</p>
              <p className="text-3xl font-bold text-slate-900">{stats.students_present_today}</p>
            </div>
            <CalendarCheck size={36} className="text-slate-400" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Overdue Invoices</p>
              <p className="text-3xl font-bold text-red-600">{stats.total_overdue_invoices}</p>
            </div>
            <DollarSign size={36} className="text-red-400" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Enrollments</h2>
          {recentEnrollments.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No recent enrollments.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {recentEnrollments.map((student) => (
                <li key={student.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-sm text-slate-500">Enrolled {student.days_ago === 0 ? 'today' : `${student.days_ago} days ago`}</p>
                  </div>
                  <span className="text-sm text-slate-600">
                    {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Placeholder for other admin widgets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              <Plus size={18} /> Add New Student
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              <BookOpen size={18} /> Manage Classes
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              <DollarSign size={18} /> View Payments
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              <CalendarCheck size={18} /> Review Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
