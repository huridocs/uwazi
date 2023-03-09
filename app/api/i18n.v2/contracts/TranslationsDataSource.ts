import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Translation } from '../model/Translation';

export interface TranslationsDataSource {
  insert(translations: Translation[]): Promise<Translation[]>;
  update(translations: Translation[]): Promise<Translation[]>;
  getAll(): ResultSet<Translation>;
}
