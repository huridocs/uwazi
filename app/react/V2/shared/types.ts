import type { PageDraft, PageRelease } from '#shared/types/pageType.js';
import { IXExtractorType } from '#shared/types/extractorType.js';
import { SettingsLinkSchema } from '#shared/types/settingsType.js';
import { Property, Template } from '#app/apiResponseTypes.js';
import { ClientPropertySchema } from '#app/istore.js';

interface ClientIXExtractorType extends Omit<IXExtractorType, '_id'> {
  _id?: string;
  templates: string[];
  inheritedProperty?: ClientPropertySchema | undefined;
}

type DraggableValue<T> = T & {
  items?: IDraggable<T>[];
};

type TranslationValue = {
  language: string;
  key: string;
  value: string;
};

interface IDraggable<T> {
  dndId?: string;
  value: DraggableValue<T>;
  iconHandle?: boolean;
  parent?: IDraggable<T>;
  container?: string;
  fixed?: boolean;
}

type ISublink = {
  title: string;
  url: string;
};

type ILink = Omit<SettingsLinkSchema, 'sublinks'> & {
  title: string;
  sublinks: [ISublink];
};

type Page = {
  _id?: string;
  title: string;
  language?: string;
  sharedId?: string;
  creationDate?: number;
  metadata?: {
    _id?: string;
    content?: string;
    script?: string;
    css?: string;
  };
  draft?: PageDraft;
  releases?: PageRelease[];
  user?: string;
  entityView?: boolean;
  markdownSupport?: boolean;
};

enum ItemTypes {
  BOX = 'box',
  ROW = 'row',
}

type ClientFeatureFlags = {
  paragraphExtraction?: boolean;
  themeCustomization?: boolean;
  v2CSVImport?: boolean;
  newHeader?: boolean;
  v2GetEntity?: boolean;
};

type ClientProperty = Property & {
  _id?: string;
};

type ClientTemplateSchema = Template & {
  _id?: string;
  commonProperties?: [ClientProperty, ...ClientProperty[]];
  properties?: ClientProperty[];
};

export { ItemTypes };
export type {
  ClientIXExtractorType,
  ISublink,
  ILink,
  IDraggable,
  DraggableValue,
  Page,
  TranslationValue,
  ClientTemplateSchema,
  ClientProperty,
  ClientFeatureFlags,
};
