type TenantRouting = {
  tenantId: string;
  aliasName: string; // e.g. 'products'
  resolvedAlias: string; // e.g. 'products_group_enterprise'
  groupName: string; // e.g. 'enterprise'
  assignedAt: Date;
};

interface TenantRoutingDataSource {
  findRoute(tenantId: string, aliasName: string): Promise<string | null>;
  upsertRoute(record: Omit<TenantRouting, 'assignedAt'>): Promise<void>;
  deleteRoute(tenantId: string, aliasName: string): Promise<void>;
}

export type { TenantRoutingDataSource, TenantRouting };
