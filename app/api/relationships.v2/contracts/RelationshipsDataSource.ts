// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/ResultS... Remove this comment to see the full error message
import { ResultSet } from '../common.v2/contracts/ResultSet.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/model/Entity.js... Remove this comment to see the full error message
import { Entity } from '../entities.v2/model/Entity.js';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { Relationship } from '../model/Relationship';

export interface RelationshipsDataSource {
  insert(relationships: Relationship[]): Promise<Relationship[]>;
  delete(_ids: string[]): Promise<void>;
  deleteAll(): Promise<void>;
  exists(_ids: string[]): Promise<boolean>;
  getById(_ids: string[]): ResultSet<Relationship>;
  getByFiles(fileIds: string[]): ResultSet<Relationship>;
  getByEntities(entityIds: string[]): ResultSet<Relationship>;
  deleteByEntities(sharedIds: string[]): Promise<void>;
  deleteByReferencedFiles(fileIds: string[]): Promise<void>;
  countByType(type: string): Promise<number>;
  getByQuery(query: MatchQueryNode, language: string): ResultSet<Entity>;
}
