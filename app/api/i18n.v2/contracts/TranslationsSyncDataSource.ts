import { DeleteResult } from 'mongodb';
import { TranslationDBO } from '../schemas/TranslationDBO';

export interface TranslationsSyncDataSource {
  save(translation: TranslationDBO): Promise<TranslationDBO>;
  saveMultiple(translations: TranslationDBO[]): Promise<TranslationDBO[]>;

  getById(translationId: string): Promise<TranslationDBO | null>;
  delete(query: { _id: string }): Promise<DeleteResult>;
}
