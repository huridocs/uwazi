import { ObjectId } from 'mongodb';

export type PageContentDBO = {
  content?: string;
  script?: string;
  css?: string;
};

export type PageLocaleDBO = {
  title?: string;
  slug?: string;
  draft?: PageContentDBO;
};

export type PageDBO = {
  _id: ObjectId;
  sharedId: string;
  creationDate?: number;
  user?: ObjectId;
  entityView?: boolean;
  markdownSupport?: boolean;
  locales?: Record<string, PageLocaleDBO>;
};

export type PageReleaseLocaleDBO = {
  title?: string;
  slug?: string;
  content?: string;
  script?: string;
  css?: string;
};

export type PageReleaseDBO = {
  _id?: ObjectId;
  page: ObjectId;
  version: number;
  release_message?: string;
  user?: ObjectId;
  date: number;
  [language: string]: PageReleaseLocaleDBO | ObjectId | number | string | undefined;
};
