import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { SyncHandler } from './SyncHandler.js';

/**
 * Preserves historical POST /api/sync semantics: the target tenant has one
 * settings document; inbound payloads (usually `{ _id, languages }`) are
 * applied onto that singleton, never inserted as a second row.
 */
export class MongoSettingsSyncHandler implements SyncHandler<Settings> {
  constructor(private readonly settingsDS: SettingsDataSource) {}

  async getById(_id: string): Promise<Settings | null> {
    return this.settingsDS.find();
  }

  async save(document: Partial<Settings>): Promise<Settings> {
    const current = await this.settingsDS.find();
    if (!current?._id) {
      throw new Error('MongoSettingsSyncHandler: target tenant has no settings document');
    }

    return this.settingsDS.patch({
      _id: current._id,
      ...(document.languages ? { languages: document.languages } : {}),
    });
  }

  async saveMultiple(documents: Partial<Settings>[]): Promise<Settings[]> {
    const saved: Settings[] = [];
    await documents.reduce(async (previous, document) => {
      await previous;
      saved.push(await this.save(document));
    }, Promise.resolve());
    return saved;
  }

  async delete(_id: string): Promise<void> {
    throw new Error('MongoSettingsSyncHandler: deleting the settings singleton is not supported');
  }
}
