/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/
import { ObjectId } from 'mongodb';

export type ObjectIdSchema = string | ObjectId;

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

export interface LinkSchema {
  label?: string | null;
  url?: string | null;
}

export interface DateRangeSchema {
  from?: number | null;
  to?: number | null;
}

export interface LanguageSchema {
  _id?: string | ObjectId;
  label: string;
  key: string;
  rtl?: boolean;
  default?: boolean;
}

export type LanguagesListSchema = {
  _id?: string | ObjectId;
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

export type PropertyValueSchema =
  | null
  | string
  | number
  | boolean
  | LinkSchema
  | DateRangeSchema
  | LatLonSchema
  | LatLonSchema[];

export interface MetadataObjectSchema {
  value: PropertyValueSchema;
  label?: string;
  suggestion_confidence?: number;
  suggestion_model?: string;
  provenance?: '' | 'BULK_ACCEPT';
  inheritedValue?: {
    value?: PropertyValueSchema;
    label?: string;
    [k: string]: unknown | undefined;
  }[];
  inheritedType?: string;
  [k: string]: unknown | undefined;
}

export interface MetadataSchema {
  [k: string]: MetadataObjectSchema[] | undefined;
}

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

export interface PropertySchema {
  _id?: ObjectIdSchema;
  id?: string;
  localID?: string;
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
    | 'generatedid';
  prioritySorting?: boolean;
  content?: string;
  relationType?: string;
  inherit?: {
    property?: string;
    type?: string;
    [k: string]: unknown | undefined;
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
}
