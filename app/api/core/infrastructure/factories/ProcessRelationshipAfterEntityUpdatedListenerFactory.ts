import { ProcessRelationshipAfterEntityUpdatedListener } from '../listeners/ProcessRelationshipAfterEntityUpdatedListener.js';

class ProcessRelationshipAfterEntityUpdatedListenerFactory {
  static default(): ProcessRelationshipAfterEntityUpdatedListener {
    return new ProcessRelationshipAfterEntityUpdatedListener({});
  }
}

export { ProcessRelationshipAfterEntityUpdatedListenerFactory };
