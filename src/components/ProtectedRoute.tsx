import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, type Action } from '../lib/permissions';
import { AccessDeniedPage } from '../screens/AccessDeniedPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAction?: Action;
  requiredActionsAny?: Action[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredAction,
  requiredActionsAny,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Unauthenticated: redirect to login and preserve location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredAction && !hasPermission(user.role, requiredAction)) {
    return <AccessDeniedPage attemptedPath={location.pathname} />;
  }

  if (
    requiredActionsAny &&
    !requiredActionsAny.some(action => hasPermission(user.role, action))
  ) {
    return <AccessDeniedPage attemptedPath={location.pathname} />;
  }

  return <>{children}</>;
};
