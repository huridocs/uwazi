import { useAtomValue } from 'jotai';
import { settingsAtom } from '#V2/atoms/index.js';
import { useOptionalEntityLanguage } from '#V2/Routes/Entity/Components/context/index.js';
import { installedLanguageKeys } from '../functions/entityTranslations.js';

const useInstalledEntityLanguages = () => {
  const languageContext = useOptionalEntityLanguage();
  const settings = useAtomValue(settingsAtom);
  return {
    languages: installedLanguageKeys(languageContext?.languages ?? settings.languages ?? []),
    current: languageContext?.language,
    canAutoTranslate: Boolean(settings.features?.translationService),
  };
};

export { useInstalledEntityLanguages };
