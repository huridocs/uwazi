import { availableLanguages } from './availableLanguages.js';
import { LanguageUtils } from './languageUtils.js';

const formatLanguageOptionLabel = (iso6391: string, uiLocale: string): string => {
  const code = iso6391.toUpperCase();
  const locale = uiLocale || 'en';
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language' }).of(iso6391);
    if (!name) {
      return code;
    }
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} - ${code}`;
  } catch {
    return code;
  }
};

const formatLanguageLabelFromCode = (language: string | undefined, uiLocale: string): string => {
  if (!language) {
    return '—';
  }
  if (language === 'other') {
    return 'other';
  }

  const iso1 =
    LanguageUtils.fromISO639_3(language, false)?.ISO639_1 ||
    availableLanguages.find(item => item.ISO639_1 === language)?.ISO639_1;

  if (!iso1) {
    return language.toUpperCase();
  }

  return formatLanguageOptionLabel(iso1, uiLocale);
};

export { formatLanguageOptionLabel, formatLanguageLabelFromCode };
