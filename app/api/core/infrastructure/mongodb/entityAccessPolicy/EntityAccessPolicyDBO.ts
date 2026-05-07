type PermissionDBO = {
  refId: string;
  type: 'user' | 'group' | 'public';
  level: 'read' | 'write' | 'mixed';
};

type EntityAccessPolicyDBO = {
  sharedId: string;
  published?: boolean;
  permissions?: PermissionDBO[];
};

export type { EntityAccessPolicyDBO, PermissionDBO };
