import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { EntityPermissions } from '../model/EntityPermissions';

export interface PermissionsDataSource {
  getByEntities(sharedIds: string[]): ResultSet<EntityPermissions>;
}
