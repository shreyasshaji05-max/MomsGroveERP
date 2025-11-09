import { useOutletContext } from 'react-router-dom';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface ContextType {
  profile: Profile;
}

export function AdminDashboard() {
  const { profile } = useOutletContext<ContextType>();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Admin Dashboard</h1>
      <p className="text-slate-600">Welcome, {profile.full_name}! This is your admin dashboard.</p>
      <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">System Health</h2>
        <p className="text-slate-700">
          Monitor user activity, system performance, and manage configurations.
        </p>
        <ul className="list-disc list-inside mt-4 text-slate-600">
          <li>Active Users: 120</li>
          <li>Pending Approvals: 7</li>
          <li>System Uptime: 99.9%</li>
        </ul>
      </div>
      <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Recent Logs</h2>
        <ul className="list-disc list-inside mt-4 text-slate-600">
          <li>User 'John Doe' created an account.</li>
          <li>System backup completed successfully.</li>
          <li>New teacher 'Alice Smith' added.</li>
        </ul>
      </div>
    </div>
  );
}
