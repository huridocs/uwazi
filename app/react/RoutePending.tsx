import React from 'react';
import { Loader } from './components/Elements/Loader.js';

export const RoutePending = () => (
  <div className="flex h-full min-h-[12rem] w-full items-center justify-center">
    <Loader />
  </div>
);
