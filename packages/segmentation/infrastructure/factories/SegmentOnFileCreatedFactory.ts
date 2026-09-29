import { SegmentOnFileCreated } from '../listeners/SegmentOnFileCreated.js';
import { RegisterFileSegmentationFactory } from './RegisterFileSegmentationFactory.js';

class SegmentOnFileCreatedFactory {
  static default(): SegmentOnFileCreated {
    return new SegmentOnFileCreated({
      registerFileSegmentation: RegisterFileSegmentationFactory.default(),
    });
  }
}

export { SegmentOnFileCreatedFactory };
