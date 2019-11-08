/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emitTypes to update.*/

import {
  ObjectIdSchema,
  LinkSchema,
  DateRangeSchema,
  GeolocationSchema,
  TocSchema,
} from 'shared/commonTypes';

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
    [k: string]: any | undefined;
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
  toc?: TocSchema[];
  user?: ObjectIdSchema;
  metadata?: {
    [k: string]:
      | (
          | null
          | string
          | number
          | string[]
          | number[]
          | (number | null)[]
          | DateRangeSchema
          | DateRangeSchema[]
          | LinkSchema
          | GeolocationSchema)
      | undefined;
  };
  [k: string]: any | undefined;
}
