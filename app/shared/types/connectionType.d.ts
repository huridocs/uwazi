/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/
import { FileType } from 'shared/types/fileType';

import { ObjectIdSchema } from 'shared/types/commonTypes';

import { EntitySchema } from 'shared/types/entityType';

export interface ConnectionSchema {
  _id?: ObjectIdSchema;
  hub?: ObjectIdSchema;
  template?: ObjectIdSchema;
  file?: ObjectIdSchema;
  entity?: string;
  entityData?: {
    _id?: ObjectIdSchema;
    sharedId?: string;
    language?: string;
    mongoLanguage?: string;
    title?: string;
    template?: ObjectIdSchema;
    published?: boolean;
    generatedToc?: boolean;
    icon?: {
      _id?: string | null;
      label?: string;
      type?: string;
    };
    creationDate?: number;
    user?: ObjectIdSchema;
    metadata?: {
      [k: string]:
        | {
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
    text: string;
    selectionRectangles: {
      top: number;
      left: number;
      width: number;
      height: number;
      page: string;
    }[];
  };
}
