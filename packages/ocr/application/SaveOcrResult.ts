import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import type { RelationshipsV1DataSource } from '#shared/contracts/RelationshipsV1DataSource.js';
import { IdempotencyKey } from '../domain/IdempotencyKey.js';
import { OcrFailureReason } from '../domain/OcrFailureReason.js';
import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrEngine, OcrOutcome, OcrResultFile, OutcomeHandle } from './contracts/OcrEngine.js';
import { OcrJobs } from './contracts/OcrJobs.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';
import { MalformedOcrResult } from './errors/MalformedOcrResult.js';
import { OcrResultGone } from './errors/OcrResultGone.js';
import { OcrSettled, OcrSettlement } from './OcrSettled.js';

/** The record, and the key of the attempt a result was reported for. */
type Attempt = { record: OcrRecord; key: IdempotencyKey };

/** What becomes of the attempt, decided before anything is written. */
type Resolution =
  | { kind: 'complete'; source: PDFDocument; resultFile: PDFDocument }
  | { kind: 'fail'; reason: OcrFailureReason }
  | { kind: 'requeue' };

type Deps = {
  ocrDS: OcrRecordDataSource;
  ocrEngine: OcrEngine;
  filesDS: FilesDataSource;
  filesService: FilesService;
  relationshipsV1DS: RelationshipsV1DataSource;
  fileStorage: FileStorage;
  idGenerator: IdGenerator;
  jobs: OcrJobs;
};

/**
 * Takes what the OCR service reported for one request, in a single transaction.
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
class SaveOcrResult extends AbstractUseCase<OcrOutcome, OcrSettled, Deps> {
  async execute(outcome: OcrOutcome): Promise<OcrSettled> {
    const attempt = await this.currentAttempt(outcome);
    if (!attempt) {
      return undefined;
    }

    const resolution = await this.resolve(attempt.record, outcome);
    try {
      await this.transactionManager.run(async () => this.apply(attempt, resolution));
    } catch (error) {
      if (resolution.kind === 'complete') {
        await this.deps.fileStorage.removeFile(
          resolution.resultFile as PDFDocument & { content: never }
        );
      }
      throw error;
    }
    return OcrSettlement.of(attempt.record);
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

  /** Does the work outside the store: fetching the result and storing its file. */
  private async resolve(record: OcrRecord, outcome: OcrOutcome): Promise<Resolution> {
    if (!outcome.succeeded) {
      return { kind: 'fail', reason: outcome.reason };
    }

    const source = await this.sourceOf(record);
    if (!source) {
      return { kind: 'fail', reason: OcrFailureReason.SOURCE_GONE };
    }

    const fetched = await this.fetch(outcome.handle);
    if ('kind' in fetched) {
      return fetched;
    }

    return { kind: 'complete', source, resultFile: await this.storeResultFile(source, fetched) };
  }

  private async apply({ record, key }: Attempt, resolution: Resolution) {
    switch (resolution.kind) {
      case 'complete':
        await this.replaceSource(resolution.source, resolution.resultFile);
        record.complete(key, resolution.resultFile.id);
        break;
      case 'requeue':
        record.requeue();
        await this.deps.jobs.submitOcr(record.id);
        break;
      default:
        record.fail(key, resolution.reason);
    }
    await this.deps.ocrDS.save(record);
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

  /** The result, or what to do when the service cannot hand it over. */
  private async fetch(handle: OutcomeHandle): Promise<OcrResultFile | Resolution> {
    try {
      return await this.deps.ocrEngine.fetchResult(handle);
    } catch (error) {
      if (error instanceof OcrResultGone) {
        return { kind: 'requeue' };
      }
      if (error instanceof MalformedOcrResult) {
        return { kind: 'fail', reason: OcrFailureReason.UNEXPECTED };
      }
      throw error;
    }
  }

  /** Stores the result's content, not yet its file record. */
  private async storeResultFile(source: PDFDocument, fetched: OcrResultFile) {
    const inputFile = await InputFile.fromStream({
      stream: fetched.pdf,
      originalname: `ocr_${source.originalname}`,
      mimetype: fetched.mimetype,
      type: 'document',
    });
    const resultFile = inputFile.toEntityFile(
      source.entity,
      this.deps.idGenerator.generate()
    ) as PDFDocument;
    await this.deps.filesService.storeFiles([resultFile]);
    return resultFile;
  }

  /** The result becomes the entity's document, and the source an attachment. */
  private async replaceSource(source: PDFDocument, resultFile: PDFDocument) {
    await this.deps.filesService.insert([resultFile]);
    await this.deps.filesService.demoteToAttachment(source.id);
    await this.deps.relationshipsV1DS.updateMany(
      { file: source.id },
      { set: { file: resultFile.id } }
    );
  }
}

export { SaveOcrResult };
