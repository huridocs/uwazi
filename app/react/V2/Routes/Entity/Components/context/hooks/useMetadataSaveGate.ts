import { useCallback, useRef, useState } from 'react';

const useMetadataSaveGate = () => {
  const saveAbortRef = useRef<AbortController | null>(null);
  const saveInFlightRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const tryBeginSave = useCallback((): AbortController | null => {
    if (saveInFlightRef.current) return null;
    saveInFlightRef.current = true;
    setIsSaving(true);
    saveAbortRef.current?.abort();
    const controller = new AbortController();
    saveAbortRef.current = controller;
    return controller;
  }, []);

  const endSave = useCallback(() => {
    saveInFlightRef.current = false;
    saveAbortRef.current = null;
    setIsSaving(false);
  }, []);

  const abortSave = useCallback(() => {
    saveAbortRef.current?.abort();
    saveAbortRef.current = null;
    saveInFlightRef.current = false;
  }, []);

  return { isSaving, setIsSaving, saveInFlightRef, tryBeginSave, endSave, abortSave };
};

export { useMetadataSaveGate };
