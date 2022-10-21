import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { GraphQueryResult } from '../model/GraphQueryResult';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { Relationship, RelationshipValueQuery } from '../model/Relationship';

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
  exists(ids: string[]): Promise<boolean>;
  getById(_ids: string[]): ResultSet<Relationship>;
  getByEntity(sharedId: string): ResultSet<RelationshipAggregatedResultType>;
  deleteBy(propValues: RelationshipValueQuery): Promise<void>;
  countBy(propValues: RelationshipValueQuery): Promise<number>;
  getByQuery(query: MatchQueryNode, language: string): ResultSet<GraphQueryResult>;
}
