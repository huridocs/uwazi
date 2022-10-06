import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Transactional } from 'api/common.v2/contracts/Transactional';
import { RelationshipProperty } from '../model/RelationshipProperty';

export interface TemplatesDataSource extends Transactional {
  getAllRelationshipProperties(): ResultSet<RelationshipProperty>;
}
