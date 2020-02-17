/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, TocSchema } from 'shared/types/commonTypes';

export interface FileSchema {
  _id?:
    | string
    | {
        [k: string]: any | undefined;
      };
  entity?: string;
  originalname?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  creationDate?: number;
  language?: string;
  type?: 'custom' | 'document' | 'thumbnail';
  totalPages?: number;
  processed?: boolean;
  fullText?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[0-9]+$".
     */
    [k: string]: string;
  };
  toc?: {
    range?: {
      start?: number;
      end?: number;
      [k: string]: any | undefined;
    };
    label?: string;
    indentation?: number;
  }[];
  pdfInfo?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[0-9]+$".
     */
    [k: string]: {
      chars?: number;
    };
  };
}
