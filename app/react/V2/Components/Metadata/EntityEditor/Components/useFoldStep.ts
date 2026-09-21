import { useState } from 'react';
import { useResizeWidth } from '../hooks/useResizeWidth.js';
import { foldStep, type FoldStep } from './multiLanguageFieldHelpers.js';

const useFoldStep = (): {
  step: FoldStep;
  availRef: (element: HTMLElement | null) => void;
  probe0: (element: HTMLElement | null) => void;
  probe1: (element: HTMLElement | null) => void;
  probe2: (element: HTMLElement | null) => void;
} => {
  const [availW, setAvailW] = useState(0);
  const [w0, setW0] = useState(0);
  const [w1, setW1] = useState(0);
  const [w2, setW2] = useState(0);
  const availRef = useResizeWidth(setAvailW);
  const probe0 = useResizeWidth(setW0);
  const probe1 = useResizeWidth(setW1);
  const probe2 = useResizeWidth(setW2);
  return { step: foldStep({ availW, w0, w1, w2 }), availRef, probe0, probe1, probe2 };
};

export { useFoldStep };
