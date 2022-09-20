import { Transactional } from 'api/common.v2/contracts/Transactional';

export interface EntitiesDataSource extends Transactional {
  entitiesExist(sharedIds: string[]): Promise<boolean>;
}
