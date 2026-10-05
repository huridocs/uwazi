import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { OcrFailureReason } from '../domain/OcrFailureReason.js';
import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrStatus } from '../domain/OcrStatus.js';
import { OcrEngine } from './contracts/OcrEngine.js';
import { OcrJobs } from './contracts/OcrJobs.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';
import { OcrServiceNotConfigured } from './errors/OcrServiceNotConfigured.js';
import { OcrServiceUnavailable } from './errors/OcrServiceUnavailable.js';
import { OcrSettled, OcrSettlement } from './OcrSettled.js';

type Input = { recordId: string };

type Deps = {
  ocrDS: OcrRecordDataSource;
  ocrEngine: OcrEngine;
  fileStorage: FileStorage;
  jobs: OcrJobs;
  /** Requests waiting in the service beyond which new ones hold back. */
  maxBacklog: number;
  /** How long a held-back request waits before it is tried again. */
  retryDelayMs: number;
};

/**
 * Sends one queued OCR record to the OCR service, as a new attempt.
 *
 * The PDF is sent first and the record marked processing after, so a crash in between leaves it
 * queued and sent twice at worst — which the attempt key makes harmless. When the service cannot
 * take it now — its backlog is full, or it is down — the request is put back on the queue for
 * later rather than failed, so waiting out an outage never exhausts the job's retries and strands
 * the record.
 *
 * Reports the record settled when it fails here.
 */
class SubmitOcr extends AbstractUseCase<Input, OcrSettled, Deps> {
  async execute({ recordId }: Input): Promise<OcrSettled> {
    const record = await this.deps.ocrDS.getById(recordId);
    if (record?.status !== OcrStatus.QUEUED) {
      return undefined;
    }

    if (record.sourceFileId === null) {
      return this.fail(record, OcrFailureReason.SOURCE_GONE);
    }

    if ((await this.deps.ocrEngine.backlogSize()) >= this.deps.maxBacklog) {
      await this.submitLater(record);
      return undefined;
    }

    return this.send(record);
  }

  private async send(record: OcrRecord): Promise<OcrSettled> {
    const content = await this.readPdf(record.filename);
    const key = record.submit();

    try {
      await this.deps.ocrEngine.submit({
        key,
        filename: record.filename,
        language: record.language,
        content,
      });
    } catch (error) {
      return this.whenNotSent(record.id, error);
    }

    await this.transactionManager.run(async () => this.deps.ocrDS.save(record));
    return undefined;
  }

  /** A service that cannot take it now gets it later; one that never will makes it fail. */
  private async whenNotSent(recordId: string, error: unknown): Promise<OcrSettled> {
    // Nothing was saved: the stored record is still queued, as it was before the attempt.
    const record = (await this.deps.ocrDS.getById(recordId))!;

    if (error instanceof OcrServiceUnavailable) {
      await this.submitLater(record);
      return undefined;
    }
    if (error instanceof OcrServiceNotConfigured) {
      return this.fail(record, OcrFailureReason.SERVICE_NOT_CONFIGURED);
    }
    throw error;
  }

  private async fail(record: OcrRecord, reason: OcrFailureReason): Promise<OcrSettled> {
    record.failUnsent(reason);
    await this.transactionManager.run(async () => this.deps.ocrDS.save(record));
    return OcrSettlement.of(record);
  }

  private async submitLater(record: OcrRecord) {
    await this.transactionManager.run(async () =>
      this.deps.jobs.submitOcr(record.id, { delayMs: this.deps.retryDelayMs })
    );
  }

  private async readPdf(filename: string): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of this.deps.fileStorage
      .getFile({ type: 'document', filename })
      .read()) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}

export { SubmitOcr };
export type { Input as SubmitOcrInput };
