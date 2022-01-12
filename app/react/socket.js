import io from 'socket.io-client';
import { isClient } from 'app/utils';

let _socket = { on: (_event, _listener) => {}, off: (_event, _listener) => {} };

if (isClient) {
  //only websockets used, this allows for non sticky sessions on load balancer
  _socket = io({ transports: ['websocket'], upgrade: false });
}

const reconnectSocket = () => {
  _socket.disconnect();
  _socket.connect();
};

export const socket = _socket;
export { reconnectSocket };
