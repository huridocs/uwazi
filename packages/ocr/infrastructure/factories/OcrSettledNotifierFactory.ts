import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { OcrSettledNotifier } from '../jobs/OcrSettledNotifier.js';

class OcrSettledNotifierFactory {
  static default(): OcrSettledNotifier {
    return new OcrSettledNotifier({
      sockets: new V1WebSocketsWrapper(),
      tenantName: ExecutionContext.currentTenant.name,
    });
  }
}

export { OcrSettledNotifierFactory };
