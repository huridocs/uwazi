import React, { createContext, useContext, useMemo } from 'react';
import type { DatavizApi, DatavizApiOptions } from './contracts.js';
import { createMockDatavizApi } from './mockDatavizApi.js';

const DatavizApiContext = createContext<DatavizApi | null>(null);

type DatavizApiProviderProps = {
  children: React.ReactNode;
  api?: DatavizApi;
  options?: DatavizApiOptions;
};

const DatavizApiProvider = ({ children, api, options }: DatavizApiProviderProps) => {
  const value = useMemo(() => api ?? createMockDatavizApi(options), [api, options]);

  return <DatavizApiContext.Provider value={value}>{children}</DatavizApiContext.Provider>;
};

const useDatavizApi = (): DatavizApi => {
  const api = useContext(DatavizApiContext);
  if (!api) {
    throw new Error('useDatavizApi must be used within DatavizApiProvider');
  }
  return api;
};

export { DatavizApiContext, DatavizApiProvider, useDatavizApi };
