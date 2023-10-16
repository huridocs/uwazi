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
  id?: string;
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
export enum ItemTypes {
  BOX = 'box',
}

export type { IXExtractorInfo, ISublink, ILink, IDraggable, DraggableValue };
