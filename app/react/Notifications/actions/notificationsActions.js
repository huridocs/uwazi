import { notify as bridgeNotify } from '#V2/utils/notifyBridge.js';

// Kept as a Redux thunk so all existing call sites (store.dispatch, this.props.notify)
// continue to work without any changes.
export function notify(message, type) {
  return () => {
    bridgeNotify(message, type);
  };
}

// No-op kept for backward compatibility with any imports of removeNotification
export function removeNotification() {
  return () => {};
}
