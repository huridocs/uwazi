/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, TocSchema } from 'shared/types/commonTypes';

export interface FileType {
  _id?: ObjectIdSchema;
  entity?: string;
  originalname?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  creationDate?: number;
  language?: string;
  type?: 'custom' | 'document' | 'thumbnail' | 'attachment';
  url?: string;
  status?: 'processing' | 'failed' | 'ready';
  totalPages?: number;
  fullText?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[0-9]+$".
     */
    [k: string]: string;
  };
  toc?: TocSchema[];
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
