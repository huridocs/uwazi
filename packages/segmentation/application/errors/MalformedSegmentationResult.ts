import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The segmentation service sent something that cannot be understood. Retrying will not help. */
class MalformedSegmentationResult extends DomainError {
  static readonly category = 'validation';

  constructor(reason: string, cause?: Error) {
    super(`Malformed segmentation result: ${reason}`, 'segmentation.malformed_result', cause);
  }
}

export { MalformedSegmentationResult };
