import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';

export interface TemplatesDataSource {
  getAllTemplatesIds(): ResultSet<string>;
  getAllRelationshipProperties(): ResultSet<RelationshipProperty>;
  getAllProperties(): ResultSet<Property>;
  getPropertyByName(name: string): Promise<Property>;
  getTemplatesIdsHavingProperty(propertyName: string): ResultSet<string>;
}
