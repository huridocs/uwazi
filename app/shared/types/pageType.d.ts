/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from '#shared/types/commonTypes.js';

export interface PageDraft {
  content?: string;
  script?: string;
  css?: string;
}

export interface PageEditorPayload {
  _id?: ObjectIdSchema;
  sharedId?: string;
  creationDate?: number;
  entityView?: boolean;
  markdownSupport?: boolean;
  locales: {
    [k: string]:
      | {
          title: string;
          draft?: PageDraft;
        }
      | undefined;
  };
}

export interface PageLocale {
  title?: string;
  draft?: {
    content?: string;
    script?: string;
    css?: string;
  };
}

export interface PageRelease {
  version: number;
  content: string;
  script?: string;
  css?: string;
  release_message?: string;
  user?: string | ObjectId;
  date: number;
}

export interface PageType {
  _id?: ObjectIdSchema;
  title?: string;
  language?: string;
  sharedId?: string;
  creationDate?: number;
  metadata?: {
    _id?: ObjectIdSchema;
    content?: string;
    script?: string;
    css?: string;
  };
  locales?: {
    [k: string]: PageLocale | undefined;
  };
  draft?: PageDraft;
  releases?: PageRelease[];
  releasesByLocale?: {
    [k: string]: PageRelease[] | undefined;
  };
  entityView?: boolean;
  markdownSupport?: boolean;
  __v?: number;
}
