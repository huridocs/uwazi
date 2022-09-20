import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { Transactional } from 'api/common.v2/contracts/Transactional';
import { EntityPermissions } from '../model/EntityPermissions';

export interface PermissionsDataSource extends Transactional {
  getByEntities(sharedIds: string[]): ResultSet<EntityPermissions>;
}
