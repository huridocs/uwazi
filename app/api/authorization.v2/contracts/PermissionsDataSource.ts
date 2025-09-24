// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/ResultS... Remove this comment to see the full error message
import { ResultSet } from '../common.v2/contracts/ResultSet.js';
import { EntityPermissions } from '../model/EntityPermissions';

export interface PermissionsDataSource {
  getByEntities(sharedIds: string[]): ResultSet<EntityPermissions>;
}
