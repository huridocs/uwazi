import {
  assertCompleteTranslationContext,
  Translation,
  TranslationContext,
} from '#api/core/domain/translation/Translation.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

export type TranslationRow = {
  _id: string;
  language: LanguageISO6391;
  key: string;
  value: string;
  context_id: string;
  context_type: TranslationContext['type'];
  context_label: string;
};

export class PostgresTranslationMapper {
  static toDomain(row: TranslationRow): Translation {
    return new Translation(row.key, row.value ?? '', row.language, {
      id: row.context_id,
      type: row.context_type,
      label: row.context_label,
    });
  }

  static toDBO(translation: Translation, id: string): TranslationRow {
    assertCompleteTranslationContext(translation.context);
    return {
      _id: id,
      language: translation.language,
      key: translation.key,
      value: translation.value,
      context_id: translation.context.id,
      context_type: translation.context.type,
      context_label: translation.context.label,
    };
  }
}
