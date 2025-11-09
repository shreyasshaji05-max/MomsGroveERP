import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile'; // Corrected import to useUserProfile

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useUserProfile(); // Use useUserProfile hook
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      // If not loading and no session, redirect to login
      navigate('/login', { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    // Optionally render a loading spinner or placeholder
    return <div>Loading authentication...</div>;
  }

  if (!session) {
    // If not authenticated, children should not be rendered
    return null;
  }

  return <>{children}</>;
}
