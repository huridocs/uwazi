import { MongoIdHandler } from '../mongodb/common/MongoIdGenerator';

export class IdGeneratorFactory {
  static default() {
    return MongoIdHandler;
  }
}
