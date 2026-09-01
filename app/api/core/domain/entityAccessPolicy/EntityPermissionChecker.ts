import { User } from '#api/users.v2/model/User.js';
import { BaseFile } from '../files/BaseFile.js';
import { PermissionSpec } from './PermissionSpec.js';

interface EntityPermissionChecker {
  filterEntities(sharedIds: string[], permissionSpec: PermissionSpec): Promise<string[]>;
  checkReadPermission(sharedId: string, user: User): Promise<boolean>;
  checkWritePermission(file: BaseFile, user: User): Promise<boolean>;
}

export type { EntityPermissionChecker };
export { PermissionSpec };
