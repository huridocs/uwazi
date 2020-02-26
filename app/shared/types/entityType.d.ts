/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema, MetadataSchema } from 'shared/types/commonTypes';

export interface EntitySchema {
  _id?: ObjectIdSchema;
  sharedId?: string;
  language?: string;
  mongoLanguage?: string;
  title?: string;
  template?: ObjectIdSchema;
  published?: boolean;
  icon?: {
    _id?: string | null;
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
  user?: ObjectIdSchema;
  metadata?: MetadataSchema;
  suggestedMetadata?: MetadataSchema;
  [k: string]: any | undefined;
}
