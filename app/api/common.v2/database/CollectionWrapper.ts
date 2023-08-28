/* eslint-disable class-methods-use-this */
import {
  BSONSerializeOptions,
  Collection,
  Hint,
  ReadConcern,
  ReadPreference,
  WriteConcern,
  Document,
  DropCollectionOptions,
  RenameOptions,
  BulkWriteOptions,
  ChangeStream,
  ChangeStreamDocument,
  ChangeStreamOptions,
  CollStats,
  CollStatsOptions,
  CommandOperationOptions,
  CountOptions,
  CreateIndexesOptions,
  EstimatedDocumentCountOptions,
  Filter,
  IndexDescription,
  IndexInformationOptions,
  IndexSpecification,
  ListIndexesCursor,
  ListIndexesOptions,
  OperationOptions,
  OrderedBulkOperation,
  UnorderedBulkOperation,
  ListSearchIndexesCursor,
} from 'mongodb';

export abstract class CollectionWrapper<TSchema extends Document = Document> {
  protected collection: Collection<TSchema>;

  constructor(collection: Collection<TSchema>) {
    this.collection = collection;
  }

  get dbName(): string {
    throw new Error('Method not implemented.');
  }

  get collectionName(): string {
    return this.collection.collectionName;
  }

  get namespace(): string {
    throw new Error('Method not implemented.');
  }

  get readConcern(): ReadConcern | undefined {
    throw new Error('Method not implemented.');
  }

  get readPreference(): ReadPreference | undefined {
    throw new Error('Method not implemented.');
  }

  get bsonOptions(): BSONSerializeOptions {
    throw new Error('Method not implemented.');
  }

  get writeConcern(): WriteConcern | undefined {
    throw new Error('Method not implemented.');
  }

  get hint(): Hint | undefined {
    throw new Error('Method not implemented.');
  }

  set hint(_v: Hint | undefined) {
    throw new Error('Method not implemented.');
  }

  async rename(
    _newName: string,
    _options?: RenameOptions | undefined
  ): Promise<Collection<Document>> {
    throw new Error('Method not implemented.');
  }

  async drop(_options?: DropCollectionOptions | undefined): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async options(_options?: OperationOptions | undefined): Promise<Document> {
    throw new Error('Method not implemented.');
  }

  async isCapped(_options?: OperationOptions | undefined): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async createIndex(
    _indexSpec: IndexSpecification,
    _options?: CreateIndexesOptions | undefined
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async createIndexes(
    _indexSpecs: IndexDescription[],
    _options?: CreateIndexesOptions | undefined
  ): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async dropIndex(
    _indexName: string,
    _options?: CommandOperationOptions | undefined
  ): Promise<Document> {
    throw new Error('Method not implemented.');
  }

  async dropIndexes(_options?: CommandOperationOptions | undefined): Promise<Document> {
    throw new Error('Method not implemented.');
  }

  listIndexes(_options?: ListIndexesOptions | undefined): ListIndexesCursor {
    throw new Error('Method not implemented.');
  }

  async indexExists(
    _indexes: string | string[],
    _options?: IndexInformationOptions | undefined
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async indexInformation(_options?: IndexInformationOptions | undefined): Promise<Document> {
    throw new Error('Method not implemented.');
  }

  async estimatedDocumentCount(
    _options?: EstimatedDocumentCountOptions | undefined
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async indexes(_options?: IndexInformationOptions | undefined): Promise<Document[]> {
    throw new Error('Method not implemented.');
  }

  async stats(_options?: CollStatsOptions | undefined): Promise<CollStats> {
    throw new Error('Method not implemented.');
  }

  watch<TLocal extends Document = TSchema, TChange extends Document = ChangeStreamDocument<TLocal>>(
    _pipeline?: Document[] | undefined,
    _options?: ChangeStreamOptions | undefined
  ): ChangeStream<TLocal, TChange> {
    throw new Error('Method not implemented.');
  }

  initializeUnorderedBulkOp(_options?: BulkWriteOptions | undefined): UnorderedBulkOperation {
    throw new Error('Method not implemented.');
  }

  initializeOrderedBulkOp(_options?: BulkWriteOptions | undefined): OrderedBulkOperation {
    throw new Error('Method not implemented.');
  }

  async count(
    _filter?: Filter<TSchema> | undefined,
    _options?: CountOptions | undefined
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }

  listSearchIndexes(): ListSearchIndexesCursor {
    throw new Error('Method not implemented.');
  }

  async createSearchIndex(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async createSearchIndexes(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async dropSearchIndex(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updateSearchIndex(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
