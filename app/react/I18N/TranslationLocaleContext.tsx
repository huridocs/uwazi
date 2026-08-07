import React, { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';
import { isClient } from '#app/utils/index.js';

const TranslationLocaleContext = createContext<string | null>(null);

let renderLocaleOverride: string | null = null;

const getTranslationLocaleOverride = () => renderLocaleOverride;

const TranslationLocaleProvider = ({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) => {
  // Imperative `t(..., false)` cannot use context; module bridge is client-only so SSR
  // cannot leave a stale override across requests (effects do not run on the server).
  if (isClient) {
    renderLocaleOverride = locale;
  }

  useLayoutEffect(() => {
    renderLocaleOverride = locale;
    return () => {
      if (renderLocaleOverride === locale) {
        renderLocaleOverride = null;
      }
    };
  }, [locale]);

  return (
    <TranslationLocaleContext.Provider value={locale}>{children}</TranslationLocaleContext.Provider>
  );
};

const useTranslationLocale = (routeLocale: string) =>
  useContext(TranslationLocaleContext) ?? routeLocale;

export { TranslationLocaleProvider, useTranslationLocale, getTranslationLocaleOverride };
