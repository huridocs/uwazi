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
    // @ts-expect-error TS(2786): 'HydrateAtoms' cannot be used as a JSX component.
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
);

export { TestAtomStoreProvider };
