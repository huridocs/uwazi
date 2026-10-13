import { ActivityDescriber } from '../../application/ActivityDescriber.js';
import { RelatedDataLoader } from '../RelatedDataLoader.js';

class ActivityDescriberFactory {
  static default(): ActivityDescriber {
    return new ActivityDescriber({ related: RelatedDataLoader });
  }
}

export { ActivityDescriberFactory };
