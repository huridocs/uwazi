import { useAtomValue } from 'jotai';
import { localeAtom, settingsAtom } from '#V2/atoms/index.js';

type EditLanguage = { key: string; label: string; default?: boolean };

const useEditLanguages = () => {
  const settings = useAtomValue(settingsAtom);
  const locale = useAtomValue(localeAtom);
  const installed = (settings.languages ?? []).flatMap(language =>
    language.key && !language.installing
      ? [{ key: language.key, label: language.label || language.key, default: language.default }]
      : []
  );
  const fallback = installed.find(language => language.default) ?? installed[0];
  const active = installed.some(language => language.key === locale)
    ? locale
    : (fallback?.key ?? locale);
  const languages = [
    ...installed.filter(language => language.key === active),
    ...installed.filter(language => language.key !== active),
  ];

  return { active, languages };
};

export type { EditLanguage };
export { useEditLanguages };
