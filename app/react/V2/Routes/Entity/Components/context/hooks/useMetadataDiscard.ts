import { useCallback, useRef, useState, type MutableRefObject } from 'react';
import type { MetadataDirtyLeaveAction } from '../metadataEditingTypes.js';

const useMetadataDiscard = (
  isEditingRef: MutableRefObject<boolean>,
  isDirtyRef: MutableRefObject<boolean>,
  onCancelEdit: () => void
) => {
  const [pendingDiscardAction, setPendingDiscardAction] = useState<MetadataDirtyLeaveAction>();
  const pendingProceedRef = useRef<(() => void) | null>(null);
  const pendingStayRef = useRef<(() => void) | null>(null);

  const clearPending = useCallback(() => {
    pendingProceedRef.current = null;
    pendingStayRef.current = null;
    setPendingDiscardAction(undefined);
  }, []);

  const requestDiscard = useCallback(
    (action: MetadataDirtyLeaveAction, proceed?: () => void, onStay?: () => void) => {
      if (isEditingRef.current && isDirtyRef.current) {
        pendingProceedRef.current = proceed ?? null;
        pendingStayRef.current = onStay ?? null;
        setPendingDiscardAction(action);
        return;
      }
      if (action === 'discard') {
        onCancelEdit();
        return;
      }
      proceed?.();
    },
    [isDirtyRef, isEditingRef, onCancelEdit]
  );

  const confirmDiscard = useCallback(() => {
    const proceed = pendingProceedRef.current;
    clearPending();
    onCancelEdit();
    proceed?.();
  }, [clearPending, onCancelEdit]);

  const dismissDiscard = useCallback(() => {
    const stay = pendingStayRef.current;
    clearPending();
    stay?.();
  }, [clearPending]);

  return { pendingDiscardAction, requestDiscard, confirmDiscard, dismissDiscard, clearPending };
};

export { useMetadataDiscard };
