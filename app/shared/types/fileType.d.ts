/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, TocSchema, ExtractedMetadataSchema } from 'shared/types/commonTypes';

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
  extractedMetadata?: {
    _id?: ObjectIdSchema;
    label?: string;
    timestamp?: string;
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
