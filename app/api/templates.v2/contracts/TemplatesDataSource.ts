import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Property } from '../model/Property';
import { RelationshipProperty } from '../model/RelationshipProperty';

export interface TemplatesDataSource {
  getAllRelationshipProperties(): ResultSet<RelationshipProperty>;
  getAllProperties(): ResultSet<Property>;
  getPropertyByName(name: string): Promise<Property>;
}
