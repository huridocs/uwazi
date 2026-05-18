/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from '#shared/types/commonTypes.js';

export interface PageDraft {
  content?: string;
  script?: string;
  css?: string;
}

export interface PageRelease {
  version: number;
  content: string;
  script?: string;
  css?: string;
  release_message?: string;
  user?: ObjectIdSchema;
  date: number;
}

export interface PageType {
  _id?: ObjectIdSchema;
  title: string;
  language?: string;
  sharedId?: string;
  creationDate?: number;
  metadata?: {
    _id?: ObjectIdSchema;
    content?: string;
    script?: string;
    css?: string;
  };
  draft?: PageDraft;
  releases?: PageRelease[];
  user?: ObjectIdSchema;
  entityView?: boolean;
  markdownSupport?: boolean;
  __v?: number;
}
