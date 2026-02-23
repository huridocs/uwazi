/* eslint-disable import/exports-last */
/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';

type ObjectIdSchema = string | ObjectId;

interface SettingsSyncSchema {
  url: string;
  username: string;
  password: string;
  active?: boolean;
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

type LanguageISO6391 =
  | 'ab'
  | 'aa'
  | 'af'
  | 'ak'
  | 'sq'
  | 'am'
  | 'ar'
  | 'an'
  | 'hy'
  | 'as'
  | 'av'
  | 'ae'
  | 'ay'
  | 'az'
  | 'bm'
  | 'ba'
  | 'eu'
  | 'be'
  | 'bn'
  | 'bh'
  | 'bi'
  | 'bs'
  | 'br'
  | 'bg'
  | 'my'
  | 'ca'
  | 'ch'
  | 'ce'
  | 'ny'
  | 'zh'
  | 'zh-Hans'
  | 'zh-Hant'
  | 'cv'
  | 'kw'
  | 'co'
  | 'cr'
  | 'hr'
  | 'cs'
  | 'da'
  | 'dv'
  | 'nl'
  | 'dz'
  | 'en'
  | 'eo'
  | 'et'
  | 'ee'
  | 'fo'
  | 'fj'
  | 'fi'
  | 'fr'
  | 'ff'
  | 'gl'
  | 'gd'
  | 'gv'
  | 'ka'
  | 'de'
  | 'el'
  | 'gn'
  | 'gu'
  | 'ht'
  | 'ha'
  | 'he'
  | 'hz'
  | 'hi'
  | 'ho'
  | 'hu'
  | 'is'
  | 'io'
  | 'ig'
  | 'in'
  | 'ia'
  | 'ie'
  | 'iu'
  | 'ik'
  | 'ga'
  | 'it'
  | 'ja'
  | 'jv'
  | 'kl'
  | 'kn'
  | 'kr'
  | 'ks'
  | 'kk'
  | 'km'
  | 'ki'
  | 'rw'
  | 'rn'
  | 'ky'
  | 'kv'
  | 'kg'
  | 'ko'
  | 'ku'
  | 'kj'
  | 'lo'
  | 'la'
  | 'lv'
  | 'li'
  | 'ln'
  | 'lt'
  | 'lu'
  | 'lg'
  | 'lb'
  | 'mk'
  | 'mg'
  | 'ms'
  | 'ml'
  | 'mt'
  | 'mi'
  | 'mr'
  | 'mh'
  | 'mn'
  | 'na'
  | 'nv'
  | 'ng'
  | 'nd'
  | 'ne'
  | 'no'
  | 'nb'
  | 'nn'
  | 'oc'
  | 'oj'
  | 'cu'
  | 'or'
  | 'om'
  | 'os'
  | 'pi'
  | 'ps'
  | 'fa'
  | 'pl'
  | 'pt'
  | 'pa'
  | 'qu'
  | 'rm'
  | 'ro'
  | 'ru'
  | 'se'
  | 'sm'
  | 'sg'
  | 'sa'
  | 'sr'
  | 'sh'
  | 'st'
  | 'tn'
  | 'sn'
  | 'ii'
  | 'sd'
  | 'si'
  | 'ss'
  | 'sk'
  | 'sl'
  | 'so'
  | 'nr'
  | 'es'
  | 'su'
  | 'sw'
  | 'sv'
  | 'tl'
  | 'ty'
  | 'tg'
  | 'ta'
  | 'tt'
  | 'te'
  | 'th'
  | 'bo'
  | 'ti'
  | 'to'
  | 'ts'
  | 'tr'
  | 'tk'
  | 'tw'
  | 'ug'
  | 'uk'
  | 'ur'
  | 'uz'
  | 've'
  | 'vi'
  | 'vo'
  | 'wa'
  | 'cy'
  | 'wo'
  | 'fy'
  | 'xh'
  | 'yi'
  | 'yo'
  | 'za'
  | 'zu';

type LanguagesListSchema = {
  _id?: string | ObjectId;
  label: string;
  key: LanguageISO6391;
  rtl?: boolean;
  default?: boolean;
  ISO639_3?: string;
  elastic?: string;
  ISO639_1?: LanguageISO6391;
  localized_label?: string;
  translationAvailable?: boolean;
}[];

interface AutomaticTranslationConfig {
  active: boolean;
  templates?: {
    template: string;
    commonProperties?: string[];
    properties?: string[];
  }[];
}

interface PreserveConfig {
  host: string;
  masterToken: string;
  config: {
    token: string;
    template: ObjectIdSchema;
    user?: ObjectIdSchema;
  }[];
}

interface SettingsFilterSchema {
  _id?: ObjectIdSchema;
  id?: string;
  name?: string;
  items?: {
    id?: string;
    name?: string;
  }[];
}

interface SettingsSublinkSchema {
  _id?: string | ObjectId;
  title: string;
  type: 'link';
  url: string;
  localId?: string;
}

interface SettingsLinkSchema {
  _id?: ObjectIdSchema;
  title: string;
  url?: string;
  localId?: string;
  sublinks?: SettingsSublinkSchema[];
  type: 'link' | 'group';
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
  /**
   * @minItems 1
   */
  mapLayers?: [string, ...string[]];
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
          updateStrategy:
            | 'OnlineRelationshipPropertyUpdateStrategy'
            | 'QueuedRelationshipPropertyUpdateStrategy';
        };
    automaticTranslation?: AutomaticTranslationConfig;
    [k: string]: unknown | undefined;
  };
  mapStartingPoint?: {
    label?: string;
    lat: number;
    lon: number;
  }[];
  tilesProvider?: string;
}

interface TocSchema {
  selectionRectangles?: {
    top: number;
    left: number;
    width: number;
    height: number;
    page?: string;
  }[];
  label?: string;
  indentation?: number;
}

interface ExtractedMetadataSchema {
  propertyID?: string;
  name?: string;
  timestamp?: string;
  deleteSelection?: boolean;
  selection?: {
    text?: string;
    selectionRectangles?: {
      top: number;
      left: number;
      width: number;
      height: number;
      page?: string;
    }[];
  };
}

interface FileSchema {
  _id?: ObjectIdSchema;
  entity?: string;
  originalname?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  creationDate?: number;
  language?: string;
  iso639_3?: string;
  type?: 'custom' | 'document' | 'thumbnail' | 'attachment';
  url?: string;
  status?: 'processing' | 'failed' | 'ready';
  totalPages?: number;
  generatedToc?: boolean;
  uploaded?: boolean;
  fullText?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[0-9]+$".
     */
    [k: string]: string;
  };
  toc?: TocSchema[];
  extractedMetadata?: ExtractedMetadataSchema[];
}

export type FileDocument = {
  _id: ObjectId;
  filename?: string;
  size?: number | null;
  creationDate?: number | null;
  type?: MigrationStorageFileType;
};

export type TenantSnapshot = {
  name: string;
  uploadedDocuments: string;
  attachments: string;
  customUploads: string;
  featureFlags?: {
    s3Storage?: boolean;
  };
};

export type MigrationStorageFileType =
  | 'custom'
  | 'document'
  | 'thumbnail'
  | 'attachment'
  | 'activitylog'
  | 'segmentation';

export interface Fixture {
  settings: Settings[];
  files: FileSchema[];
}
