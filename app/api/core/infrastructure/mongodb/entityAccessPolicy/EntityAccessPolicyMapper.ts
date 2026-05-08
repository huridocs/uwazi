import { EntityAccessPolicy } from '#api/core/domain/entityAccessPolicy/EntityAccessPolicy.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { EntityAccessPolicyDBO, PermissionDBO } from './EntityAccessPolicyDBO.js';

class EntityAccessPolicyMapper {
  static toDomain(dbo: EntityAccessPolicyDBO): EntityAccessPolicy {
    const grants = (dbo.permissions ?? [])
      .filter(p => p.type !== 'public')
      .map(p => ({
        refId: p.refId,
        type: p.type as GrantType,
        level: p.level as AccessLevel,
      }));

    return new EntityAccessPolicy({
      sharedId: dbo.sharedId,
      grants,
      isPublic: dbo.published ?? false,
    });
  }

  static toDBO(policy: EntityAccessPolicy): {
    permissions: PermissionDBO[];
    published: boolean;
  } {
    const permissions: PermissionDBO[] = policy.grants.map(g => ({
      refId: g.refId,
      type: g.type,
      level: g.level,
    }));

    return { permissions, published: policy.isPublic };
  }
}

export { EntityAccessPolicyMapper };
