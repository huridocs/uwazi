import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { Settings as SettingsType } from 'shared/types/settingsType';
import { SettingsDataSource } from '../contracts/SettingsDataSource';
import { DefaultLanguageMissingError } from '../errors/settingsErrors';

export class MongoSettingsDataSource
  extends MongoDataSource<SettingsType>
  // eslint-disable-next-line prettier/prettier
  implements SettingsDataSource {
  protected collectionName = 'settings';

  protected async readSettings(): Promise<SettingsType | null> {
    return this.getCollection().findOne({}, { session: this.getSession() });
  }

  protected async readLanguages(): Promise<SettingsType['languages']> {
    return (await this.readSettings())?.languages;
  }

  async getLanguageKeys(): Promise<string[]> {
    const languages = await this.readLanguages();
    return languages?.map(l => l.key) || [];
  }

  async getDefaultLanguageKey(): Promise<string> {
    const languages = await this.readLanguages();
    const defaultLanguage = languages?.find(l => l.default);
    if (!defaultLanguage) {
      throw new DefaultLanguageMissingError('Default language needs to be defined.');
    }
    return defaultLanguage.key;
  }

  async readNewRelationshipsAllowed(): Promise<boolean> {
    const settings = await this.readSettings();
    return !!settings?.features?.newRelationships;
  }

  async getNewRelationshipsConfiguration(): Promise<
    Exclude<Partial<Required<SettingsType>['features']['newRelationships']>, boolean | undefined>
  > {
    const settings = await this.readSettings();
    const featureConfiguration = settings?.features?.newRelationships;

    if (typeof featureConfiguration === 'boolean' || !featureConfiguration) {
      return {};
    }

    if ('updateStrategy' in featureConfiguration) {
      return featureConfiguration;
    }

    return {};
  }
}
