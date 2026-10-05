import { BroadcastSettingsChanged } from '../listeners/BroadcastSettingsChanged.js';
import { V1WebSocketsWrapper } from '../services/V1WebSocketsWrapper.js';
import { SettingsQueryServiceFactory } from './SettingsQueryServiceFactory.js';

class BroadcastSettingsChangedFactory {
  static default(): BroadcastSettingsChanged {
    return new BroadcastSettingsChanged({
      settingsQuery: SettingsQueryServiceFactory.default(),
      sockets: new V1WebSocketsWrapper(),
    });
  }
}

export { BroadcastSettingsChangedFactory };
