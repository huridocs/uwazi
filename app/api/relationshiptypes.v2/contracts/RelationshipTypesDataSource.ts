import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { RelationshipType } from '../model/RelationshipType.js';

export interface RelationshipTypesDataSource {
  typesExist(ids: string[]): Promise<boolean>;
  getRelationshipTypeIds(): Promise<string[]>;
  getByIds(ids: string[]): ResultSet<RelationshipType>;
}
