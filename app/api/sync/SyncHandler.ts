export interface SyncHandler<TDocument = any> {
  getById(id: string): Promise<TDocument | null>;
  save(document: Partial<TDocument>): Promise<TDocument>;
  saveMultiple(documents: Partial<TDocument>[]): Promise<TDocument[]>;
  delete(id: string): Promise<void>;
}
