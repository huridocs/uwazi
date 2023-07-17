import { Collection, Document, OptionalId } from 'mongodb';
import { Sink } from '../contracts/Sink';
import { BulkWriteStream } from './BulkWriteStream';

interface MapperFunc<U, T> {
  (elem: U): OptionalId<T> | Promise<OptionalId<T>>;
}

class MongoSaveStream<T extends Document, U = T> implements Sink<U> {
  private collection: Collection<T>;

  private mapper: MapperFunc<U, T>;

  private bulkWriteStream: BulkWriteStream<T>;

  constructor(collection: Collection<T>, mapper: MapperFunc<U, T>, stackLimit: number = 1000) {
    this.collection = collection;
    this.mapper = mapper;
    this.bulkWriteStream = new BulkWriteStream<T>(collection, stackLimit);
  }

  async flush(): Promise<void> {
    return this.bulkWriteStream.flush();
  }

  async push(item: U): Promise<void> {
    const mapped = await this.mapper(item);
    return this.bulkWriteStream.insert(mapped);
  }
}

export { MongoSaveStream };
