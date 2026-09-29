import { Settings } from '#api/core/domain/settings/Settings.js';
import { LanguageISO6391, LanguagesListSchema } from '#shared/types/commonTypes.js';
import { Settings as SettingsType } from '#shared/types/settingsType.js';

type ContactMailSettings = Pick<SettingsType, 'contactEmail' | 'senderEmail' | 'site_name'>;
type ExportFormatSettings = Pick<SettingsType, 'dateFormat' | 'site_name'>;

export interface SettingsDataSource {
  getLanguageKeys(): Promise<LanguageISO6391[]>;
  getDefaultLanguageKey(): Promise<LanguageISO6391>;
  getInstalledLanguages(): Promise<LanguagesListSchema>;
  find(): Promise<Settings | null>;
  get(): Promise<Settings>;
  update(settings: Settings): Promise<Settings>;
  readPresentation(): Promise<Settings | null>;
  readLanguages(): Promise<LanguagesListSchema | undefined>;
  readNewNameGeneration(): Promise<boolean>;
  readOpenPublicEndpoint(): Promise<boolean>;
  readOcrServiceEnabled(): Promise<boolean>;
  readAllowedPublicTemplates(): Promise<SettingsType['allowedPublicTemplates']>;
  readContactMail(): Promise<ContactMailSettings>;
  readExportFormat(): Promise<ExportFormatSettings>;
  readPublicFormDestination(): Promise<string | undefined>;
  readMailerConfig(): Promise<string | undefined>;
  readNewRelationshipsAllowed(): Promise<boolean>;
  readFilterUnauthorizedRelated(): Promise<boolean>;
  readFeature<K extends keyof NonNullable<SettingsType['features']>>(
    name: K
  ): Promise<NonNullable<SettingsType['features']>[K] | undefined>;
  readSyncConfig(): Promise<SettingsType['sync']>;
  getNewRelationshipsConfiguration(): Promise<
    Exclude<Partial<Required<SettingsType>['features']['newRelationships']>, boolean | undefined>
  >;
}

export type { ContactMailSettings, ExportFormatSettings };
