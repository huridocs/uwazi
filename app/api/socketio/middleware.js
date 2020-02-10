import cookie from 'cookie';
import socketIo from 'socket.io';

export default (server, app) => {
  const io = socketIo(server);
  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  app.use((req, _res, next) => {
    req.getCurrentSessionSockets = () => {
      const sessionSockets = {
        sockets: [],
        emit(...args) {
          this.sockets.forEach(socket => {
            socket.emit(...args);
          });
        },
      };

      Object.keys(req.io.sockets.connected).reduce((sockets, socketId) => {
        const socket = req.io.sockets.connected[socketId];
        if (typeof socket.request.headers.cookie !== 'string') {
          return sockets;
        }

        const socketCookie = cookie.parse(socket.request.headers.cookie);
        let sessionId;

        if (socketCookie['connect.sid']) {
          [, sessionId] = socketCookie['connect.sid'].split('.')[0].split(':');
        }

        if (sessionId === req.session.id) {
          sockets.sockets.push(socket);
        }

        return sockets;
      }, sessionSockets);

      return sessionSockets;
    };

    next();
  });
};
