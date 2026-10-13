import { useCallback, useRef, useState, type RefObject } from 'react';

const useTranslationStop = (pendingRef: RefObject<boolean>) => {
  const cancelRef = useRef<() => void>(() => undefined);
  const actionRef = useRef<(() => void) | null>(null);
  const [translationStopOpen, setTranslationStopOpen] = useState(false);

  const requestStopTranslations = useCallback(
    (run: () => void) => {
      if (!pendingRef.current) {
        run();
        return;
      }
      actionRef.current = run;
      setTranslationStopOpen(true);
    },
    [pendingRef]
  );

  const confirmStopTranslations = useCallback(() => {
    const run = actionRef.current;
    actionRef.current = null;
    setTranslationStopOpen(false);
    cancelRef.current();
    run?.();
  }, []);

  const dismissStopTranslations = useCallback(() => {
    actionRef.current = null;
    setTranslationStopOpen(false);
  }, []);

  const registerCancelTranslations = useCallback((cancel: () => void) => {
    cancelRef.current = cancel;
    return () => {
      if (cancelRef.current === cancel) cancelRef.current = () => undefined;
    };
  }, []);

  const cancelTranslations = useCallback(() => {
    cancelRef.current();
  }, []);

  return {
    translationStopOpen,
    requestStopTranslations,
    confirmStopTranslations,
    dismissStopTranslations,
    registerCancelTranslations,
    cancelTranslations,
  };
};

export { useTranslationStop };
