import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { RelationshipProperty } from '../model/RelationshipProperty';

export interface TemplatesDataSource {
  getAllRelationshipProperties(): ResultSet<RelationshipProperty>;
}
