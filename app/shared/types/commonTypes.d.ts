/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export type ObjectIdSchema =
  | string
  | {
      [k: string]: any | undefined;
    };

export interface AttachmentSchema {
  originalname?: string;
  filename?: string;
  mimetype?: string;
  timestamp?: number;
  size?: number;
  [k: string]: any | undefined;
}

export interface LinkSchema {
  label?: string | null;
  url?: string | null;
}

export interface DateRangeSchema {
  from?: number | null;
  to?: number | null;
}

export interface LanguageSchema {
  label: string;
  key: string;
  rtl?: boolean;
  default?: boolean;
}

export type LanguagesListSchema = {
  label: string;
  key: string;
  rtl?: boolean;
  default?: boolean;
}[];

export interface LatLonSchema {
  label?: string;
  lat: number;
  lon: number;
}

export type GeolocationSchema = {
  label?: string;
  lat: number;
  lon: number;
}[];

export type PropertyValueSchema = null | string | number | LinkSchema | DateRangeSchema | LatLonSchema | LatLonSchema[];

export interface MetadataObjectSchema {
  value: PropertyValueSchema;
  label?: string;
  suggestion_confidence?: number;
  suggestion_model?: string;
  provenance?: '' | 'BULK_ACCEPT';
  [k: string]: any | undefined;
}

export interface MetadataSchema {
  [k: string]: MetadataObjectSchema[] | undefined;
}

export interface TocSchema {
  range?: {
    start?: number;
    end?: number;
    [k: string]: any | undefined;
  };
  label?: string;
  indentation?: number;
}

export interface PropertySchema {
  id?: string;
  label: string;
  name?: string;
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
    | 'text';
  prioritySorting?: boolean;
  content?: string;
  inherit?: boolean;
  inheritProperty?: string;
  filter?: boolean;
  noLabel?: boolean;
  fullWidth?: boolean;
  defaultfilter?: boolean;
  required?: boolean;
  sortable?: boolean;
  showInCard?: boolean;
  style?: string;
  nestedProperties?: string[];
  [k: string]: any | undefined;
}
