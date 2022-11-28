import React, { ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { store } from 'app/store';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const userId = store?.getState().user.get('_id');

  if (userId) {
    return children || <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

export { ProtectedRoute };
