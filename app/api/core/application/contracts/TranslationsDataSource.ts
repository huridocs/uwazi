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

  getAll(): Promise<Translation[]>;
  getByLanguage(language: string): Promise<Translation[]>;
  getByLanguageExcludingContextTypes(
    language: string,
    types: TranslationContext['type'][]
  ): Promise<Translation[]>;
  getByContext(context: string): Promise<Translation[]>;
  getByLanguageAndContext(language: string, contextId: string): Promise<Translation[]>;
  getContextAndKeys(contextId: string, keys: string[]): Promise<Translation[]>;

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
