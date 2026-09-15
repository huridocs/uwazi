import React, { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router';
import { store } from '#app/store.js';
import { ClientSettings } from '#app/apiResponseTypes.js';

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactElement<any>;
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

const adminsOnlyRoute = (element: ReactElement<any>) => (
  <ProtectedRoute allowedRoles={['admin']}>{element}</ProtectedRoute>
);

const privateRoute = (element: ReactElement<any>, settings: ClientSettings | undefined) =>
  !settings?.private ? element : <ProtectedRoute>{element}</ProtectedRoute>;

const loggedInUsersRoute = (element: ReactElement<any>) => (
  <ProtectedRoute>{element}</ProtectedRoute>
);
export { loggedInUsersRoute, adminsOnlyRoute, privateRoute, ProtectedRoute };
