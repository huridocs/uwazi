import cookie from 'cookie';

export default (server, app) => {
  let io = require('socket.io')(server);
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.use((req, res, next) => {
    req.io.getCurrentSessionSocket = () => {
      let sessionSocket = null;
      Object.keys(req.io.sockets.connected).forEach((socketId) => {
        const socket = req.io.sockets.connected[socketId];
        const socketCookie = cookie.parse(socket.request.headers.cookie);
        let sessionId;

        if (socketCookie['connect.sid']) {
          sessionId = socketCookie['connect.sid'].split('.')[0].split(':')[1];
        }

        if (sessionId === req.session.id) {
          sessionSocket = socket;
        }
      });

      return sessionSocket;
    };

    next();
  });
};
