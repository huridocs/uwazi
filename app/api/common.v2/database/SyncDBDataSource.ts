import { DeleteResult } from 'mongodb';

export interface SyncDBDataSource<T, U> {
  save(document: Partial<T>): Promise<U>;
  saveMultiple(documents: Partial<T>[]): Promise<U[]>;
  getById(documentId: string): Promise<U | null>;
  get(query: any, select?: any, options?: any): Promise<U[]>;
  delete(query: { _id: string }): Promise<DeleteResult>;
}
