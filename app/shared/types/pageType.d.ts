/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from '#shared/types/commonTypes.js';

export interface PageDraft {
  content?: string;
  script?: string;
  css?: string;
}

export interface PageLocale {
  title?: string;
  slug?: string;
  draft?: PageDraft;
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
  /** Flat view for one request language; source of truth is `locales`. */
  title?: string;
  slug?: string;
  language?: string;
  sharedId?: string;
  creationDate?: number;
  metadata?: {
    _id?: ObjectIdSchema;
    content?: string;
    script?: string;
    css?: string;
  };
  locales?: Record<string, PageLocale>;
  draft?: PageDraft;
  releases?: PageRelease[];
  /** Editor API: releases grouped by locale key */
  releasesByLocale?: Record<string, PageRelease[]>;
  user?: ObjectIdSchema;
  entityView?: boolean;
  markdownSupport?: boolean;
  __v?: number;
}
