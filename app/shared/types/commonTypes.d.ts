/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/
import { ObjectId } from 'mongodb';
import { TraverseInputType } from 'shared/types/relationshipsQueryTypes'

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
  key: string;
  rtl?: boolean;
  default?: boolean;
  ISO639_3?: string;
  localized_label?: string;
  translationAvailable?: boolean;
}

export type LanguagesListSchema = {
  _id?: string | ObjectId;
  label: string;
  key: string;
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
