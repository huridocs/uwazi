import { AddLanguagePagesListener } from '../listeners/AddLanguagePagesListener.js';

class AddLanguagePagesListenerFactory {
  static default(): AddLanguagePagesListener {
    return new AddLanguagePagesListener({});
  }
}

export { AddLanguagePagesListenerFactory };
