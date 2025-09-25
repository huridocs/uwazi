import React, { ReactNode } from 'react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

type TestProviderProps = {
  initialValues: any[];
  children: ReactNode;
};

const HydrateAtoms = ({ initialValues, children }: TestProviderProps) => {
  useHydrateAtoms(initialValues);
  return children;
};

const TestAtomStoreProvider = ({ initialValues, children }: TestProviderProps) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
);

export { TestAtomStoreProvider };
