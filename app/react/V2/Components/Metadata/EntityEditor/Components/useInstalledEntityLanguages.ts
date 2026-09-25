import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { useOptionalEntityLanguage } from '#V2/Routes/Entity/Components/context/index.js';
import { installedLanguageKeys } from '../functions/entityTranslations.js';

const useInstalledEntityLanguages = () => {
  const languageContext = useOptionalEntityLanguage();
  const settings = useAtomValue(settingsAtom);
  const locale = useAtomValue(localeAtom);
  const contextLanguages = languageContext?.languages;
  const settingsLanguages = settings.languages;
  const languages = useMemo(
    () => installedLanguageKeys(contextLanguages ?? settingsLanguages ?? []),
    [contextLanguages, settingsLanguages]
  );
  const fallback =
    languages.find(language => language === locale) ??
    settingsLanguages?.find(language => language.default)?.key ??
    languages[0];
  return {
    languages,
    current: languageContext?.language ?? fallback,
    canAutoTranslate: Boolean(settings.features?.translationService),
  };
};

export { useInstalledEntityLanguages };
