import React, { createContext, ReactNode, useContext } from 'react';
import { services } from './singleton.js';
import type { V2Services } from './types.js';

const ServicesContext = createContext<V2Services>(services);

type ServicesProviderProps = {
  value?: V2Services;
  children: ReactNode;
};

const ServicesProvider = ({ value = services, children }: ServicesProviderProps) => (
  <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
);

const useServices = (): V2Services => useContext(ServicesContext);

export { ServicesProvider, useServices };
