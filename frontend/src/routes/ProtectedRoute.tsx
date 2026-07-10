import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

// Never render a protected route with a token-present-but-user-unloaded gap.
// Otherwise admin pages briefly render their own contents (or the AppLayout
// nav) before we know what role the token actually belongs to.
const ProtectedRoute: React.FC = () => {
  const { token, user, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token && !user) fetchMe();
  }, [token, user, fetchMe]);

  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading your session…
      </div>
    );
  }
  return <Outlet />;
};

export default ProtectedRoute;
