import { z } from 'zod';
import { AccessLevel } from './AccessLevel';
import { PermissionType } from './PermissionType';

const AccessGrantSchema = z.object({
  refId: z.string().min(1, 'refId cannot be empty'),
  type: z.nativeEnum(PermissionType),
  level: z.nativeEnum(AccessLevel),
});

const AccessGrantsSchema = z.array(AccessGrantSchema);

type AccessGrant = z.infer<typeof AccessGrantSchema>;

class EntityPermission {
  accessGrants: AccessGrant[];

  constructor(accessGrants?: AccessGrant[]) {
    this.accessGrants = accessGrants || [];
    this.validate();
  }

  private validate() {
    AccessGrantsSchema.parse(this.accessGrants);

    const refIds = this.accessGrants.map(grant => grant.refId);
    const uniqueRefIds = [...new Set(refIds)];

    if (refIds.length !== uniqueRefIds.length) {
      throw new Error('Permissions should be unique by person/group');
    }
  }
}

export { EntityPermission };
export type { AccessGrant };
