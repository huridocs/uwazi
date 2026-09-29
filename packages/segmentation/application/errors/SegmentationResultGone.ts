import { DomainError } from '#api/core/domain/error/DomainError.js';

/**
 * The service no longer holds the result: it hands each one out once, so a result already fetched,
 * or lost on its side, is gone. Requesting the segmentation again is the way forward.
 */
class SegmentationResultGone extends DomainError {
  static readonly category = 'not_found';

  constructor(cause?: Error) {
    super('The segmentation result is no longer available', 'segmentation.result_gone', cause);
  }
}

export { SegmentationResultGone };
