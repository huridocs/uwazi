import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Transactional } from 'api/common.v2/contracts/Transactional';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { Relationship } from '../model/Relationship';

export interface RelationshipsDataSource extends Transactional {
  insert(relationships: Relationship[]): Promise<Relationship[]>;
  delete(_ids: string[]): Promise<Relationship[]>;
  exists(ids: string[]): Promise<boolean>;
  getById(_ids: string[]): ResultSet<Relationship>;
  getByEntity(sharedId: string): ResultSet<any>;
  getByQuery(query: MatchQueryNode, language: string): ResultSet<any>;
}
