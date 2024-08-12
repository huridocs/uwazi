import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { Settings as SettingsType, AutomaticTranslationConfig } from 'shared/types/settingsType';
import { AutomaticTranslationConfigDataSource } from '../contracts/AutomaticTranslationConfigDataSource';
import { RawAutomaticTranslationConfig } from '../model/RawAutomaticTranslationConfig';
import { AutomaticTranslationTemplateConfig } from '../model/AutomaticTranslationTemplateConfig';

export class MongoAutomaticTranslationConfigDataSource
  extends MongoDataSource<SettingsType>
  // eslint-disable-next-line prettier/prettier
  implements AutomaticTranslationConfigDataSource {
  protected collectionName = 'settings';

  async get() {
    const settings = await this.getCollection().findOne();
    const config = settings?.features?.automaticTranslation ?? { active: false };

    return new RawAutomaticTranslationConfig(
      config.active,
      (config.templates || []).map(
        t =>
          new AutomaticTranslationTemplateConfig(t.template, t.properties || [], t.commonProperties)
      )
    );
  }

  async update(config: RawAutomaticTranslationConfig) {
    await this.getCollection().findOneAndUpdate(
      {},
      { $set: { 'features.automaticTranslation': config } }
    );
    return this.get();
  }
}
