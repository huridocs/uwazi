import { availableLanguages } from './availableLanguages.js';
import { LanguageUtils } from './languageUtils.js';

const displayNamesByLocale = new Map<string, Intl.DisplayNames>();

const getLanguageDisplayNames = (locale: string): Intl.DisplayNames | undefined => {
  const cached = displayNamesByLocale.get(locale);
  if (cached) {
    return cached;
  }
  try {
    const names = new Intl.DisplayNames([locale], { type: 'language' });
    displayNamesByLocale.set(locale, names);
    return names;
  } catch {
    return undefined;
  }
};

const formatLanguageName = (iso6391: string, uiLocale: string): string => {
  const code = iso6391.toUpperCase();
  const name = getLanguageDisplayNames(uiLocale || 'en')?.of(iso6391);
  if (!name) {
    return code;
  }
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
};

const formatLanguageOptionLabel = (iso6391: string, uiLocale: string): string => {
  const code = iso6391.toUpperCase();
  const name = formatLanguageName(iso6391, uiLocale);
  return name === code ? code : `${name} - ${code}`;
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

  return formatLanguageName(iso1, uiLocale);
};

export { formatLanguageName, formatLanguageOptionLabel, formatLanguageLabelFromCode };
