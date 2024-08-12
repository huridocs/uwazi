import React, { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { store } from 'app/store';
import { ClientSettings } from 'app/apiResponseTypes';

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles?: string[];
}) => {
  const userId = store?.getState().user.get('_id');
  const userRole = store?.getState().user.get('role') || '';
  if (allowedRoles && allowedRoles.includes(userRole)) {
    return children || <Outlet />;
  }

  if (!allowedRoles && userId) {
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
