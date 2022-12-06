import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { GraphQueryResult } from '../model/GraphQueryResult';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { Relationship } from '../model/Relationship';

export interface RelationshipsDataSource {
  insert(relationships: Relationship[]): Promise<Relationship[]>;
  delete(_ids: string[]): Promise<void>;
  exists(_ids: string[]): Promise<boolean>;
  getById(_ids: string[]): ResultSet<Relationship>;
  getByFiles(fileIds: string[]): ResultSet<Relationship>;
  deleteByEntities(sharedIds: string[]): Promise<void>;
  deleteByReferencedFiles(fileIds: string[]): Promise<void>;
  countByType(type: string): Promise<number>;
  getByQuery(query: MatchQueryNode, language: string): ResultSet<GraphQueryResult>;
}
