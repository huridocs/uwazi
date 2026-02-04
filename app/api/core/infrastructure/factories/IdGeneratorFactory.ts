import { MongoIdHandler } from '../mongodb/common/MongoIdGenerator.js';

export class IdGeneratorFactory {
  static default() {
    return MongoIdHandler;
  }
}
