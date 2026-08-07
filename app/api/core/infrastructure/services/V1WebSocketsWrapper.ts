/* eslint-disable class-methods-use-this */
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import {
  emitToTenant,
  emitToSession,
  emitToTenantAdmins,
  emitToTenantAdminsAndEditors,
} from '#api/socketio/setupSockets.js';

export class V1WebSocketsWrapper implements WebSockets {
  emitToTenant(tenantName: string, event: string, ...data: any[]): void {
    emitToTenant(tenantName, event, ...data);
  }

  emitToSession(sessionId: string, event: string, ...data: any[]) {
    emitToSession(sessionId, event, ...data);
  }

  emitToTenantAdmins(tenantName: string, event: string, ...data: any[]): void {
    emitToTenantAdmins(tenantName, event, ...data);
  }

  emitToTenantAdminsAndEditors(tenantName: string, event: string, ...data: any[]): void {
    emitToTenantAdminsAndEditors(tenantName, event, ...data);
  }
}
