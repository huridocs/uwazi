import { WebSockets } from 'api/core/application/contracts/WebSockets';
import { emitToTenant, emitToSession } from 'api/socketio/setupSockets';

export class V1WebSocketsWrapper implements WebSockets {
  // eslint-disable-next-line class-methods-use-this
  emitToTenant(tenantName: string, event: string, ...data: any[]): void {
    emitToTenant(tenantName, event, ...data);
  }

  // eslint-disable-next-line class-methods-use-this
  emitToSession(sessionId: string, event: string, ...data: any[]) {
    emitToSession(sessionId, event, ...data);
  }
}
