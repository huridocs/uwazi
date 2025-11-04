import { LanguageISO6391, LanguageSchema } from 'shared/types/commonTypes';
import {
  Language,
  LanguageCode,
  availableLanguages,
  otherLanguageSchema,
} from './availableLanguages';
import { LanguageISO6393 } from './languageISO639_3';

class LanguageUtils {
  private static createLanguageIndex(code: LanguageCode) {
    return availableLanguages.reduce(
      (prev, next) => {
        if (!next[code]) return prev;

        return {
          ...prev,
          [next[code]]: { ...next },
        };
      },
      {} as Record<string, Language>
    );
  }

  private static ISO639_3Index = this.createLanguageIndex('ISO639_3');

  private static ISO639_1Index = this.createLanguageIndex('ISO639_1');

  private static elasticIndex = this.createLanguageIndex('elastic');

  private static uniqueValues(array: string[]) {
    return Array.from(new Set(array));
  }

  static getByCode(code: LanguageCode = 'elastic') {
    return availableLanguages.filter(item => Boolean(item[code]));
  }

  static getCodes(languages: LanguageSchema[], languageCode: LanguageCode): string[] {
    return this.uniqueValues(languages.map(item => item[languageCode]) as string[]);
  }

  static fromISO639_3(ISO639_3: LanguageISO6393 | string, enableFallback = true) {
    const fallback = enableFallback ? otherLanguageSchema : null;

    return this.ISO639_3Index[ISO639_3] || fallback;
  }

  static fromISO639_1(ISO639_1: LanguageISO6391 | string) {
    return this.ISO639_1Index[ISO639_1];
  }

  static fromElastic(elastic: string) {
    return this.elasticIndex[elastic] || otherLanguageSchema;
  }
}

export { LanguageUtils };
