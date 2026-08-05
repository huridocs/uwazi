type EmbedLanguage = {
  key: string;
  default?: boolean;
};

export type ResolveEmbedLocaleInput = {
  localeQuery?: string | string[];
  contentLanguage?: string;
  cookieLocale?: string;
  acceptLanguage?: string;
  languages: EmbedLanguage[];
};

const firstQueryLocale = (localeQuery?: string | string[]): string | undefined => {
  if (typeof localeQuery === 'string') {
    return localeQuery;
  }
  if (Array.isArray(localeQuery)) {
    return localeQuery[0];
  }
  return undefined;
};

const acceptLanguagePrimary = (acceptLanguage?: string): string | undefined => {
  if (!acceptLanguage) {
    return undefined;
  }
  const [primary] = acceptLanguage.split(',');
  return primary?.trim().split('-')[0];
};

const languageKeys = (languages: EmbedLanguage[]) => languages.map(language => language.key);

const defaultLanguageKey = (languages: EmbedLanguage[]) =>
  languages.find(language => language.default)?.key ?? languages[0]?.key ?? 'en';

export const resolveEmbedLocale = (input: ResolveEmbedLocaleInput): string => {
  const keys = languageKeys(input.languages);
  const fallback = defaultLanguageKey(input.languages);

  const candidates = [
    firstQueryLocale(input.localeQuery),
    input.contentLanguage,
    input.cookieLocale,
    acceptLanguagePrimary(input.acceptLanguage),
  ].filter((value): value is string => Boolean(value));

  const match = candidates.find(candidate => keys.includes(candidate));
  return match ?? fallback;
};
