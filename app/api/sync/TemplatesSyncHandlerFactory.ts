import { MongoTemplatesSyncHandler } from './MongoTemplatesSyncHandler.js';

export class TemplatesSyncHandlerFactory {
  static default(): MongoTemplatesSyncHandler {
    return new MongoTemplatesSyncHandler();
  }
}
