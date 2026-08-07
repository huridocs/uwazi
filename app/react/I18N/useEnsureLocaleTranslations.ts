import { useEffect } from 'react';
import { useAtomValue, useStore } from 'jotai';
import type { ClientTranslationSchema } from '#app/istore.js';
import { get } from '#V2/api/translations/index.js';
import { translationsAtom } from '#V2/atoms/translationsAtoms.js';

const mergeLocaleTranslations = (
  current: ClientTranslationSchema[],
  incoming: ClientTranslationSchema[]
): ClientTranslationSchema[] => {
  const byLocale = new Map(current.map(translation => [translation.locale, translation]));
  incoming.forEach(translation => {
    if (!byLocale.has(translation.locale)) {
      byLocale.set(translation.locale, translation);
    }
  });
  return [...byLocale.values()];
};

const useEnsureLocaleTranslations = (language: string): boolean => {
  const store = useStore();
  const translations = useAtomValue(translationsAtom);
  const ready = translations.some(translation => translation.locale === language);

  useEffect(() => {
    if (ready) {
      return undefined;
    }

    let cancelled = false;
    get(undefined, { locale: language })
      .then(rows => {
        if (cancelled) return;
        store.set(translationsAtom, current => mergeLocaleTranslations(current ?? [], rows));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [language, ready, store]);

  return ready;
};

export { useEnsureLocaleTranslations, mergeLocaleTranslations };
