import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { settingsAtom } from '#V2/atoms/index.js';
import { useOptionalEntityLanguage } from '#V2/Routes/Entity/Components/context/index.js';
import { installedLanguageKeys } from '../functions/entityTranslations.js';

const useInstalledEntityLanguages = () => {
  const languageContext = useOptionalEntityLanguage();
  const settings = useAtomValue(settingsAtom);
  const contextLanguages = languageContext?.languages;
  const settingsLanguages = settings.languages;
  const languages = useMemo(
    () => installedLanguageKeys(contextLanguages ?? settingsLanguages ?? []),
    [contextLanguages, settingsLanguages]
  );
  return {
    languages,
    current: languageContext?.language,
    canAutoTranslate: Boolean(settings.features?.translationService),
  };
};

export { useInstalledEntityLanguages };
