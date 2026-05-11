import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';

type PermissionDBO = {
  refId: string;
  type: GrantType;
  level: AccessLevel;
};

type EntityAccessPolicyDBO = {
  sharedId: string;
  published?: boolean;
  permissions?: PermissionDBO[];
};

export type { EntityAccessPolicyDBO, PermissionDBO };
