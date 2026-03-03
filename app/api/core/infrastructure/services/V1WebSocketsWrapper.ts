import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { emitToTenant, emitToSession, emitToTenantAdmins } from '#api/socketio/setupSockets.js';

export class V1WebSocketsWrapper implements WebSockets {
  // eslint-disable-next-line class-methods-use-this
  emitToTenant(tenantName: string, event: string, ...data: any[]): void {
    emitToTenant(tenantName, event, ...data);
  }

  // eslint-disable-next-line class-methods-use-this
  emitToSession(sessionId: string, event: string, ...data: any[]) {
    emitToSession(sessionId, event, ...data);
  }

  // eslint-disable-next-line class-methods-use-this
  emitToTenantAdmins(tenantName: string, event: string, ...data: any[]): void {
    emitToTenantAdmins(tenantName, event, ...data);
  }
}
