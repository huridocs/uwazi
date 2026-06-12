import { useCallback, useMemo, useState } from 'react';
import { buildContextSummary, CONTEXT_ADD_LABELS, contextKindForOption } from './bertContextUtils.js';
import type { ContextAddOptionId, ContextChip, ContextScopeMode } from './types.js';

type UseBertContextOptions = {
  initialContextChips?: ContextChip[];
};

const useBertContext = ({ initialContextChips = [] }: UseBertContextOptions = {}) => {
  const [contextMode, setContextMode] = useState<ContextScopeMode>('auto');
  const [contextChips, setContextChips] = useState<ContextChip[]>(() =>
    initialContextChips.map(chip => ({ ...chip }))
  );

  const contextModeLabel = contextMode === 'auto' ? 'Auto' : 'This document';
  const contextSummary = useMemo(() => buildContextSummary(contextChips), [contextChips]);

  const removeContextChip = useCallback((chipId: string) => {
    setContextChips(current => current.filter(chip => chip.id !== chipId));
  }, []);

  const addContextOption = useCallback((optionId: ContextAddOptionId) => {
    const label = CONTEXT_ADD_LABELS[optionId];
    if (!label) return;

    const chipId = `chip-${optionId}`;
    setContextChips(current => {
      if (current.some(chip => chip.id === chipId)) return current;

      return [
        ...current,
        {
          id: chipId,
          label,
          kind: contextKindForOption(optionId),
          removable: true,
        },
      ];
    });
  }, []);

  return {
    contextMode,
    contextModeLabel,
    contextChips,
    contextSummary,
    setContextMode,
    removeContextChip,
    addContextOption,
  };
};

export { useBertContext };
export type { UseBertContextOptions };
