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

export interface SettingsLinkSchema {
  _id?: ObjectIdSchema;
  title: string;
  url?: string;
  sublinks?: SettingsSublinkSchema[];
  type: 'link' | 'group';
}

export interface PreserveConfig {
  host: string;
  masterToken: string;
  config: {
    token: string;
    template: ObjectIdSchema;
    user?: ObjectIdSchema;
  }[];
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
  allowcustomJS?: boolean;
  openPublicEndpoint?: boolean;
  cookiepolicy?: boolean;
  mailerConfig?: string;
  publicFormDestination?: string;
  allowedPublicTemplates?: string[];
  analyticsTrackingId?: string;
  matomoConfig?: string;
  dateFormat?: string;
  custom?:
    | string
    | {
        [k: string]: unknown | undefined;
      };
  customCSS?: string;
  customJS?: string;
  mapApiKey?: string;
  newNameGeneration?: true;
  ocrServiceEnabled?: boolean;
  sync?: SettingsSyncSchema[];
  languages?: LanguagesListSchema;
  filters?: SettingsFilterSchema[];
  links?: SettingsLinkSchema[];
  features?: {
    _id?: string;
    tocGeneration?: {
      url: string;
    };
    topicClassification?: boolean;
    favorites?: boolean;
    preserve?: PreserveConfig;
    convertToPdf?: {
      active: boolean;
      url: string;
    };
    ocr?: {
      url: string;
    };
    segmentation?: {
      url: string;
    };
    twitterIntegration?: {
      searchQueries: string[];
      hashtagsTemplateName: string;
      tweetsTemplateName: string;
      language: string;
      tweetsLanguages: string[];
    };
    metadataExtraction?: {
      url: string;
      templates?: {
        template: ObjectIdSchema;
        properties: string[];
      }[];
    };
    newRelationships?:
      | boolean
      | {
          updateStrategy: 'OnlineRelationshipPropertyUpdateStrategy' | 'QueuedRelationshipPropertyUpdateStrategy';
        };
    [k: string]: unknown | undefined;
  };
  mapStartingPoint?: {
    label?: string;
    lat: number;
    lon: number;
  }[];
  tilesProvider?: string;
}

export interface SettingsSublinkSchema {
  title: string;
  type: 'link';
  url: string;
  localId?: string;
}

export type SettingsSyncRelationtypesSchema = string[];

export interface SettingsSyncSchema {
  url: string;
  active?: boolean;
  username: string;
  password: string;
  name: string;
  config: {
    templates?: {
      [k: string]:
        | {
            properties: string[];
            filter?: string;
            attachments?: boolean;
          }
        | undefined;
    };
    relationtypes?: string[];
  };
}

export interface SettingsSyncTemplateSchema {
  properties: string[];
  filter?: string;
  attachments?: boolean;
}
