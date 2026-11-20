import React, { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { store } from '#app/store.js';
import { ClientSettings } from '#app/apiResponseTypes.js';
import { loginUrl, rememberReturnPath } from '#shared/authReturn.js';

const deniedLogin = (location: { pathname: string; search: string; hash: string }) => {
  const returnPath = `${location.pathname}${location.search}${location.hash}`;
  rememberReturnPath(returnPath);
  return <Navigate to={loginUrl(returnPath)} replace />;
};

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles?: string[];
}) => {
  const location = useLocation();
  const userId = store?.getState().user.get('_id');
  const userRole = store?.getState().user.get('role') || '';
  if (allowedRoles && allowedRoles.includes(userRole)) return children || <Outlet />;
  if (!allowedRoles && userId) return children || <Outlet />;
  return deniedLogin(location);
};

const adminsOnlyRoute = (element: ReactElement) => (
  <ProtectedRoute allowedRoles={['admin']}>{element}</ProtectedRoute>
);

const privateRoute = (element: ReactElement, settings: ClientSettings | undefined) =>
  !settings?.private ? element : <ProtectedRoute>{element}</ProtectedRoute>;

const loggedInUsersRoute = (element: ReactElement) => <ProtectedRoute>{element}</ProtectedRoute>;
export { loggedInUsersRoute, adminsOnlyRoute, privateRoute, ProtectedRoute };
