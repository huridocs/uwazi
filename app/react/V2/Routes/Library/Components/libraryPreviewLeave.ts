import { atom, useSetAtom, useStore } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useMetadataEditing } from '#V2/Routes/Entity/Components/context/MetadataEditingContext.js';

type LibraryPreviewLeave = (proceed: () => void) => void;

const libraryPreviewLeaveAtom = atom<LibraryPreviewLeave | null>(null);

const useRegisterLibraryLeave = () => {
  const { requestStopTranslations, requestDiscard, isDirty, isEditing } = useMetadataEditing();
  const snapshot = useRef({ isDirty, isEditing });
  snapshot.current = { isDirty, isEditing };
  const setGuard = useSetAtom(libraryPreviewLeaveAtom);

  useEffect(() => {
    const leave = (proceed: () => void) => {
      requestStopTranslations(() => {
        const blocked = snapshot.current.isEditing && snapshot.current.isDirty;
        if (blocked) {
          requestDiscard('discard', proceed);
          return;
        }
        if (snapshot.current.isEditing) requestDiscard('discard');
        proceed();
      });
    };
    setGuard(() => leave);
    return () => setGuard(null);
  }, [requestDiscard, requestStopTranslations, setGuard]);
};

const useLibraryLeaveRequest = () => {
  const store = useStore();
  return useCallback(
    (proceed: () => void) => {
      const guard = store.get(libraryPreviewLeaveAtom);
      if (!guard) {
        proceed();
        return;
      }
      guard(proceed);
    },
    [store]
  );
};

export { useLibraryLeaveRequest, useRegisterLibraryLeave };
