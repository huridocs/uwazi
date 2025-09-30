import { DateTime } from 'luxon';

const normalizeLocaleForDisplay = (locale?: string) => {
  if (!locale) return 'en';
  // Ensure Arabic locales render Arabic-Indic digits deterministically in all environments
  if (locale.startsWith('ar') && !/\bu-nu-/.test(locale)) return 'ar-u-nu-arab';
  return locale;
};

const secondsToDate = (timestamp: number | string, locale?: string) =>
  DateTime.fromSeconds(Number(timestamp))
    .setZone('UTC')
    .toLocaleString(DateTime.DATE_FULL, { locale: normalizeLocaleForDisplay(locale) });

const secondsToISODate = (timestamp: number | string) =>
  DateTime.fromSeconds(Number(timestamp)).setZone('UTC').toISODate();

const parseLocalizedDate = (dateString: string | undefined, language: string = 'en') => {
  if (!dateString) {
    return null;
  }
  const localeMap: Record<string, string> = {
    en: 'en',
    eng: 'en',
    english: 'en',
    el: 'el',
    ell: 'el',
    greek: 'el',
    gre: 'el',
    es: 'es',
    spa: 'es',
    spanish: 'es',
    español: 'es',
    fr: 'fr',
    fra: 'fr',
    french: 'fr',
    français: 'fr',
    de: 'de',
    deu: 'de',
    ger: 'de',
    german: 'de',
    deutsch: 'de',
    it: 'it',
    ita: 'it',
    italian: 'it',
    italiano: 'it',
    pt: 'pt',
    por: 'pt',
    portuguese: 'pt',
    português: 'pt',
    ru: 'ru',
    rus: 'ru',
    russian: 'ru',
    русский: 'ru',
    ar: 'ar',
    ara: 'ar',
    arabic: 'ar',
    العربية: 'ar',
    zh: 'zh',
    chi: 'zh',
    chinese: 'zh',
    中文: 'zh',
    'zh-cn': 'zh',
    'zh-tw': 'zh',
    'zh-hans': 'zh',
    'zh-hant': 'zh',
    ja: 'ja',
    jpn: 'ja',
    japanese: 'ja',
    日本語: 'ja',
    ko: 'ko',
    kor: 'ko',
    korean: 'ko',
    한국어: 'ko',
    th: 'th',
    tha: 'th',
    thai: 'th',
    ไทย: 'th',
    tr: 'tr',
    tur: 'tr',
    turkish: 'tr',
    türkçe: 'tr',
    nl: 'nl',
    nld: 'nl',
    dut: 'nl',
    dutch: 'nl',
    nederlands: 'nl',
    sv: 'sv',
    swe: 'sv',
    swedish: 'sv',
    svenska: 'sv',
    da: 'da',
    dan: 'da',
    danish: 'da',
    dansk: 'da',
    no: 'nb',
    nor: 'nb',
    norwegian: 'nb',
    norsk: 'nb',
    nb: 'nb',
    nob: 'nb',
    bokmål: 'nb',
    nn: 'nn',
    nno: 'nn',
    nynorsk: 'nn',
    fi: 'fi',
    fin: 'fi',
    finnish: 'fi',
    suomi: 'fi',
    pl: 'pl',
    pol: 'pl',
    polish: 'pl',
    polski: 'pl',
    cs: 'cs',
    cze: 'cs',
    ces: 'cs',
    czech: 'cs',
    čeština: 'cs',
    sk: 'sk',
    slk: 'sk',
    slo: 'sk',
    slovak: 'sk',
    slovenčina: 'sk',
    hu: 'hu',
    hun: 'hu',
    hungarian: 'hu',
    magyar: 'hu',
    ro: 'ro',
    ron: 'ro',
    rum: 'ro',
    romanian: 'ro',
    română: 'ro',
    bg: 'bg',
    bul: 'bg',
    bulgarian: 'bg',
    български: 'bg',
    hr: 'hr',
    hrv: 'hr',
    croatian: 'hr',
    hrvatski: 'hr',
    sl: 'sl',
    slv: 'sl',
    slovenian: 'sl',
    slovenščina: 'sl',
    et: 'et',
    est: 'et',
    estonian: 'et',
    eesti: 'et',
    lv: 'lv',
    lav: 'lv',
    latvian: 'lv',
    latviešu: 'lv',
    lt: 'lt',
    lit: 'lt',
    lithuanian: 'lt',
    lietuvių: 'lt',
    uk: 'uk',
    ukr: 'uk',
    ukrainian: 'uk',
    українська: 'uk',
    be: 'be',
    bel: 'be',
    belarusian: 'be',
    беларуская: 'be',
    mk: 'mk',
    mkd: 'mk',
    macedonian: 'mk',
    македонски: 'mk',
    sr: 'sr',
    srp: 'sr',
    serbian: 'sr',
    српски: 'sr',
    bs: 'bs',
    bos: 'bs',
    bosnian: 'bs',
    bosanski: 'bs',
    sq: 'sq',
    sqi: 'sq',
    albanian: 'sq',
    shqip: 'sq',
    mt: 'mt',
    mlt: 'mt',
    maltese: 'mt',
    malti: 'mt',
    is: 'is',
    isl: 'is',
    icelandic: 'is',
    íslenska: 'is',
    ga: 'ga',
    gle: 'ga',
    irish: 'ga',
    gaeilge: 'ga',
    cy: 'cy',
    cym: 'cy',
    welsh: 'cy',
    cymraeg: 'cy',
    eu: 'eu',
    eus: 'eu',
    basque: 'eu',
    euskera: 'eu',
    ca: 'ca',
    cat: 'ca',
    catalan: 'ca',
    català: 'ca',
    gl: 'gl',
    glg: 'gl',
    galician: 'gl',
    galego: 'gl',
  };

  const locale = localeMap[language.toLowerCase()] || 'en';

  // Clean up the date string - remove common ordinals and suffixes
  let cleanedDate = dateString
    // Greek ordinals
    .replace(/ης\s/g, ' ') // Remove "ης" (18ης -> 18)
    .replace(/η\s/g, ' ') // Remove "η" (1η -> 1)
    .replace(/ος\s/g, ' ') // Remove "ος" (1ος -> 1)
    .replace(/ο\s/g, ' ') // Remove "ο" (1ο -> 1)
    // English ordinals
    .replace(/(\d+)(st|nd|rd|th)\s/g, '$1 ') // Remove "1st", "2nd", "3rd", "4th"
    // Spanish ordinals
    .replace(/(\d+)(º|ª)\s/g, '$1 ') // Remove "1º", "2ª"
    // French ordinals
    .replace(/(\d+)(er|ère|ème)\s/g, '$1 ') // Remove "1er", "1ère", "2ème"
    // German ordinals
    .replace(/(\d+)(\.)\s/g, '$1 ') // Remove "1.", "2."
    .trim();

  // Special handling for Spanish "de" format
  let spanishCleanedDate = cleanedDate
    .replace(/\s+de\s+/g, ' ') // Remove "de" particles (18 de julio de 2025 -> 18 julio 2025)
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  // Common date formats that work across languages
  const formats = [
    'd MMMM yyyy', // 18 July 2025, 18 Ιουλίου 2025
    'd MMM yyyy', // 18 Jul 2025, 18 Ιουλ 2025
    'dd MMMM yyyy', // 18 July 2025, 18 Ιουλίου 2025
    'dd MMM yyyy', // 18 Jul 2025, 18 Ιουλ 2025
    'd MMMM, yyyy', // 18 July, 2025
    'dd MMMM, yyyy', // 18 July, 2025
    'MMMM d, yyyy', // July 18, 2025
    'MMMM dd, yyyy', // July 18, 2025
    'd de MMMM de yyyy', // 18 de julio de 2025 (Spanish)
    'dd de MMMM de yyyy', // 18 de julio de 2025 (Spanish)
    'd de MMM de yyyy', // 18 de jul de 2025 (Spanish)
    'dd de MMM de yyyy', // 18 de jul de 2025 (Spanish)
    'dd/MM/yyyy', // 18/07/2025
    'd/MM/yyyy', // 8/07/2025
    'MM/dd/yyyy', // 07/18/2025
    'M/d/yyyy', // 7/8/2025
    'yyyy-MM-dd', // 2025-07-18
    'dd-MM-yyyy', // 18-07-2025
    'd-MM-yyyy', // 8-07-2025
    'MM-dd-yyyy', // 07-18-2025
    'M-d-yyyy', // 7-8-2025
    'yyyy/MM/dd', // 2025/07/18
    'dd.MM.yyyy', // 18.07.2025
    'd.M.yyyy', // 8.7.2025
    'd.MM.yyyy', // 8.07.2025
    'yyyy.MM.dd', // 2025.07.18
  ];

  // Try parsing with Spanish cleaned date first (for Spanish locale)
  if (locale === 'es') {
    const spanishResult = formats.find(format => {
      const parsed = DateTime.fromFormat(spanishCleanedDate, format, { locale, zone: 'UTC' });
      return parsed.isValid;
    });
    if (spanishResult) {
      const parsed = DateTime.fromFormat(spanishCleanedDate, spanishResult, {
        locale,
        zone: 'UTC',
      });
      return parsed.toSeconds();
    }
  }

  // Try parsing with cleaned date first
  const cleanedResult = formats.find(format => {
    const parsed = DateTime.fromFormat(cleanedDate, format, { locale, zone: 'UTC' });
    return parsed.isValid;
  });
  if (cleanedResult) {
    const parsed = DateTime.fromFormat(cleanedDate, cleanedResult, { locale, zone: 'UTC' });
    return parsed.toSeconds();
  }

  // Try with original string
  const originalResult = formats.find(format => {
    const parsed = DateTime.fromFormat(dateString, format, { locale, zone: 'UTC' });
    return parsed.isValid;
  });
  if (originalResult) {
    const parsed = DateTime.fromFormat(dateString, originalResult, { locale, zone: 'UTC' });
    return parsed.toSeconds();
  }

  // Try with English locale as fallback
  if (locale !== 'en') {
    const englishResult = formats.find(format => {
      const parsed = DateTime.fromFormat(cleanedDate, format, { locale: 'en', zone: 'UTC' });
      return parsed.isValid;
    });
    if (englishResult) {
      const parsed = DateTime.fromFormat(cleanedDate, englishResult, { locale: 'en', zone: 'UTC' });
      return parsed.toSeconds();
    }
  }

  // Fallback to ISO parsing
  try {
    const parsed = DateTime.fromISO(dateString, { zone: 'UTC' });
    if (parsed.isValid) {
      return parsed.toSeconds();
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return null;
};

export { secondsToDate, secondsToISODate, parseLocalizedDate };
