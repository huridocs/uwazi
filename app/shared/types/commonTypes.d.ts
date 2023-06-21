/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/
import { ObjectId } from 'mongodb';
import { TraverseInputType } from 'shared/types/relationshipsQueryTypes'

export type LanguageISO6391 =
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

export interface AttachmentSchema {
  _id?: string | ObjectId;
  originalname?: string;
  filename?: string;
  mimetype?: string;
  url?: string;
  timestamp?: number;
  size?: number;
  [k: string]: unknown | undefined;
}

export interface DateRangeSchema {
  from?: number | null;
  to?: number | null;
}

export interface ExtractedMetadataSchema {
  propertyID?: string;
  name?: string;
  timestamp?: string;
  deleteSelection?: boolean;
  selection?: {
    text?: string;
    selectionRectangles?: {
      top?: number;
      left?: number;
      width?: number;
      height?: number;
      page?: string;
    }[];
  };
}

export type GeolocationSchema = {
  label?: string;
  lat: number;
  lon: number;
}[];

export interface InheritedValueSchema {
  value:
    | null
    | string
    | number
    | boolean
    | {
        label?: string | null;
        url?: string | null;
      }
    | {
        from?: number | null;
        to?: number | null;
      }
    | {
        label?: string;
        lat: number;
        lon: number;
      }
    | {
        label?: string;
        lat: number;
        lon: number;
      }[];
  label?: string;
  [k: string]: unknown | undefined;
}

export interface LanguageSchema {
  _id?: string | ObjectId;
  label: string;
  key: LanguageISO6391;
  rtl?: boolean;
  default?: boolean;
  ISO639_3?: string;
  localized_label?: string;
  translationAvailable?: boolean;
}

export type LanguagesListSchema = {
  _id?: string | ObjectId;
  label: string;
  key: LanguageISO6391;
  rtl?: boolean;
  default?: boolean;
  ISO639_3?: string;
  localized_label?: string;
  translationAvailable?: boolean;
}[];

export interface LatLonSchema {
  label?: string;
  lat: number;
  lon: number;
}

export interface LinkSchema {
  label?: string | null;
  url?: string | null;
}

export interface MetadataObjectSchema {
  value: PropertyValueSchema;
  attachment?: number;
  label?: string;
  suggestion_confidence?: number;
  suggestion_model?: string;
  provenance?: '' | 'BULK_ACCEPT';
  inheritedValue?: {
    value: PropertyValueSchema;
    label?: string;
    [k: string]: unknown | undefined;
  }[];
  inheritedType?: string;
  timeLinks?: string;
  [k: string]: unknown | undefined;
}

export interface MetadataSchema {
  [k: string]: MetadataObjectSchema[] | undefined;
}

export type ObjectIdSchema = string | ObjectId;

export interface PropertySchema {
  _id?: ObjectIdSchema;
  label: string;
  name: string;
  isCommonProperty?: boolean;
  type:
    | 'date'
    | 'daterange'
    | 'geolocation'
    | 'image'
    | 'link'
    | 'markdown'
    | 'media'
    | 'multidate'
    | 'multidaterange'
    | 'multiselect'
    | 'nested'
    | 'numeric'
    | 'preview'
    | 'relationship'
    | 'select'
    | 'text'
    | 'generatedid'
    | 'newRelationship';
  prioritySorting?: boolean;
  generatedId?: boolean;
  content?: string;
  relationType?: string;
  inherit?: {
    property?: string;
    type?:
      | 'date'
      | 'daterange'
      | 'geolocation'
      | 'image'
      | 'link'
      | 'markdown'
      | 'media'
      | 'multidate'
      | 'multidaterange'
      | 'multiselect'
      | 'nested'
      | 'numeric'
      | 'preview'
      | 'relationship'
      | 'select'
      | 'text'
      | 'generatedid'
      | 'newRelationship';
  };
  filter?: boolean;
  noLabel?: boolean;
  fullWidth?: boolean;
  defaultfilter?: boolean;
  required?: boolean;
  sortable?: boolean;
  showInCard?: boolean;
  style?: string;
  nestedProperties?: string[];
  query?: unknown[];
  denormalizedProperty?: string;
}

export type PropertyValueSchema =
  | null
  | string
  | number
  | boolean
  | LinkSchema
  | DateRangeSchema
  | LatLonSchema
  | LatLonSchema[];

export interface SelectionRectangleSchema {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  page?: string;
}

export type SelectionRectanglesSchema = {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  page?: string;
}[];

export interface TocSchema {
  selectionRectangles?: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    page?: string;
  }[];
  label?: string;
  indentation?: number;
}
