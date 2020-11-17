/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, LanguagesListSchema, GeolocationSchema } from 'shared/types/commonTypes';

export interface ItemSchema {
  id?: string;
  name?: string;
}

export interface SettingsFilterSchema {
  _id?: ObjectIdSchema;
  id?: string;
  name?: string;
  items?: {
    id?: string;
    name?: string;
  }[];
}

export interface SettingsSyncSchema {
  url?: string;
  active?: boolean;
  username?: boolean;
  password?: boolean;
  config?: unknown;
}

export interface SettingsLinkSchema {
  _id?: ObjectIdSchema;
  title?: string;
  url?: string;
}

export interface Settings {
  _id?: ObjectIdSchema;
  __v?: number;
  project?: string;
  site_name?: string;
  favicon?: string;
  contactEmail?: string;
  senderEmail?: string;
  home_page?: string;
  defaultLibraryView?: string;
  private?: boolean;
  cookiepolicy?: boolean;
  mailerConfig?: string;
  publicFormDestination?: string;
  allowedPublicTemplates?: string[];
  analyticsTrackingId?: string;
  matomoConfig?: string;
  dateFormat?: string;
  custom?: unknown;
  customCSS?: string;
  mapTilerKey?: string;
  newNameGeneration?: true;
  sync?: SettingsSyncSchema;
  languages?: LanguagesListSchema;
  filters?: SettingsFilterSchema[];
  links?: SettingsLinkSchema[];
  features?: {
    _id?: string;
    semanticSearch?: boolean;
    topicClassification?: boolean;
    favorites?: boolean;
    [k: string]: unknown | undefined;
  };
  mapStartingPoint?: {
    label?: string;
    lat: number;
    lon: number;
  }[];
}
