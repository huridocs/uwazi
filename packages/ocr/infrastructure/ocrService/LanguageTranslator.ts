import { LanguageUtils } from '#shared/language/index.js';

/** Files keep ISO 639-3 languages; the service speaks ISO 639-1. */
class LanguageTranslator {
  static toService(iso6393: string): string | undefined {
    return LanguageUtils.fromISO639_3(iso6393, false)?.ISO639_1 || undefined;
  }
}

export { LanguageTranslator };
