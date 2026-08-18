import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Translation, TranslationContext } from '#api/core/domain/translation/Translation.js';
import { TranslationContextModel } from '#api/core/domain/translation/TranslationContextModel.js';

export type BulkDeleteKeysByContext = {
  contextId: string;
  keysToDelete: string[];
}[];

export interface TranslationsDataSource {
  insert(translations: Translation[]): Promise<Translation[]>;
  upsert(translations: Translation[]): Promise<Translation[]>;

  getAll(): ResultSet<Translation>;
  getByLanguage(language: string): ResultSet<Translation>;
  getByLanguageExcludingContextTypes(
    language: string,
    types: TranslationContext['type'][]
  ): ResultSet<Translation>;
  getByContext(context: string): ResultSet<Translation>;
  getByLanguageAndContext(language: string, contextId: string): ResultSet<Translation>;
  getContextAndKeys(contextId: string, keys: string[]): ResultSet<Translation>;

  deleteByContextId(contextId: string): Promise<void>;
  deleteByLanguage(language: string): Promise<void>;
  bulkDeleteKeysByContext(props: BulkDeleteKeysByContext): Promise<void>;

  calculateNonexistentKeys(contextId: string, keys: string[]): Promise<string[]>;

  cloneForLanguage(from: LanguageISO6391, to: LanguageISO6391): Promise<void>;

  // Domain model methods
  getContext(
    contextInfo: TranslationContext,
    languages: LanguageISO6391[],
    defaultLanguage: LanguageISO6391
  ): Promise<TranslationContextModel>;
  updateContext(context: TranslationContextModel): Promise<void>;
}
