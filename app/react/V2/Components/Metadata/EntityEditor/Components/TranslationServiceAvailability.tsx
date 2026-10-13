import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { probeTranslationService } from '#V2/api/translationService/index.js';
import { useInstalledEntityLanguages } from './useInstalledEntityLanguages.js';

type TranslationCountListener = (count: number) => void;

type TranslationServiceAvailability = {
  available: boolean;
  markUnavailable: () => void;
  pendingCount: number;
  beginTranslation: () => void;
  endTranslation: () => void;
  cancelTranslations: () => void;
  subscribe: (listener: TranslationCountListener) => () => void;
  trackTranslation: (controller: AbortController) => () => void;
  cancelGeneration: number;
  cancelGenerationRef: RefObject<number>;
};

const idleCancelGeneration: RefObject<number> = { current: 0 };

const TranslationServiceAvailabilityContext = createContext<TranslationServiceAvailability>({
  available: true,
  markUnavailable: () => undefined,
  pendingCount: 0,
  beginTranslation: () => undefined,
  endTranslation: () => undefined,
  cancelTranslations: () => undefined,
  subscribe: () => () => undefined,
  trackTranslation: () => () => undefined,
  cancelGeneration: 0,
  cancelGenerationRef: idleCancelGeneration,
});

const useProbeTranslationService = (enabled: boolean, from?: string, to?: string) => {
  const [available, setAvailable] = useState(true);
  const markUnavailable = useCallback(() => setAvailable(false), []);

  useEffect(() => {
    if (!enabled || !from || !to || from === to) return undefined;
    let cancelled = false;
    void probeTranslationService(from, to).then(ok => {
      if (!cancelled && !ok) setAvailable(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, from, to]);

  return { available, markUnavailable };
};

const useTranslationServiceAvailability = () => useContext(TranslationServiceAvailabilityContext);

const useCountSubscribers = (pendingRef: RefObject<number>) => {
  const listenersRef = useRef(new Set<TranslationCountListener>());
  const abortsRef = useRef(new Set<AbortController>());
  const notify = useCallback((count: number) => {
    listenersRef.current.forEach(listener => listener(count));
  }, []);
  const subscribe = useCallback(
    (listener: TranslationCountListener) => {
      listenersRef.current.add(listener);
      listener(pendingRef.current);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    [pendingRef]
  );
  const trackTranslation = useCallback((controller: AbortController) => {
    abortsRef.current.add(controller);
    return () => {
      abortsRef.current.delete(controller);
    };
  }, []);
  const abortTranslations = useCallback(() => {
    abortsRef.current.forEach(controller => controller.abort());
    abortsRef.current.clear();
  }, []);
  return { notify, subscribe, trackTranslation, abortTranslations };
};

const useInFlightTranslations = () => {
  const pendingRef = useRef(0);
  const [pendingCount, setPendingCount] = useState(0);
  const cancelGenerationRef = useRef(0);
  const [cancelGeneration, setCancelGeneration] = useState(0);
  const { notify, subscribe, trackTranslation, abortTranslations } =
    useCountSubscribers(pendingRef);
  const publish = useCallback(
    (count: number) => {
      pendingRef.current = count;
      setPendingCount(count);
      notify(count);
    },
    [notify]
  );
  const beginTranslation = useCallback(() => {
    publish(pendingRef.current + 1);
  }, [publish]);
  const endTranslation = useCallback(() => {
    publish(Math.max(0, pendingRef.current - 1));
  }, [publish]);
  const cancelTranslations = useCallback(() => {
    cancelGenerationRef.current += 1;
    abortTranslations();
    publish(0);
    setCancelGeneration(cancelGenerationRef.current);
  }, [abortTranslations, publish]);
  return {
    pendingCount,
    beginTranslation,
    endTranslation,
    cancelTranslations,
    subscribe,
    trackTranslation,
    cancelGeneration,
    cancelGenerationRef,
  };
};

const TranslationServiceAvailabilityProvider = ({ children }: { children: React.ReactNode }) => {
  const { languages, canAutoTranslate } = useInstalledEntityLanguages();
  const { available, markUnavailable } = useProbeTranslationService(
    canAutoTranslate,
    languages[0],
    languages[1]
  );
  const {
    pendingCount,
    beginTranslation,
    endTranslation,
    cancelTranslations,
    subscribe,
    trackTranslation,
    cancelGeneration,
    cancelGenerationRef,
  } = useInFlightTranslations();
  const value = useMemo(
    () => ({
      available,
      markUnavailable,
      pendingCount,
      beginTranslation,
      endTranslation,
      cancelTranslations,
      subscribe,
      trackTranslation,
      cancelGeneration,
      cancelGenerationRef,
    }),
    [
      available,
      beginTranslation,
      cancelGeneration,
      cancelGenerationRef,
      cancelTranslations,
      endTranslation,
      trackTranslation,
      markUnavailable,
      pendingCount,
      subscribe,
    ]
  );
  return (
    <TranslationServiceAvailabilityContext.Provider value={value}>
      {children}
    </TranslationServiceAvailabilityContext.Provider>
  );
};

export { TranslationServiceAvailabilityProvider, useTranslationServiceAvailability };
