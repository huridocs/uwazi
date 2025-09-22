import { ResultSet } from '../common.v2/contracts/ResultSet.js';
import { EntityPermissions } from '../model/EntityPermissions';

export interface PermissionsDataSource {
  getByEntities(sharedIds: string[]): ResultSet<EntityPermissions>;
}
