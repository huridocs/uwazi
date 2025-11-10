export interface WebSockets {
  emitToTenant(tenantName: string, event: string, ...data: any[]): void;
}
