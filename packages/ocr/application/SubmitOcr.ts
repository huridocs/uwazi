import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { OcrFailureReason } from '../domain/OcrFailureReason.js';
import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrStatus } from '../domain/OcrStatus.js';
import { OcrEngine } from './contracts/OcrEngine.js';
import { OcrJobs } from './contracts/OcrJobs.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';
import { OcrLanguageNotSupported } from './errors/OcrLanguageNotSupported.js';
import { OcrServiceNotConfigured } from './errors/OcrServiceNotConfigured.js';
import { OcrServiceUnavailable } from './errors/OcrServiceUnavailable.js';

type Input = { recordId: string };

type Deps = {
  ocrDS: OcrRecordDataSource;
  ocrEngine: OcrEngine;
  fileStorage: FileStorage;
  jobs: OcrJobs;
  sockets: WebSockets;
  tenantName: string;
  now: () => number;
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
 */
class SubmitOcr extends AbstractUseCase<Input, void, Deps> {
  async execute({ recordId }: Input): Promise<void> {
    const record = await this.deps.ocrDS.getById(recordId);
    if (record?.status !== OcrStatus.QUEUED) {
      return;
    }

    if (record.sourceFileId === null) {
      await this.fail(record, OcrFailureReason.SOURCE_GONE);
      return;
    }

    if ((await this.deps.ocrEngine.backlogSize()) >= this.deps.maxBacklog) {
      await this.submitLater(record);
      return;
    }

    await this.send(record);
  }

  private async send(record: OcrRecord) {
    const content = await this.readPdf(record.filename);
    const key = record.submit(this.deps.now());

    try {
      await this.deps.ocrEngine.submit({
        key,
        filename: record.filename,
        language: record.language,
        content,
      });
    } catch (error) {
      await this.whenNotSent(record.id, error);
      return;
    }

    await this.transactionManager.run(async () => this.deps.ocrDS.save(record));
  }

  /** A service that cannot take it now gets it later; one that never will makes it fail. */
  private async whenNotSent(recordId: string, error: unknown) {
    // Nothing was saved: the stored record is still queued, as it was before the attempt.
    const record = (await this.deps.ocrDS.getById(recordId))!;

    if (error instanceof OcrServiceUnavailable) {
      await this.submitLater(record);
    } else if (error instanceof OcrServiceNotConfigured) {
      await this.fail(record, OcrFailureReason.SERVICE_NOT_CONFIGURED);
    } else if (error instanceof OcrLanguageNotSupported) {
      await this.fail(record, OcrFailureReason.UNEXPECTED);
    } else {
      throw error;
    }
  }

  private async fail(record: OcrRecord, reason: OcrFailureReason) {
    record.failUnsent(reason, this.deps.now());
    await this.transactionManager.run(async () => this.deps.ocrDS.save(record));
    if (record.sourceFileId !== null) {
      this.deps.sockets.emitToTenantAdminsAndEditors(
        this.deps.tenantName,
        'ocr:error',
        record.sourceFileId
      );
    }
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
