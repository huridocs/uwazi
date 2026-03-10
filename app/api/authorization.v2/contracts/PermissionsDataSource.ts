import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { EntityPermissions } from '../model/EntityPermissions';

export interface PermissionsDataSource {
  getByEntities(sharedIds: string[]): ResultSet<EntityPermissions>;
}
