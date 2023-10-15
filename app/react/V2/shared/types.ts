import { SettingsLinkSchema } from 'shared/types/settingsType';

interface IXExtractorInfo {
  _id: string;
  name: string;
  property: string;
  templates: string[];
}

interface IDraggable<T> {
  id?: string;
  value: T;
  items?: IDraggable<T>[];
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
export enum ItemTypes {
  BOX = 'box',
}

export type { IXExtractorInfo, ISublink, ILink, IDraggable };
