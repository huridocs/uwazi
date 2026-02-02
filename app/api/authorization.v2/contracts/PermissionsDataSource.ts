import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { EntityPermissions } from '../model/EntityPermissions.js';

export interface PermissionsDataSource {
  getByEntities(sharedIds: string[]): ResultSet<EntityPermissions>;
}
