import { emitToSession, emitToTenant } from 'api/socketio/setupSockets';

export class WorkerSockets {
  // eslint-disable-next-line class-methods-use-this
  emitToSession(sessionId: string, event: string, ...data: any[]) {
    emitToSession(sessionId, event, ...data);
  }

  // eslint-disable-next-line class-methods-use-this
  emitToTenant(tenantName: string, event: string, ...data: any[]) {
    emitToTenant(tenantName, event, ...data);
  }
}
