import { createContext, useContext } from 'react';

type SegmentedControlContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
  size: 'sm' | 'md';
};

const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

const useSegmentedControlContext = () => useContext(SegmentedControlContext);

export type { SegmentedControlContextValue };
export { SegmentedControlContext, useSegmentedControlContext };
