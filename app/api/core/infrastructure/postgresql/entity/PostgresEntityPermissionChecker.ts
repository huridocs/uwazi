import {
  EntityPermissionChecker,
  PermissionSpec,
} from '#api/core/domain/entityAccessPolicy/EntityPermissionChecker.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { User } from '#api/users.v2/model/User.js';
import { PostgresPermissionEnforcedTable } from '../common/PostgresPermissionEnforcedTable.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';

type Deps = {
  tenantId: string;
  pgTransactionManager: PostgresTransactionManager;
};

/**
 * Relies entirely on PostgreSQL RLS
 */
class PostgresEntityPermissionChecker implements EntityPermissionChecker {
  private readonly tenantId: string;

  private readonly pgTransactionManager: PostgresTransactionManager;

  constructor(deps: Deps) {
    this.tenantId = deps.tenantId;
    this.pgTransactionManager = deps.pgTransactionManager;
  }

  private tableFor(accessContext: AccessContext): PostgresPermissionEnforcedTable<{
    sharedId: string;
  }> {
    return PostgresPermissionEnforcedTable.for({
      tableName: 'entities',
      tenantId: this.tenantId,
      transactionManager: this.pgTransactionManager,
      accessContext,
    });
  }

  async filterEntities(sharedIds: string[], permissionSpec: PermissionSpec): Promise<string[]> {
    if (sharedIds.length === 0) return [];
    if (permissionSpec.isWriteLevel && permissionSpec.isAnonymous()) return [];

    let query = this.tableFor(permissionSpec).whereIn('sharedId', sharedIds);

    if (permissionSpec.isWriteLevel && !permissionSpec.isPrivileged()) {
      query = query.whereRaw('_perm_write_refs && ?', [permissionSpec.refIds]);
    }

    const rows = await query.select(['sharedId']).distinct(['sharedId']).all();
    return rows.map(row => row.sharedId);
  }

  async checkReadPermission(sharedId: string, user: User): Promise<boolean> {
    const row = await this.tableFor(AccessContext.forActor(user)).where({ sharedId }).first();
    return Boolean(row);
  }

  async checkWritePermission(file: BaseFile, user: User): Promise<boolean> {
    if (user.isAnonymous()) return false;

    if (user.role === 'admin') return true;

    if (!file.isEntityFile()) return false;

    const accessContext = AccessContext.forActor(user);
    const row = await this.tableFor(accessContext)
      .where({ sharedId: file.entity })
      .whereRaw('_perm_write_refs && ?', [accessContext.refIds])
      .first();
    return Boolean(row);
  }
}

export { PostgresEntityPermissionChecker };
