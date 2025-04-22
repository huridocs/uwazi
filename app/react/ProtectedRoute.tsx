import React, { ReactElement, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { store } from 'app/store';
import { ClientSettings } from 'app/apiResponseTypes';

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles?: string[];
}) => {
  const navigate = useNavigate();
  const userId = store?.getState().user.get('_id');
  const userRole = store?.getState().user.get('role') || '';

  useEffect(() => {
    if ((allowedRoles && !allowedRoles.includes(userRole)) || !userId) {
      // eslint-disable-next-line no-void
      void navigate('/login', { replace: true });
    }
  }, [allowedRoles, userRole, userId, navigate]);

  // Render children or <Outlet> only if the user is authenticated
  if (allowedRoles && allowedRoles.includes(userRole)) {
    return children || <Outlet />;
  }

  if (!allowedRoles && userId) {
    return children || <Outlet />;
  }

  // Optionally, render a fallback (e.g., a loading spinner) while redirecting
  return null;
};

const adminsOnlyRoute = (element: ReactElement) => (
  <ProtectedRoute allowedRoles={['admin']}>{element}</ProtectedRoute>
);

const privateRoute = (element: ReactElement, settings: ClientSettings | undefined) =>
  !settings?.private ? element : <ProtectedRoute>{element}</ProtectedRoute>;

const loggedInUsersRoute = (element: ReactElement) => <ProtectedRoute>{element}</ProtectedRoute>;

export { loggedInUsersRoute, adminsOnlyRoute, privateRoute, ProtectedRoute };
