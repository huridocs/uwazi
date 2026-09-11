import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { SyncHandler } from './SyncHandler.js';

/**
 * Preserves historical POST /api/sync semantics: the target tenant has one
 * settings document; inbound payloads (usually `{ _id, languages }`) are
 * applied onto that singleton, never inserted as a second row.
 *
 * Storage is whatever SettingsDataSourceFactory returns (Mongo or Postgres).
 */
export class SettingsSyncHandler implements SyncHandler<SettingsType> {
  constructor(private readonly settingsDS: SettingsDataSource) {}

  async getById(_id: string): Promise<SettingsType | null> {
    const settings = await this.settingsDS.find();
    return settings?.toState() ?? null;
  }

  async save(document: Partial<SettingsType>): Promise<SettingsType> {
    const current = await this.settingsDS.find();
    if (!current?._id) {
      throw new Error('SettingsSyncHandler: target tenant has no settings document');
    }

    current.apply(
      document.languages ? { languages: document.languages } : {},
      MongoIdHandler.generate
    );
    const saved = await this.settingsDS.update(current);
    return saved.toState();
  }

  async saveMultiple(documents: Partial<SettingsType>[]): Promise<SettingsType[]> {
    const saved: SettingsType[] = [];
    await documents.reduce(async (previous, document) => {
      await previous;
      saved.push(await this.save(document));
    }, Promise.resolve());
    return saved;
  }

  async delete(_id: string): Promise<void> {
    throw new Error(`${this.constructor.name}: deleting the settings singleton is not supported`);
  }
}
