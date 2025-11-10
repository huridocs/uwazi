import { WebSockets } from 'api/core/application/contracts/WebSockets';
import { emitToTenant } from 'api/socketio/setupSockets';

export class V1WebSocketsWrapper implements WebSockets {
  // eslint-disable-next-line class-methods-use-this
  emitToTenant(tenantName: string, event: string, ...data: any[]): void {
    emitToTenant(tenantName, event, data);
  }
}
