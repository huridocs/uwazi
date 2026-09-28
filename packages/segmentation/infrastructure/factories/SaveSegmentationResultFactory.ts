import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PdfSegmenter } from '../../application/contracts/PdfSegmenter.js';
import { SaveSegmentationResult } from '../../application/SaveSegmentationResult.js';
import { PdfSegmenterFactory } from './PdfSegmenterFactory.js';
import { SegmentationDataSourceFactory } from './SegmentationDataSourceFactory.js';
// eslint-disable-next-line import/no-cycle
import { SegmentationSchedulerFactory } from './SegmentationSchedulerFactory.js';
import { SegmentationXmlStoreFactory } from './SegmentationXmlStoreFactory.js';

type Overrides = { pdfSegmenter?: PdfSegmenter };

class SaveSegmentationResultFactory {
  static default(overrides: Overrides = {}): SaveSegmentationResult {
    return new SaveSegmentationResult({
      segmentationDS: SegmentationDataSourceFactory.default(),
      pdfSegmenter: overrides.pdfSegmenter ?? PdfSegmenterFactory.default(),
      xmlStore: SegmentationXmlStoreFactory.default(),
      scheduler: SegmentationSchedulerFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { SaveSegmentationResultFactory };
