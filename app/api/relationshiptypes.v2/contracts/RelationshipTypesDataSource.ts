import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { RelationshipType } from '../model/RelationshipType.js';

export interface RelationshipTypesDataSource {
  getAll(): Promise<RelationshipType[]>;
  getById(id: string): Promise<RelationshipType | null>;
  create(input: { name: string }): Promise<RelationshipType>;
  update(input: { id: string; name: string }): Promise<RelationshipType>;
  delete(id: string): Promise<void>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  typesExist(ids: string[]): Promise<boolean>;
  getRelationshipTypeIds(): Promise<string[]>;
  getByIds(ids: string[]): ResultSet<RelationshipType>;
}
