import { DeleteResult } from 'mongodb';

export interface SyncDBDataSource<T> {
  save(document: Partial<T>): Promise<T>;
  saveMultiple(documents: Partial<T>[]): Promise<T[]>;
  getById(documentId: string): Promise<T | null>;
  get(query: any, select?: any, options?: any): Promise<T[]>;
  delete(query: { _id: string }): Promise<DeleteResult>;
}
