import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { DeleteResult, UpdateResult } from 'mongodb';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';

export type BulkDeleteKeysByContext = {
  contextId: string;
  keysToDelete: string[];
}[];

export type UpdateKeysByContextProps = {
  contextId: string;
  keyChanges: { [before: string]: string };
  defaultLanguage: LanguageISO6391;
};

export interface TranslationsDataSource {
  insert(translations: Translation[]): Promise<Translation[]>;
  upsert(translations: Translation[]): Promise<Translation[]>;

  getAll(): ResultSet<Translation>;
  getByLanguage(language: string): ResultSet<Translation>;
  getByContext(context: string): ResultSet<Translation>;
  getContextAndKeys(contextId: string, keys: string[]): ResultSet<Translation>;

  deleteByContextId(contextId: string): Promise<DeleteResult>;
  deleteByLanguage(language: string): Promise<DeleteResult>;
  deleteKeysByContext(contextId: string, keysToDelete: string[]): Promise<DeleteResult>;
  bulkDeleteKeysByContext(props: BulkDeleteKeysByContext): Promise<void>;

  updateContextLabel(contextId: string, contextLabel: string): Promise<UpdateResult<Translation>>;
  updateKeysByContext(contextId: string, keyChanges: { [from: string]: string }): Promise<void>;
  updateKeysByContextV2(props: UpdateKeysByContextProps): Promise<void>;

  calculateNonexistentKeys(contextId: string, keys: string[]): Promise<string[]>;
}
