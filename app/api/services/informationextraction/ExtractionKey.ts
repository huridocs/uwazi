import { LanguageISO6391 } from 'shared/types/commonTypes';

type CreateInput = {
  entitySharedId: string;
  language: LanguageISO6391;
};

export class ExtractionKey {
  private static SEPARATOR = '___';

  key: string;

  entitySharedId: string;

  language: LanguageISO6391;

  constructor(key: string) {
    this.key = key;
    const { entitySharedId, language } = ExtractionKey.deComposeKey(key);

    this.entitySharedId = entitySharedId;
    this.language = language;
  }

  private static composeKey(entitySharedId: string, language: string) {
    return [entitySharedId, language].join(ExtractionKey.SEPARATOR);
  }

  private static deComposeKey(key: string) {
    const [entitySharedId, language] = key.split(ExtractionKey.SEPARATOR);

    return { entitySharedId, language: language as LanguageISO6391 };
  }

  static create({ entitySharedId, language }: CreateInput) {
    const key = ExtractionKey.composeKey(entitySharedId, language);

    return new ExtractionKey(key);
  }
}
