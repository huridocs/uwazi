import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Transactional } from 'api/common.v2/contracts/Transactional';
import { Relationship } from '../model/Relationship';
import { RelationshipsQuery } from './RelationshipsQuery';

export interface RelationshipsDataSource extends Transactional {
  insert(relationships: Relationship[]): Promise<Relationship[]>;
  delete(_ids: string[]): Promise<Relationship[]>;
  exists(ids: string[]): Promise<boolean>;
  getById(_ids: string[]): ResultSet<Relationship>;
  getByEntity(sharedId: string): ResultSet<any>;
  getByQuery(query: RelationshipsQuery): ResultSet<any>;
}
