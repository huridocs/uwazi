import { Tenant } from 'api/tenants/tenantContext';
import { IXExtractorType } from 'shared/types/extractorType';
import { SettingsLinkSchema } from 'shared/types/settingsType';
import { Property, Template } from 'app/apiResponseTypes';
import { ClientPropertySchema } from 'app/istore';

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
  };
  user?: string;
  entityView?: boolean;
};

enum ItemTypes {
  BOX = 'box',
  ROW = 'row',
}

type FeatureFlags = Tenant['featureFlags'] & {};

type ClientFeatureFlags = Pick<FeatureFlags, 'paragraphExtraction'>;

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
  ClientFeatureFlags,
  ClientTemplateSchema,
  ClientProperty,
};
