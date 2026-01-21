import { ResultSet } from '#api/common.v2/contracts/ResultSet.js';
import { EntityPermissions } from '#api/authorization.v2/model/EntityPermissions.js';

export interface PermissionsDataSource {
  getByEntities(sharedIds: string[]): ResultSet<EntityPermissions>;
}
