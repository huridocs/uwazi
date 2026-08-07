export interface WebSockets {
  emitToTenant(tenantName: string, event: string, ...data: any[]): void;
  emitToTenantAdmins(tenantName: string, event: string, ...data: any[]): void;
  emitToTenantAdminsAndEditors(tenantName: string, event: string, ...data: any[]): void;
  emitToSession(sessionId: string, event: string, ...data: any[]): void;
}
