import { useCallback, useRef, useState, type SetStateAction } from 'react';

const useMetadataEditingFlags = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [translationsPending, setTranslationsPendingState] = useState(false);
  const isEditingRef = useRef(false);
  const isDirtyRef = useRef(false);
  const translationsPendingRef = useRef(false);
  isEditingRef.current = isEditing;
  isDirtyRef.current = isDirty;
  const setTranslationsPending = useCallback((value: SetStateAction<boolean>) => {
    const next = typeof value === 'function' ? value(translationsPendingRef.current) : value;
    translationsPendingRef.current = next;
    setTranslationsPendingState(next);
  }, []);
  return {
    isEditing,
    setIsEditing,
    isDirty,
    setIsDirty,
    isEditingRef,
    isDirtyRef,
    translationsPending,
    setTranslationsPending,
    translationsPendingRef,
  };
};

export { useMetadataEditingFlags };
