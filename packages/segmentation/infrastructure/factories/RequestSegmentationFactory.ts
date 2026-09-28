import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PdfSegmenter } from '../../application/contracts/PdfSegmenter.js';
import { RequestSegmentation } from '../../application/RequestSegmentation.js';
// eslint-disable-next-line import/no-cycle
import { SegmentationJobsAdapter } from '../jobs/SegmentationJobsAdapter.js';
import { PdfSegmenterFactory } from './PdfSegmenterFactory.js';
import { SegmentationDataSourceFactory } from './SegmentationDataSourceFactory.js';

/** The old dispatch loop's `SEGMENTATION_QUEUE_DEPTH`, kept as the backlog ceiling. */
const MAX_BACKLOG = Number(process.env.SEGMENTATION_QUEUE_DEPTH) || 200;
const RETRY_DELAY_MS = Number(process.env.SEGMENTATION_RETRY_DELAY_MS) || 60_000;

type Overrides = {
  pdfSegmenter?: PdfSegmenter;
  now?: () => number;
};

class RequestSegmentationFactory {
  static default(overrides: Overrides = {}): RequestSegmentation {
    return new RequestSegmentation({
      segmentationDS: SegmentationDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      pdfSegmenter: overrides.pdfSegmenter ?? PdfSegmenterFactory.default(),
      fileStorage: FileStorageFactory.default(),
      jobs: new SegmentationJobsAdapter({ jobsDispatcher: ExecutionContext.jobsDispatcher }),
      now: overrides.now ?? Date.now,
      maxBacklog: MAX_BACKLOG,
      retryDelayMs: RETRY_DELAY_MS,
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { RequestSegmentationFactory };
