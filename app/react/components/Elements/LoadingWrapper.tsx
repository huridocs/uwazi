import React from 'react';
import { Loader } from './Loader';

type LoadingWrapperProps = {
  isLoading: boolean;
  children?: React.ReactNode;
};

const LoadingWrapper = ({ isLoading, children }: LoadingWrapperProps) => {
  if (isLoading) {
    return <Loader />;
  }
  return <>{children}</>;
};

export { LoadingWrapper };
