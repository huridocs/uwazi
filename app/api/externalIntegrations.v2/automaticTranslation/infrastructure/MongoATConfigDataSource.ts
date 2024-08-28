import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { Settings as SettingsType } from 'shared/types/settingsType';
import { ATConfigDataSource } from '../contracts/ATConfigDataSource';
import { RawATConfig } from '../model/RawATConfig';
import { ATTemplateConfig } from '../model/ATConfig';

export class MongoATConfigDataSource
  extends MongoDataSource<SettingsType>
  implements ATConfigDataSource
{
  protected collectionName = 'settings';

  async get() {
    const settings = await this.getCollection().findOne();
    const config = settings?.features?.automaticTranslation ?? { active: false };

    return new RawATConfig(
      config.active,
      (config.templates || []).map(
        t => new ATTemplateConfig(t.template, t.properties || [], t.commonProperties)
      )
    );
  }

  async update(config: RawATConfig) {
    await this.getCollection().findOneAndUpdate(
      {},
      { $set: { 'features.automaticTranslation': config } }
    );
    return this.get();
  }
}
