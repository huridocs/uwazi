import { SettingsLinkSchema } from 'shared/types/settingsType';

interface IXExtractorInfo {
  _id?: string;
  name: string;
  property: string;
  templates: string[];
}
type ISublink = {
  title: string;
  url: string;
};

type ILink = Omit<SettingsLinkSchema, 'sublinks'> & {
  title: string;
  sublinks: [ISublink];
};

export const ItemTypes = {
  METADATA_TEMPLATE: 'metadatatemplate',
  LINK: 'link',
};

export type { IXExtractorInfo, ISublink, ILink };
