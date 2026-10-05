import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import type { RelationshipsV1DataSource } from '#shared/contracts/RelationshipsV1DataSource.js';
import { IdempotencyKey } from '../domain/IdempotencyKey.js';
import { OcrFailureReason } from '../domain/OcrFailureReason.js';
import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrEngine, OcrOutcome, OutcomeHandle } from './contracts/OcrEngine.js';
import { OcrJobs } from './contracts/OcrJobs.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';
import { MalformedOcrResult } from './errors/MalformedOcrResult.js';
import { OcrResultGone } from './errors/OcrResultGone.js';

/** The record, and the key of the attempt a result was reported for. */
type Attempt = { record: OcrRecord; key: IdempotencyKey };

type Deps = {
  ocrDS: OcrRecordDataSource;
  ocrEngine: OcrEngine;
  filesDS: FilesDataSource;
  filesService: FilesService;
  relationshipsV1DS: RelationshipsV1DataSource;
  fileStorage: FileStorage;
  idGenerator: IdGenerator;
  sockets: WebSockets;
  jobs: OcrJobs;
  tenantName: string;
  now: () => number;
};

/**
 * Takes what the OCR service reported for one request.
 *
 * Only the outcome of the record's current attempt, while it is processing, is taken; a stale or
 * duplicate one is dropped before anything is fetched, since the service hands each result out
 * once and fetching a stale one could consume the current one. An outcome without a key — sent
 * before the service echoed keys — is matched by filename and taken as the current attempt.
 *
 * A result the service no longer holds is requested again; one that cannot be understood, or whose
 * source file is gone, fails the record, since asking again would not change it.
 *
 * The result file is stored first, outside the transaction; if the transaction then fails the
 * stored copy is removed and the error rethrown for the job to retry.
 */
class SaveOcrResult extends AbstractUseCase<OcrOutcome, void, Deps> {
  async execute(outcome: OcrOutcome): Promise<void> {
    const attempt = await this.currentAttempt(outcome);
    if (attempt) {
      await this.apply(attempt, outcome);
    }
  }

  private async apply(attempt: Attempt, outcome: OcrOutcome) {
    if (!outcome.succeeded) {
      await this.fail(attempt, outcome.reason);
      return;
    }

    const source = await this.sourceOf(attempt.record);
    if (source) {
      await this.takeResult(attempt, source, outcome.handle);
    } else {
      await this.fail(attempt, OcrFailureReason.SOURCE_GONE);
    }
  }

  /** The attempt the outcome belongs to, unless it is stale, a duplicate, or for no record. */
  private async currentAttempt(outcome: OcrOutcome): Promise<Attempt | undefined> {
    const record = outcome.key
      ? await this.deps.ocrDS.getById(outcome.key.recordId)
      : await this.deps.ocrDS.getByFilename(outcome.filename);
    if (!record) {
      return undefined;
    }

    const key = outcome.key ?? IdempotencyKey.of(record.id, record.attempt);
    return record.accepts(key) ? { record, key } : undefined;
  }

  /** The record's source file, when it is still a document. */
  private async sourceOf(record: OcrRecord) {
    if (record.sourceFileId === null) {
      return undefined;
    }
    const found = await this.deps.filesDS.getById(record.sourceFileId);
    if (found.isError() || found.getData().type !== 'document') {
      return undefined;
    }
    return found.getData() as PDFDocument;
  }

  private async takeResult(attempt: Attempt, source: PDFDocument, handle: OutcomeHandle) {
    let fetched: Awaited<ReturnType<OcrEngine['fetchResult']>>;
    try {
      fetched = await this.deps.ocrEngine.fetchResult(handle);
    } catch (error) {
      await this.whenNotFetched(attempt, error);
      return;
    }
    await this.store(attempt, source, fetched);
  }

  private async store(
    attempt: Attempt,
    source: PDFDocument,
    fetched: Awaited<ReturnType<OcrEngine['fetchResult']>>
  ) {
    const resultFile = await this.toResultFile(source, fetched);
    await this.deps.filesService.storeFiles([resultFile]);
    try {
      await this.replaceSource(attempt, source, resultFile);
    } catch (error) {
      await this.deps.fileStorage.removeFile(resultFile as PDFDocument & { content: never });
      throw error;
    }
  }

  private async toResultFile(
    source: PDFDocument,
    fetched: Awaited<ReturnType<OcrEngine['fetchResult']>>
  ) {
    const inputFile = await InputFile.fromStream({
      stream: fetched.pdf,
      originalname: `ocr_${source.originalname}`,
      mimetype: fetched.mimetype,
      type: 'document',
    });
    return inputFile.toEntityFile(source.entity, this.deps.idGenerator.generate()) as PDFDocument;
  }

  private async replaceSource(attempt: Attempt, source: PDFDocument, resultFile: PDFDocument) {
    await this.transactionManager.run(async () => {
      await this.deps.filesService.insert([resultFile]);
      await this.deps.filesService.demoteToAttachment(source.id);
      await this.deps.relationshipsV1DS.updateMany(
        { file: source.id },
        { set: { file: resultFile.id } }
      );
      attempt.record.complete(attempt.key, resultFile.id, this.deps.now());
      await this.deps.ocrDS.save(attempt.record);
      this.transactionManager.onCommitted(async () => this.notify('ocr:ready', source.id));
    });
  }

  private async whenNotFetched(attempt: Attempt, error: unknown) {
    if (error instanceof OcrResultGone) {
      attempt.record.requeue(this.deps.now());
      await this.transactionManager.run(async () => {
        await this.deps.ocrDS.save(attempt.record);
        await this.deps.jobs.submitOcr(attempt.record.id);
      });
      return;
    }
    if (error instanceof MalformedOcrResult) {
      await this.fail(attempt, OcrFailureReason.UNEXPECTED);
      return;
    }
    throw error;
  }

  private async fail({ record, key }: Attempt, reason: OcrFailureReason) {
    record.fail(key, reason, this.deps.now());
    await this.transactionManager.run(async () => this.deps.ocrDS.save(record));
    if (record.sourceFileId !== null) {
      this.notify('ocr:error', record.sourceFileId);
    }
  }

  private notify(event: 'ocr:ready' | 'ocr:error', sourceFileId: string) {
    this.deps.sockets.emitToTenantAdminsAndEditors(this.deps.tenantName, event, sourceFileId);
  }
}

export { SaveOcrResult };
