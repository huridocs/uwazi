/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, LanguagesListSchema } from 'shared/types/commonTypes';

export interface SettingsFilterSchema {
  _id?: string;
  id?: string;
  name?: string;
  items?: any;
}

export interface SettingsSyncSchema {
  url?: string;
  active?: boolean;
  username?: boolean;
  password?: boolean;
  config?: any;
}

export interface SettingsLinkSchema {
  _id?: string;
  localID?: string;
  title?: string;
  url?: string;
}

export interface Settings {
  _id?: ObjectIdSchema;
  __v?: number;
  project?: string;
  site_name?: string;
  contactEmail?: string;
  home_page?: string;
  private?: boolean;
  cookiepolicy?: boolean;
  mailerConfig?: string;
  publicFormDestination?: string;
  allowedPublicTemplates?: string[];
  analyticsTrackingId?: string;
  matomoConfig?: string;
  dateFormat?: string;
  custom?: any;
  customCSS?: string;
  mapTilerKey?: string;
  newNameGeneration?: boolean;
  sync?: SettingsSyncSchema;
  languages?: LanguagesListSchema;
  filters?: SettingsFilterSchema[];
  links?: SettingsLinkSchema[];
  features?: {
    _id?: string;
    semanticSearch?: boolean;
    topicClassification?: boolean;
    favorites?: boolean;
    [k: string]: any | undefined;
  };
}
