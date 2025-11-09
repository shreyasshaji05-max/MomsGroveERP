import { useOutletContext } from 'react-router-dom';

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

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Parent Dashboard</h1>
      <p className="text-slate-600">Welcome, {profile.full_name}! This is your parent dashboard.</p>
      <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Child's Overview</h2>
        <p className="text-slate-700">
          Here you can find information about your child's attendance, fees, and progress.
        </p>
        <ul className="list-disc list-inside mt-4 text-slate-600">
          <li>Child's Name: Jane Doe</li>
          <li>Today's Attendance: Present</li>
          <li>Next Fee Due: $150 on 2024-07-15</li>
        </ul>
      </div>
      <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Latest Updates</h2>
        <ul className="list-disc list-inside mt-4 text-slate-600">
          <li>New progress report available for Math.</li>
          <li>School trip reminder for next Friday.</li>
          <li>Photo gallery updated with recent class activities.</li>
        </ul>
      </div>
    </div>
  );
}
