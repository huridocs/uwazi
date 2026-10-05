import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The segmentation service could not be reached, or failed on its side. Worth retrying. */
class SegmentationServiceUnavailable extends DomainError {
  constructor(cause?: Error) {
    super('The segmentation service is unavailable', 'segmentation.service_unavailable', cause);
  }
}

export { SegmentationServiceUnavailable };
