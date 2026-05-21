export interface SyncHandler<TDocument = any> {
  getById(id: string): Promise<TDocument | null>;
  save(document: Partial<TDocument>): Promise<TDocument>;
  saveMultiple(documents: Partial<TDocument>[]): Promise<TDocument[]>;
  /** Implement to handle sync deletes. For namespaces where deletes are a no-op, implement as an empty method. */
  delete(id: string): Promise<void>;
}
