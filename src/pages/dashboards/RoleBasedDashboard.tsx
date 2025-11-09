import { useOutletContext } from 'react-router-dom';
import { TeacherDashboard } from './TeacherDashboard';
import { AdminDashboard } from './AdminDashboard';
import { ParentDashboard } from './ParentDashboard';
import { PlaceholderPage } from '../PlaceholderPage';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface ContextType {
  profile: Profile;
}

export function RoleBasedDashboard() {
  const { profile } = useOutletContext<ContextType>();

  switch (profile.role) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return <PlaceholderPage />; // Fallback for unknown roles
  }
}
