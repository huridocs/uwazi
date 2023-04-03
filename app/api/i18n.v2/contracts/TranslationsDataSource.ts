import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Translation } from '../model/Translation';

export interface TranslationsDataSource {
  insert(translations: Translation[]): Promise<Translation[]>;
  upsert(translations: Translation[]): Promise<Translation[]>;
  deleteByContextId(contextId: string);
  deleteByLanguage(language: string);
  getAll(): ResultSet<Translation>;
}
