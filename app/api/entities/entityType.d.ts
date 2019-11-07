/* eslint-disable */
/**AUTO-GENERATED. RUN yarn build_schema to update.*/

import { ObjectIdSchema } from 'api/entities/commonType';

export interface LinkSchema {
  label: string;
  url: string;
}

export interface DateRangeSchema {
  from?: number | null;
  to?: number | null;
}

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

export interface TableOfContents {
  range?: {
    start?: number;
    end?: number;
  };
  label?: string;
  indentation?: number;
}

export interface EntitySchema {
  _id?: ObjectIdSchema;
  sharedId?: string;
  language?: string;
  mongoLanguage?: string;
  title?: string;
  template?: ObjectIdSchema;
  file?: {
    originalname?: string;
    filename?: string;
    mimetype?: string;
    size?: number;
    timestamp?: number;
    language?: string;
  };
  fullText?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[0-9]+$".
     */
    [k: string]: string;
  };
  totalPages?: number;
  icon?: {
    _id?: string;
    label?: string;
    type?: string;
  };
  attachments?: {
    originalname?: string;
    filename?: string;
    mimetype?: string;
    timestamp?: number;
    size?: number;
  }[];
  creationDate?: number;
  processed?: boolean;
  uploaded?: boolean;
  published?: boolean;
  pdfInfo?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[0-9]+$".
     */
    [k: string]: {
      chars?: number;
    };
  };
  toc?: TableOfContents[];
  user?: ObjectIdSchema;
  metadata?: {
    [k: string]:
      | (
          | null
          | string
          | number
          | string[]
          | number[]
          | DateRangeSchema
          | DateRangeSchema[]
          | LinkSchema
          | GeolocationSchema)
      | undefined;
  };
}

