import { SettingsLinkSchema } from 'shared/types/settingsType';

interface IXExtractorInfo {
  _id?: string;
  name: string;
  property: string;

  templates: string[];
}

interface IDraggable {
  name: string;
  iconHandle: boolean;
  items: IDraggable[];
  sortLink: Function;
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
