import { DeleteLanguagePagesListener } from '../listeners/DeleteLanguagePagesListener.js';

class DeleteLanguagePagesListenerFactory {
  static default(): DeleteLanguagePagesListener {
    return new DeleteLanguagePagesListener({});
  }
}

export { DeleteLanguagePagesListenerFactory };
