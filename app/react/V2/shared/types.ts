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

type PageLocaleForm = {
  title: string;
  draft?: PageDraft;
};

type Page = {
  _id?: string;
  title?: string;
  language?: string;
  sharedId?: string;
  creationDate?: number;
  metadata?: {
    _id?: string;
    content?: string;
    script?: string;
    css?: string;
  };
  locales?: Record<string, PageLocaleForm>;
  draft?: PageDraft;
  releases?: PageRelease[];
  releasesByLocale?: Record<string, PageRelease[]>;
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
  newHeader?: boolean;
  aiAssistant?: boolean;
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
  PageLocaleForm,
  TranslationValue,
  ClientTemplateSchema,
  ClientProperty,
  ClientFeatureFlags,
};
