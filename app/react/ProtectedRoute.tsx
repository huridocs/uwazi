import React, { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { store } from 'app/store';
import { UserRole } from 'shared/types/userSchema';
import { ClientSettings } from 'app/apiResponseTypes';

const ProtectedRoute = ({
  children,
  onlyAdmin,
}: {
  children: ReactElement;
  onlyAdmin?: boolean;
}) => {
  const userId = store?.getState().user.get('_id');

  if (onlyAdmin && store?.getState().user.get('role') === UserRole.ADMIN) {
    return children || <Outlet />;
  }

  if (!onlyAdmin && userId) {
    return children || <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

const adminsOnlyRoute = (element: ReactElement) => (
  <ProtectedRoute onlyAdmin>{element}</ProtectedRoute>
);

const privateRoute = (element: ReactElement, settings: ClientSettings | undefined) =>
  !settings?.private ? element : <ProtectedRoute>{element}</ProtectedRoute>;

const loggedInUsersRoute = (element: ReactElement) => <ProtectedRoute>{element}</ProtectedRoute>;
export { loggedInUsersRoute, adminsOnlyRoute, privateRoute };
