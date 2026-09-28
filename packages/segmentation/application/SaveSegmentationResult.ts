import path from 'path';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { IdempotencyKey } from '../domain/IdempotencyKey.js';
import { Segmentation } from '../domain/Segmentation.js';
import { SegmentationFailureReason } from '../domain/SegmentationFailureReason.js';
import { OutcomeHandle, SegmentationOutcome } from './contracts/SegmentationOutcome.js';
import { PdfSegmenter } from './contracts/PdfSegmenter.js';
import { SegmentationDataSource } from './contracts/SegmentationDataSource.js';
import { SegmentationXmlStore } from './contracts/SegmentationXmlStore.js';
import { MalformedSegmentationResult } from './errors/MalformedSegmentationResult.js';
import { SegmentationResultGone } from './errors/SegmentationResultGone.js';
import { SegmentationScheduler } from './SegmentationScheduler.js';

type Deps = {
  segmentationDS: SegmentationDataSource;
  pdfSegmenter: PdfSegmenter;
  xmlStore: SegmentationXmlStore;
  scheduler: SegmentationScheduler;
};

/**
 * Takes what the service reported for one request.
 *
 * Only the outcome of the segmentation's current attempt, while it is processing, is taken; a
 * stale or duplicate one is dropped before anything is fetched, since the service hands each
 * result out once and fetching a stale one could consume the current one. An outcome without a
 * key — sent before the service echoed keys — is matched by filename and taken as the current
 * attempt.
 *
 * A result the service no longer holds is requested again; one that cannot be understood fails
 * the segmentation, since asking again would not change it.
 */
class SaveSegmentationResult extends AbstractUseCase<SegmentationOutcome, void, Deps> {
  async execute(outcome: SegmentationOutcome): Promise<void> {
    const segmentation = await this.find(outcome);
    if (!segmentation) {
      return;
    }

    const key = outcome.key ?? IdempotencyKey.of(segmentation.id, segmentation.attempt);
    if (!segmentation.accepts(key)) {
      return;
    }

    if (outcome.succeeded) {
      await this.takeLayout(segmentation, key, outcome.handle);
    } else {
      segmentation.fail(key, outcome.reason);
      await this.save(segmentation);
    }
  }

  static xmlFilenameFor(filename: string) {
    return `${path.basename(filename, path.extname(filename))}.xml`;
  }

  private async find(outcome: SegmentationOutcome) {
    return outcome.key
      ? this.deps.segmentationDS.getById(outcome.key.segmentationId)
      : this.deps.segmentationDS.getByFilename(outcome.filename);
  }

  private async takeLayout(segmentation: Segmentation, key: IdempotencyKey, handle: OutcomeHandle) {
    let result: Awaited<ReturnType<PdfSegmenter['fetchLayout']>>;
    try {
      result = await this.deps.pdfSegmenter.fetchLayout(handle);
    } catch (error) {
      await this.whenNotFetched(segmentation, key, error);
      return;
    }

    const xmlFilename = SaveSegmentationResult.xmlFilenameFor(segmentation.filename);
    await this.deps.xmlStore.store(xmlFilename, result.xml);
    segmentation.complete(key, result.layout, xmlFilename);
    await this.save(segmentation);
  }

  private async whenNotFetched(segmentation: Segmentation, key: IdempotencyKey, error: unknown) {
    if (error instanceof SegmentationResultGone) {
      segmentation.release();
      await this.transactionManager.run(async () => this.deps.scheduler.schedule([segmentation]));
      return;
    }
    if (error instanceof MalformedSegmentationResult) {
      segmentation.fail(key, SegmentationFailureReason.UNEXPECTED);
      await this.save(segmentation);
      return;
    }
    throw error;
  }

  private async save(segmentation: Segmentation) {
    await this.transactionManager.run(async () => this.deps.segmentationDS.save(segmentation));
  }
}

export { SaveSegmentationResult };
