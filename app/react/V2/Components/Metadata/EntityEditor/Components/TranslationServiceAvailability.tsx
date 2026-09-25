import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { probeTranslationService } from '#V2/api/translationService/index.js';
import { useInstalledEntityLanguages } from './useInstalledEntityLanguages.js';

type TranslationServiceAvailability = {
  available: boolean;
  markUnavailable: () => void;
};

const TranslationServiceAvailabilityContext = createContext<TranslationServiceAvailability>({
  available: true,
  markUnavailable: () => undefined,
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

const TranslationServiceAvailabilityProvider = ({ children }: { children: React.ReactNode }) => {
  const { languages, canAutoTranslate } = useInstalledEntityLanguages();
  const { available, markUnavailable } = useProbeTranslationService(
    canAutoTranslate,
    languages[0],
    languages[1]
  );
  const value = useMemo(() => ({ available, markUnavailable }), [available, markUnavailable]);
  return (
    <TranslationServiceAvailabilityContext.Provider value={value}>
      {children}
    </TranslationServiceAvailabilityContext.Provider>
  );
};

const useTranslationServiceAvailability = () => useContext(TranslationServiceAvailabilityContext);

export { TranslationServiceAvailabilityProvider, useTranslationServiceAvailability };
