/** @format */

export interface ITemplateProperty {
  id: string;
  _id: string;
  name: string;
  label: string;
  content: string; // this value ought to correspond with a thesaurus._id
  showInCard?: boolean;
  nestedProperties?: Array<any>;
  filter?: boolean;
  defaultfilter?: boolean;
  type?: string;
  isCommonProperty?: boolean;
}

export interface IMetadataTemplate {
  _id: string;
  name: string;
  color?: string;
  default?: boolean;
  properties: Array<ITemplateProperty>;
  commonProperties?: Array<ITemplateProperty>;
}
