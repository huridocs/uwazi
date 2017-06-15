import cookie from 'cookie';

export default (server, app) => {
  let io = require('socket.io')(server);
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.use((req, res, next) => {
    req.io.getCurrentSessionSockets = () => {
      let sessionSockets = {
        sockets: [],
        emit: function (...args) {
          this.sockets.forEach(socket => {
            socket.emit(...args);
          });
        }
      };

      Object.keys(req.io.sockets.connected).reduce((sockets, socketId) => {
        const socket = req.io.sockets.connected[socketId];
        const socketCookie = cookie.parse(socket.request.headers.cookie);
        let sessionId;

        if (socketCookie['connect.sid']) {
          sessionId = socketCookie['connect.sid'].split('.')[0].split(':')[1];
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
