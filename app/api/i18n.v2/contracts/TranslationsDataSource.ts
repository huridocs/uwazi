import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Translation } from '../model/Translation';

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

  updateContextLabel(contextId: string, contextLabel: string): Promise<UpdateResult<Translation>>;
  updateKeysByContext(contextId: string, keyChanges: { [k: string]: string }): Promise<void>;

  updateValue(key: string, contextId: string, language: string, value: string): Promise<void>;

  calculateNonexistentKeys(contextId: string, keys: string[]): Promise<string[]>;
}
