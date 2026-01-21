import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';

export class IdGeneratorFactory {
  static default() {
    return MongoIdHandler;
  }
}
