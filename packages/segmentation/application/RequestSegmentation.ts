import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Segmentation } from '../domain/Segmentation.js';
import { SegmentationStatus } from '../domain/SegmentationStatus.js';
import { PdfSegmenter } from './contracts/PdfSegmenter.js';
import { SegmentationDataSource } from './contracts/SegmentationDataSource.js';
import { SegmentationJobs } from './contracts/SegmentationJobs.js';
import { SegmentationServiceNotConfigured } from './errors/SegmentationServiceNotConfigured.js';
import { SegmentationServiceUnavailable } from './errors/SegmentationServiceUnavailable.js';

type Input = { segmentationId: string };

type Deps = {
  segmentationDS: SegmentationDataSource;
  settingsDS: SettingsDataSource;
  pdfSegmenter: PdfSegmenter;
  fileStorage: FileStorage;
  jobs: SegmentationJobs;
  now: () => number;
  /** Requests waiting in the service beyond which new ones hold back. */
  maxBacklog: number;
  /** How long a held-back request waits before it is tried again. */
  retryDelayMs: number;
};

/**
 * Sends one queued segmentation to the segmentation service, as a new attempt.
 *
 * The PDF is sent first and the segmentation marked processing after, so a crash in between
 * leaves it queued and sent twice at worst — which the attempt key makes harmless. When the
 * service cannot take it now — its backlog is full, or it is down — the request is put back on
 * the queue for later rather than failed, so waiting out an outage never exhausts the job's
 * retries and strands the segmentation.
 */
class RequestSegmentation extends AbstractUseCase<Input, void, Deps> {
  async execute({ segmentationId }: Input): Promise<void> {
    const segmentation = await this.deps.segmentationDS.getById(segmentationId);
    if (segmentation?.status !== SegmentationStatus.QUEUED) {
      return;
    }

    if (!(await this.deps.settingsDS.readFeature('segmentation'))) {
      await this.release(segmentation);
      return;
    }

    if ((await this.deps.pdfSegmenter.backlogSize()) >= this.deps.maxBacklog) {
      await this.requestLater(segmentation);
      return;
    }

    await this.send(segmentation);
  }

  private async send(segmentation: Segmentation) {
    const content = await this.readPdf(segmentation.filename);
    const key = segmentation.request(this.deps.now());

    try {
      await this.deps.pdfSegmenter.submit({ key, filename: segmentation.filename, content });
    } catch (error) {
      await this.whenNotSent(segmentation, error);
      return;
    }

    await this.transactionManager.run(async () => this.deps.segmentationDS.save(segmentation));
  }

  /** A service that cannot take it now gets it later; one with no url gets nothing until it has. */
  private async whenNotSent(segmentation: Segmentation, error: unknown) {
    if (error instanceof SegmentationServiceUnavailable) {
      await this.requestLater(segmentation);
      return;
    }
    if (error instanceof SegmentationServiceNotConfigured) {
      await this.release(segmentation);
      return;
    }
    throw error;
  }

  private async release(segmentation: Segmentation) {
    segmentation.release();
    await this.transactionManager.run(async () => this.deps.segmentationDS.save(segmentation));
  }

  private async requestLater(segmentation: Segmentation) {
    await this.transactionManager.run(async () =>
      this.deps.jobs.requestSegmentation([segmentation.id], { delayMs: this.deps.retryDelayMs })
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

export { RequestSegmentation };
export type { Input as RequestSegmentationInput };
