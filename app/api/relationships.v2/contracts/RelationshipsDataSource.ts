import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { GraphQueryResult } from '../model/GraphQueryResult';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { Relationship } from '../model/Relationship';

export type RelationshipAggregatedResultType = {
  _id: string;
  type: string;
  from: {
    sharedId: string;
    title: string;
  };
  to: {
    sharedId: string;
    title: string;
  };
};

export interface RelationshipsDataSource {
  insert(relationships: Relationship[]): Promise<Relationship[]>;
  delete(_ids: string[]): Promise<void>;
  exists(_ids: string[]): Promise<boolean>;
  getById(_ids: string[]): ResultSet<Relationship>;
  deleteByEntities(sharedIds: string[]): Promise<void>;
  countByType(type: string): Promise<number>;
  getByQuery(query: MatchQueryNode, language: string): ResultSet<GraphQueryResult>;
}
