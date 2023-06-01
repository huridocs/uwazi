import { ObjectId } from 'mongodb';

export type FilterDBO = AndFilterDBO | TemplateFilterDBO | IdFilterDBO | VoidFilter;
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

export interface VoidFilter {
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
