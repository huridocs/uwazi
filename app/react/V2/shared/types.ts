import { SettingsLinkSchema } from 'shared/types/settingsType';

interface IXExtractorInfo {
  _id: string;
  name: string;
  property: string;
  templates: string[];
}
type DraggableValue<T> = T & {
  items?: IDraggable<T>[];
};

interface IDraggable<T> {
  dndId?: string;
  value: DraggableValue<T>;
  iconHandle?: boolean;
  parent?: IDraggable<T>;
  container?: string;
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

export type { IXExtractorInfo, ISublink, ILink, IDraggable, DraggableValue, ItemTypes, Page };
