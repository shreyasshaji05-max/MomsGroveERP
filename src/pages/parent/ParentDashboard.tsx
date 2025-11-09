import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  getParentChild,
  getChildAttendanceForToday,
  getChildNextUpcomingInvoice,
  getChildLatestSkillEvidence,
  Student,
  AttendanceRecord,
  Invoice,
  SkillEvidence,
} from '../../services/parentService';
import { CalendarCheck, DollarSign, Award, User, BookOpen } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface ContextType {
  profile: Profile;
}

export function ParentDashboard() {
  const { profile } = useOutletContext<ContextType>();
  const [child, setChild] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [nextInvoice, setNextInvoice] = useState<Invoice | null>(null);
  const [skillEvidence, setSkillEvidence] = useState<SkillEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get the parent's child
        const parentChild = await getParentChild(profile.id);
        setChild(parentChild);

        if (parentChild) {
          // 2. Fetch attendance for today
          const todayAttendance = await getChildAttendanceForToday(parentChild.id);
          setAttendance(todayAttendance);

          // 3. Fetch next upcoming invoice
          const upcomingInvoice = await getChildNextUpcomingInvoice(parentChild.id);
          setNextInvoice(upcomingInvoice);

          // 4. Fetch latest skill evidence
          const latestEvidence = await getChildLatestSkillEvidence(parentChild.id, 3);
          setSkillEvidence(latestEvidence);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load parent dashboard data');
        console.error('Error loading parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.id) {
      fetchData();
    }
  }, [profile.id]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-600">Loading parent dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Parent Dashboard</h1>
        <p className="text-slate-600">Welcome, {profile.full_name}! Here's an overview of your child's progress.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!child ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-slate-600">
          <User size={48} className="mx-auto mb-4 text-slate-400" />
          <h2 className="text-xl font-semibold mb-2">No Child Linked</h2>
          <p>It looks like there's no child linked to your parent account yet. Please contact the school administration.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Widget 1: Attendance Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Today's Attendance for {child.name}</p>
                <p className={`text-3xl font-bold ${
                  attendance?.status === 'present' ? 'text-green-600' :
                  attendance?.status === 'absent' ? 'text-red-600' :
                  attendance?.status === 'late' ? 'text-yellow-600' : 'text-slate-900'
                }`}>
                  {attendance ? attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1) : 'N/A'}
                </p>
                {attendance && attendance.class_name && (
                  <p className="text-sm text-slate-500">Class: {attendance.class_name}</p>
                )}
              </div>
              <CalendarCheck size={36} className="text-slate-400" />
            </div>

            {/* Widget 2: Fee Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Next Fee Due for {child.name}</p>
                {nextInvoice ? (
                  <>
                    <p className="text-3xl font-bold text-slate-900">₹{nextInvoice.amount_due.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">Due: {new Date(nextInvoice.due_date).toLocaleDateString()}</p>
                    <button className="mt-2 px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors">
                      Pay Now
                    </button>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">No Upcoming Fees</p>
                )}
              </div>
              <DollarSign size={36} className="text-slate-400" />
            </div>

            {/* Widget 3: Latest Progress Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Latest Progress for {child.name}</h2>
                <Award size={24} className="text-slate-400" />
              </div>
              {skillEvidence.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No recent progress updates.</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {skillEvidence.map((evidence) => (
                    <li key={evidence.id} className="py-3">
                      <p className="font-medium text-slate-900">{evidence.skill_name}</p>
                      <p className="text-sm text-slate-600">{evidence.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Recorded on {new Date(evidence.date_recorded).toLocaleDateString()} by {evidence.recorded_by_name}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Additional sections for parent dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Child Details</h2>
              <ul className="text-slate-700 space-y-2">
                <li><span className="font-medium">Name:</span> {child.name}</li>
                <li><span className="font-medium">Date of Birth:</span> {child.dob ? new Date(child.dob).toLocaleDateString() : 'N/A'}</li>
                <li><span className="font-medium">Parent ID:</span> {child.parent_id}</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                  <CalendarCheck size={18} /> View Full Attendance
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                  <DollarSign size={18} /> View All Invoices
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                  <Award size={18} /> Detailed Progress Reports
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                  <BookOpen size={18} /> Class Schedule
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
