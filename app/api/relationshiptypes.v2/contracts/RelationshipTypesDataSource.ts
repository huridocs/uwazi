import { Transactional } from 'api/common.v2/contracts/Transactional';

export interface RelationshipTypesDataSource extends Transactional {
  typesExist(ids: string[]): Promise<boolean>;
}
