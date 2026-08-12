import { MongoTranslationsSyncHandler } from './MongoTranslationsSyncHandler.js';

/**
 * Factory for translationsV2 sync handlers.
 * Mongo-only for now; Postgres branch lands with translations-postgres phase.
 */
export class TranslationsSyncHandlerFactory {
  static default(): MongoTranslationsSyncHandler {
    return new MongoTranslationsSyncHandler();
  }
}
