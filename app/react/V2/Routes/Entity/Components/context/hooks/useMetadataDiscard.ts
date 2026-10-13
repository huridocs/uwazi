import { useCallback, useRef, useState, type RefObject } from 'react';
import type { MetadataDirtyLeaveAction } from '../metadataEditingTypes.js';

type DiscardRefs = {
  isEditing: RefObject<boolean>;
  isDirty: RefObject<boolean>;
};

const useMetadataDiscard = (refs: DiscardRefs, onCancelEdit: () => void) => {
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
      if (refs.isEditing.current && refs.isDirty.current) {
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
    [onCancelEdit, refs]
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
