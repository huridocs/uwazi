import { SettingsLinkSchema } from 'shared/types/settingsType';

interface IXExtractorInfo {
  _id: string;
  name: string;
  property: string;

  templates: string[];
}

interface IDraggable {
  id?: string;
  name: string;
  items?: IDraggable[];
  iconHandle?: boolean;
  parent?: IDraggable;
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
  METADATA_TEMPLATE = 'metadatatemplate',
  LINK = 'link',
  BOX = 'box',
  FILTER = 'filter',
}

export type { IXExtractorInfo, ISublink, ILink, IDraggable };
