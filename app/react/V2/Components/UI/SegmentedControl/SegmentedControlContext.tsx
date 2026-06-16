import React, { createContext, useContext, type ReactNode } from 'react';

type SegmentedControlContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
};

const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

const useSegmentedControlContext = () => useContext(SegmentedControlContext);

export type { SegmentedControlContextValue };
export { SegmentedControlContext, useSegmentedControlContext };
