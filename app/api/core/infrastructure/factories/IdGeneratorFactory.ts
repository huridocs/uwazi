import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';

export class IdGeneratorFactory {
  static default() {
    return MongoIdHandler;
  }
}
