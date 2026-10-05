import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';

type Deps = {
  ocrDS: OcrRecordDataSource;
  sockets: WebSockets;
  tenantName: string;
  now: () => number;
  /** How long a record may wait for its result before it is given up on. */
  maxAgeMs: number;
  batchSize: number;
};

/**
 * Gives up on records the service never answered for: processing since before the cutoff. Each
 * fails as timed out and the editors are told, so a lost request does not stay "in progress"
 * forever. Works in batches until none is left, which also bounds what one transaction holds.
 */
class FailStaleOcrRecords extends AbstractUseCase<void, number, Deps> {
  async execute(): Promise<number> {
    const cutoff = this.deps.now() - this.deps.maxAgeMs;
    let total = 0;
    let batch: OcrRecord[];

    do {
      // Each pass takes its records out of processing, so the next one sees new ones only.
      // eslint-disable-next-line no-await-in-loop
      batch = await this.deps.ocrDS.staleProcessing(cutoff, this.deps.batchSize);
      // eslint-disable-next-line no-await-in-loop
      await this.timeOut(batch);
      total += batch.length;
    } while (batch.length === this.deps.batchSize);

    return total;
  }

  private async timeOut(batch: OcrRecord[]) {
    if (!batch.length) {
      return;
    }

    await this.transactionManager.run(async () => {
      await Promise.all(
        batch.map(async record => {
          record.timeOut(this.deps.now());
          await this.deps.ocrDS.save(record);
        })
      );
    });

    batch.forEach(({ sourceFileId }) => {
      if (sourceFileId !== null) {
        this.deps.sockets.emitToTenantAdminsAndEditors(
          this.deps.tenantName,
          'ocr:error',
          sourceFileId
        );
      }
    });
  }
}

export { FailStaleOcrRecords };
