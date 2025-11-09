import { Outlet, useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import { TeacherSidebar } from '../components/sidebars/TeacherSidebar';
import { AdminSidebar } from '../components/sidebars/AdminSidebar';
import { ParentSidebar } from '../components/sidebars/ParentSidebar';
import { useEffect } from 'react';

export function AppLayout() {
  const { profile, loading, error } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      // Redirect to the appropriate dashboard based on role
      switch (profile.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'teacher':
          navigate('/teacher/dashboard', { replace: true });
          break;
        case 'parent':
          navigate('/parent/dashboard', { replace: true });
          break;
        default:
          // Fallback for unknown roles or if profile is somehow invalid
          navigate('/login', { replace: true });
          break;
      }
    } else if (!loading && !profile && !error) {
      // If not loading, no profile, and no error, it means user is not authenticated
      // ProtectedRoute should handle this, but this is a safeguard.
      navigate('/login', { replace: true });
    }
  }, [profile, loading, error, navigate]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-6 rounded-lg bg-white shadow-md">
          <h2 className="text-xl font-semibold text-red-800 mb-3">Error Loading Profile</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    // If not loading and no profile, user is not authenticated or profile not found.
    // ProtectedRoute should handle redirection to login, but this is a fallback.
    navigate('/login');
    return null;
  }

  const renderSidebar = () => {
    switch (profile.role) {
      case 'teacher':
        return <TeacherSidebar />;
      case 'admin':
        return <AdminSidebar />;
      case 'parent':
        return <ParentSidebar />;
      default:
        return (
          <aside className="w-64 bg-white shadow-lg p-6 flex flex-col justify-between">
            <div className="text-center text-slate-600">Unknown Role</div>
          </aside>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto">
        <Outlet context={{ profile }} />
      </main>
    </div>
  );
}
