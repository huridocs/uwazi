import { ActivityDescriber } from '../query/ActivityDescriber.js';
import { RelatedDataLoader } from '../query/RelatedDataLoader.js';

class ActivityDescriberFactory {
  static default(): ActivityDescriber {
    return new ActivityDescriber({ related: RelatedDataLoader });
  }
}

export { ActivityDescriberFactory };
