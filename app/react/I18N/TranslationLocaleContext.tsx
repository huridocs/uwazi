import React, { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';

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
  renderLocaleOverride = locale;
  useLayoutEffect(
    () => () => {
      if (renderLocaleOverride === locale) {
        renderLocaleOverride = null;
      }
    },
    [locale]
  );

  return (
    <TranslationLocaleContext.Provider value={locale}>{children}</TranslationLocaleContext.Provider>
  );
};

const useTranslationLocale = (routeLocale: string) =>
  useContext(TranslationLocaleContext) ?? routeLocale;

export { TranslationLocaleProvider, useTranslationLocale, getTranslationLocaleOverride };
