import { User } from '#api/users.v2/model/User.js';
import { ResultType } from '#api/core/libs/Result.js';
import { BaseFile } from '../files/BaseFile.js';
import { PermissionSpec } from './PermissionSpec.js';

interface EntityPermissionChecker {
  filterEntities(sharedIds: string[], permissionSpec: PermissionSpec): Promise<string[]>;
  checkReadPermission(sharedId: string, user: User): Promise<ResultType<boolean, Error>>;
  checkWritePermission(file: BaseFile, user: User): Promise<ResultType<boolean, Error>>;
}

export type { EntityPermissionChecker };
export { PermissionSpec };
