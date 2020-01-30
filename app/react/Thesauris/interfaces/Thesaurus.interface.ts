/** @format */
import { ITemplateProperty } from 'app/Templates/interfaces/MetadataTemplate.interface';

export interface IThesaurusTopic {
  id: string;
  _id: string;
  label: string;
}

export interface IThesaurus {
  _id: string;
  name: string;
  values: Array<IThesaurusTopic>;
  __v?: number;
  enableClassification?: boolean;
  property?: ITemplateProperty;
}
