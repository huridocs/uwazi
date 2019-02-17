import io from 'socket.io-client';
import { isClient } from 'app/utils';
import { store } from 'app/store';
import { notify, removeNotification } from 'app/Notifications/actions/notificationsActions';

let socket = { on: () => {} };
if (isClient) {
  socket = io();
}
let disconnectNotifyId;
socket.on('disconnect', () => {
  if (disconnectNotifyId) {
    store.dispatch(removeNotification(disconnectNotifyId));
  }
  disconnectNotifyId = store.dispatch(notify('Lost connection to the server, your changes may be lost', 'danger', false));
});

socket.on('reconnect', () => {
  if (disconnectNotifyId) {
    store.dispatch(removeNotification(disconnectNotifyId));
  }
  disconnectNotifyId = store.dispatch(notify('Connected to server', 'success'));
});

export default socket;

const reconnectSocket = () => {
  socket.disconnect();
  socket.connect();
};

export {
  reconnectSocket
};
