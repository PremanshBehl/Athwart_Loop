import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

// Centralised gate for /admin/* pages. ProtectedRoute already guarantees
// `user` is loaded before this renders, so we can check the role synchronously
// without a flash of privileged content.
const AdminRoute: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return null;
  const isAdmin = user.role === 'ADMIN' || user.role === 'FOUNDER';
  if (!isAdmin) return <Navigate to="/feed" replace />;
  return <Outlet />;
};

export default AdminRoute;
