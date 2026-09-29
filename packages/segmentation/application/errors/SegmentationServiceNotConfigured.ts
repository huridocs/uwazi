import { DomainError } from '#api/core/domain/error/DomainError.js';

class SegmentationServiceNotConfigured extends DomainError {
  constructor() {
    super(
      'The segmentation feature has no service url configured',
      'segmentation.service_not_configured'
    );
  }
}

export { SegmentationServiceNotConfigured };
