import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Entity } from 'api/entities.v2/model/Entity';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { Relationship } from '../model/Relationship';

export interface RelationshipsDataSource {
  insert(relationships: Relationship[]): Promise<Relationship[]>;
  delete(_ids: string[]): Promise<void>;
  deleteAll(): Promise<void>;
  exists(_ids: string[]): Promise<boolean>;
  getAll(): ResultSet<Relationship>;
  getById(_ids: string[]): ResultSet<Relationship>;
  getByFiles(fileIds: string[]): ResultSet<Relationship>;
  getByEntities(entityIds: string[]): ResultSet<Relationship>;
  deleteByEntities(sharedIds: string[]): Promise<void>;
  deleteByReferencedFiles(fileIds: string[]): Promise<void>;
  countByType(type: string): Promise<number>;
  getByQuery(query: MatchQueryNode, language: string): ResultSet<Entity>;
}
