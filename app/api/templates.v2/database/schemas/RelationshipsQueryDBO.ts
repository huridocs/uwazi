import { ObjectId } from 'mongodb';

export type FilterDBO =
  | AndFilterDBO
  | TemplateFilterDBO
  | IdFilterDBO
  | SelectFilterDBO
  | VoidFilterDBO;
export interface AndFilterDBO {
  type: 'and';
  value: FilterDBO[];
}

export interface TemplateFilterDBO {
  type: 'template';
  value: ObjectId[];
}

export interface IdFilterDBO {
  type: 'id';
  value: string;
}

export interface SelectFilterDBO {
  type: 'select';
  property: string;
  value: string[];
}

export interface VoidFilterDBO {
  type: 'void';
}

export interface MatchQueryDBO {
  filter: FilterDBO;
  traverse?: TraverseQueryDBO[];
}

export interface TraverseQueryDBO {
  direction: 'in' | 'out';
  types?: ObjectId[];
  match: MatchQueryDBO[];
}
