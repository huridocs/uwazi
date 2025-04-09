import React, { ReactElement, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { store } from 'app/store';
import { ClientSettings } from 'app/apiResponseTypes';

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles?: string[];
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const userId = store?.getState().user.get('_id');
    const userRole = store?.getState().user.get('role') || '';

    if (allowedRoles && allowedRoles.includes(userRole)) {
      setIsAuthenticated(true);
    } else if (!allowedRoles && userId) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [allowedRoles]);

  if (isAuthenticated === null) {
    // Optionally, render a loading spinner or placeholder while authentication is being checked
    return null;
  }

  if (isAuthenticated) {
    return children || <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

const adminsOnlyRoute = (element: ReactElement) => (
  <ProtectedRoute allowedRoles={['admin']}>{element}</ProtectedRoute>
);

const privateRoute = (element: ReactElement, settings: ClientSettings | undefined) =>
  !settings?.private ? element : <ProtectedRoute>{element}</ProtectedRoute>;

const loggedInUsersRoute = (element: ReactElement) => <ProtectedRoute>{element}</ProtectedRoute>;

export { loggedInUsersRoute, adminsOnlyRoute, privateRoute, ProtectedRoute };
