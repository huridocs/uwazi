import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { store } from 'app/store';

const ProtectedRoute = () => {
  const userId = store?.getState().user.get('_id');

  if (userId) {
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

export { ProtectedRoute };
