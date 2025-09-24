// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoDat... Remove this comment to see the full error message
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/language/index.js... Remove this comment to see the full error message
import { LanguageUtils } from 'shared/language/index.js';

import { LanguageSchema, LanguagesListSchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/settingsTyp... Remove this comment to see the full error message
import { Settings as SettingsType } from 'shared/types/settingsType.js';
import { SettingsDataSource } from '../contracts/SettingsDataSource';
import { DefaultLanguageMissingError } from '../errors/settingsErrors';

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
      // @ts-expect-error TS(7006): Parameter 'language' implicitly has an 'any' type.
      language =>
        ({
          ...LanguageUtils.fromISO639_1(language.key),
          default: language.default,
        }) as LanguageSchema
    );
  }

  protected async readSettings(): Promise<SettingsType | null> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    return this.getCollection().findOne({});
  }

  protected async readLanguages(): Promise<SettingsType['languages']> {
    return (await this.readSettings())?.languages;
  }

  async getLanguageKeys() {
    const languages = await this.readLanguages();
    // @ts-expect-error TS(7006): Parameter 'l' implicitly has an 'any' type.
    return languages?.map(l => l.key) || [];
  }

  async getDefaultLanguageKey() {
    const languages = await this.readLanguages();
    // @ts-expect-error TS(7006): Parameter 'l' implicitly has an 'any' type.
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
