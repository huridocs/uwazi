type TenantRouting = {
  tenantId: string;
  logicalName: string; // e.g. 'products'
  resolvedAlias: string; // e.g. 'products_group_enterprise'
  groupName: string; // e.g. 'enterprise' — 'shared' by convention for default
  assignedAt: Date;
};

interface TenantRoutingRepository {
  findRoute(tenantId: string, aliasName: string): Promise<string | null>;
  upsertRoute(record: Omit<TenantRouting, 'assignedAt'>): Promise<void>;
  findTenantsByGroup(groupName: string, aliasName: string): Promise<string[]>;
  deleteRoute(tenantId: string, aliasName: string): Promise<void>;
}

export type { TenantRoutingRepository, TenantRouting };
