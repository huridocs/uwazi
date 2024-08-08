import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { Settings as SettingsType, AutomaticTranslationConfig } from 'shared/types/settingsType';
import { AutomaticTranslationConfigDataSource } from '../contracts/AutomaticTranslationConfigDataSource';

export class MongoAutomaticTranslationConfigDataSource
  extends MongoDataSource<SettingsType>
  // eslint-disable-next-line prettier/prettier
  implements AutomaticTranslationConfigDataSource {
  protected collectionName = 'settings';

  async get(): Promise<AutomaticTranslationConfig> {
    const settings = await this.getCollection().findOne();
    return settings?.features?.automaticTranslation ?? { active: false };
  }

  async update(config: AutomaticTranslationConfig): Promise<AutomaticTranslationConfig> {
    await this.getCollection().findOneAndUpdate(
      {},
      { $set: { 'features.automaticTranslation': config } }
    );
    return this.get();
  }
}
