import { ResultSet } from 'api/core/libs/ResultSet';
import { RelationshipType } from '../model/RelationshipType';

export interface RelationshipTypesDataSource {
  typesExist(ids: string[]): Promise<boolean>;
  getRelationshipTypeIds(): Promise<string[]>;
  getByIds(ids: string[]): ResultSet<RelationshipType>;
}
