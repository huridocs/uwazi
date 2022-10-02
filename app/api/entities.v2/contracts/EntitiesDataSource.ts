import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Transactional } from 'api/common.v2/contracts/Transactional';
import { Entity } from '../model/Entity';

export interface EntitiesDataSource extends Transactional {
  entitiesExist(sharedIds: string[]): Promise<boolean>;
  getByIds(sharedIds: string[]): ResultSet<Entity>;
}
