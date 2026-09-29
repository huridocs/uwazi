import { DomainError } from '#api/core/domain/error/DomainError.js';
import { SegmentationStatus } from '../SegmentationStatus.js';

class InvalidSegmentationTransition extends DomainError {
  static readonly category = 'conflict';

  constructor(segmentationId: string, from: SegmentationStatus, action: string) {
    super(
      `Segmentation "${segmentationId}" cannot ${action} while ${from}`,
      'segmentation.invalid_transition'
    );
  }
}

export { InvalidSegmentationTransition };
