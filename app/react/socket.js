import io from 'socket.io-client';
import { isClient } from 'app/utils';

let socket = { on: (_event, _listener) => {}, off: (_event, _listener) => {} };

if (isClient) {
  //only websockets used, this allows for non sticky sessions on load balancer
  socket = io({ transports: ['websocket'], upgrade: false });
}

const reconnectSocket = () => {
  socket.disconnect();
  socket.connect();
};

export default socket;
export { reconnectSocket };
