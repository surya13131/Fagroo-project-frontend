import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean; // New prop to determine if the route is admin-only
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  // We need loading and userRole from AuthContext to prevent premature redirects
  const { currentUser, userRole, loading } = useAuth();

  // 1. Wait for Firebase Auth & Firestore to finish loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. User is not logged in at all -> Send to Login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 3. Route requires Admin, but user is just a buyer -> Send to Home
  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  // 4. Authorized -> Render the protected component
  return <>{children}</>;
};