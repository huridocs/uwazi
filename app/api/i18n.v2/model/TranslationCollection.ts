import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Translation } from './Translation';

export class TranslationCollection {
  private readonly translations: Translation[];

  private readonly byLanguageAndKey: Map<LanguageISO6391, Map<string, string>>;

  constructor(translations: Translation[]) {
    this.translations = translations;
    this.byLanguageAndKey = this.buildHashMaps(translations);
  }

  private buildHashMaps(translations: Translation[]): Map<LanguageISO6391, Map<string, string>> {
    const map = new Map<LanguageISO6391, Map<string, string>>();

    translations.forEach(translation => {
      const byKey = map.get(translation.language) || new Map<string, string>();
      byKey.set(translation.key, translation.value);
      map.set(translation.language, byKey);
    });

    return map;
  }

  getTranslation(language: LanguageISO6391, key: string, fallback?: string): string {
    const byKey = this.byLanguageAndKey.get(language);
    if (!byKey) {
      return fallback || key;
    }

    return byKey.get(key) || fallback || key;
  }

  getTranslations(language: LanguageISO6391): Map<string, string> {
    return this.byLanguageAndKey.get(language) || new Map<string, string>();
  }

  getAllTranslations(): Translation[] {
    return this.translations;
  }
}
