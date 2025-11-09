import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { CalendarCheck, Users, ArrowRight } from 'lucide-react';
import { getTeacherStats, TeacherStats } from '../../services/teacherService';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface ContextType {
  profile: Profile;
}

export function TeacherDashboard() {
  const { profile } = useOutletContext<ContextType>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setErrorStats(null);
      try {
        const today = new Date().toISOString().split('T')[0];
        const teacherStats = await getTeacherStats(profile.id, today);
        setStats(teacherStats);
      } catch (err) {
        setErrorStats(err instanceof Error ? err.message : 'Failed to load dashboard stats');
        console.error('Error fetching teacher stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [profile.id]);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Teacher Dashboard</h1>
      <p className="text-slate-600 mb-8">Welcome, {profile.full_name}! Here's a quick overview of your day.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* QuickStats Card */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Quick Stats</h2>
            <Users className="text-green-600" size={24} />
          </div>
          {loadingStats ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          ) : errorStats ? (
            <p className="text-red-600 text-sm">{errorStats}</p>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-700 text-lg">
                Total Students: <span className="font-bold text-slate-900">{stats?.totalStudents ?? 0}</span>
              </p>
              <p className="text-slate-700 text-lg">
                Present Today: <span className="font-bold text-green-600">{stats?.presentToday ?? 0}</span>
              </p>
              <p className="text-slate-700 text-lg">
                Absent Today: <span className="font-bold text-red-600">{stats?.absentToday ?? 0}</span>
              </p>
            </div>
          )}
        </div>

        {/* Daily Actions Card */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Daily Actions</h2>
            <CalendarCheck className="text-blue-600" size={24} />
          </div>
          <p className="text-slate-700 mb-4">
            Easily log and manage today's attendance for your classes.
          </p>
          <button
            onClick={() => navigate('/attendance')}
            className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Log Today's Attendance
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Placeholder for another card */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Upcoming Events</h2>
            <CalendarCheck className="text-purple-600" size={24} />
          </div>
          <ul className="list-disc list-inside text-slate-700 space-y-2">
            <li>Parent-Teacher Conference: July 20</li>
            <li>School Holiday: August 1</li>
            <li>Field Trip: August 15</li>
          </ul>
          <button className="mt-auto w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
            View All Events
          </button>
        </div>
      </div>

      <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Recent Activities</h2>
        <ul className="list-disc list-inside mt-4 text-slate-600">
          <li>Graded Math assignment for Class A</li>
          <li>Updated attendance for Class B</li>
          <li>Scheduled parent-teacher meeting</li>
        </ul>
      </div>
    </div>
  );
}
