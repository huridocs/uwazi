import { MongoRelationtypesSyncHandler } from './MongoRelationtypesSyncHandler.js';

export class RelationtypesSyncHandlerFactory {
  static default(): MongoRelationtypesSyncHandler {
    return new MongoRelationtypesSyncHandler();
  }
}
