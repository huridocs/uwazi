import type { Db } from 'mongodb';
import type { Settings as SettingsType } from '#shared/types/settingsType.js';
import { toPersistableSettingsFields } from '../settings/persistableSettingsFields.js';
import type {
  SettingsDocument,
  SettingsDocumentQueryService,
} from '../settings/SettingsDocumentQueryService.js';

type Deps = { db: Db };

/** Answers in the shape settings are written in, so older documents read like newer ones. */
class MongoSettingsDocumentQueryService implements SettingsDocumentQueryService {
  private readonly db: Db;

  constructor({ db }: Deps) {
    this.db = db;
  }

  async get(): Promise<SettingsDocument | undefined> {
    const stored = await this.db.collection<SettingsType>('settings').findOne({});
    return stored ? JSON.parse(JSON.stringify(toPersistableSettingsFields(stored))) : undefined;
  }
}

export { MongoSettingsDocumentQueryService };
