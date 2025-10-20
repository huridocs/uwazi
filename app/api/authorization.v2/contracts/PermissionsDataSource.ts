import { ResultSet } from 'api/core/libs/ResultSet';
import { EntityPermissions } from '../model/EntityPermissions';

export interface PermissionsDataSource {
  getByEntities(sharedIds: string[]): ResultSet<EntityPermissions>;
}
