/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

import { EntitySchema } from 'shared/types/entityType';

export interface ConnectionSchema {
  _id?: string | ObjectId;
  hub?: string | ObjectId;
  template?: string | ObjectId;
  file?: string | ObjectId;
  entity?: unknown;
  entityData?: {
    _id?: string | ObjectId;
    sharedId?: string;
    language?: string;
    mongoLanguage?: string;
    title?: string;
    template?: string | ObjectId;
    published?: boolean;
    icon?: {
      _id?: string | null;
      label?: string;
      type?: string;
    };
    attachments?: {
      _id?: string | ObjectId;
      originalname?: string;
      filename?: string;
      mimetype?: string;
      timestamp?: number;
      size?: number;
      [k: string]: unknown | undefined;
    }[];
    creationDate?: number;
    user?: string | ObjectId;
    metadata?: {
      [k: string]:
        | {
            value:
              | null
              | string
              | number
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
            suggestion_confidence?: number;
            suggestion_model?: string;
            provenance?: '' | 'BULK_ACCEPT';
            [k: string]: unknown | undefined;
          }[]
        | undefined;
    };
    suggestedMetadata?: {
      [k: string]:
        | {
            value:
              | null
              | string
              | number
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
            suggestion_confidence?: number;
            suggestion_model?: string;
            provenance?: '' | 'BULK_ACCEPT';
            [k: string]: unknown | undefined;
          }[]
        | undefined;
    };
    [k: string]: unknown | undefined;
  };
  reference?: {
    text?: unknown;
    selectionRectangles?: {
      top?: number;
      left?: number;
      width?: number;
      height?: number;
      regionId?: string;
      [k: string]: unknown | undefined;
    }[];
    [k: string]: unknown | undefined;
  };
}
