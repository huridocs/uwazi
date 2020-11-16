import io from 'socket.io-client';
import { isClient } from 'app/utils';

let socket = { on: () => {} };
if (isClient) {
  //only websockets used, this allows for non sticky sessions on load balancer
  socket = io({ transports: ['websocket'], upgrade: false });
}

export default socket;

const reconnectSocket = () => {
  socket.disconnect();
  socket.connect();
};

export { reconnectSocket };
