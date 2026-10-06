import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { OcrSettled } from '../../application/OcrSettled.js';
import { OcrStatus } from '../../domain/OcrStatus.js';

type Deps = { sockets: WebSockets; tenantName: string };

/** Tells the tenant's editors a record settled; the front end picks the file by its id. */
class OcrSettledNotifier {
  constructor(private readonly deps: Deps) {}

  notify(settled: OcrSettled): void {
    if (!settled) {
      return;
    }
    const event = settled.status === OcrStatus.READY ? 'ocr:ready' : 'ocr:error';
    this.deps.sockets.emitToTenantAdminsAndEditors(
      this.deps.tenantName,
      event,
      settled.sourceFileId
    );
  }
}

export { OcrSettledNotifier };
