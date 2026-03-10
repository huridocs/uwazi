import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { LanguageUtils } from 'shared/language';
import { LanguageSchema, LanguagesListSchema } from 'shared/types/commonTypes';
import { Settings as SettingsType } from 'shared/types/settingsType';
import { SettingsDataSource } from '../../application/contracts/SettingsDataSource';
import { DefaultLanguageMissingError } from './errors/settingsErrors';

export class MongoSettingsDataSource
  extends MongoDataSource<SettingsType>
  implements SettingsDataSource
{
  protected collectionName = 'settings';

  async getInstalledLanguages(): Promise<LanguagesListSchema> {
    const settings = await this.readSettings();
    if (!settings?.languages) {
      return [];
    }

    if (!settings?.languages) {
      throw new Error('Settings not found or settings do not have languages configured');
    }

    return settings.languages.map(
      language =>
        ({
          ...LanguageUtils.fromISO639_1(language.key),
          default: language.default,
        }) as LanguageSchema
    );
  }

  protected async readSettings(): Promise<SettingsType | null> {
    return this.getCollection().findOne({});
  }

  protected async readLanguages(): Promise<SettingsType['languages']> {
    return (await this.readSettings())?.languages;
  }

  async getLanguageKeys() {
    const languages = await this.readLanguages();
    return languages?.map(l => l.key) || [];
  }

  async getDefaultLanguageKey() {
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

  async get(): Promise<SettingsType> {
    const settings = await this.readSettings();

    if (!settings) {
      throw new Error('Settings not found');
    }

    return settings;
  }
}
