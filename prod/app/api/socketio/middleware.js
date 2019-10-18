"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _cookie = _interopRequireDefault(require("cookie"));
var _socket = _interopRequireDefault(require("socket.io"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

(server, app) => {
  const io = (0, _socket.default)(server);
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.use((req, res, next) => {
    req.getCurrentSessionSockets = () => {
      const sessionSockets = {
        sockets: [],
        emit(...args) {
          this.sockets.forEach(socket => {
            socket.emit(...args);
          });
        } };


      Object.keys(req.io.sockets.connected).reduce((sockets, socketId) => {
        const socket = req.io.sockets.connected[socketId];
        if (typeof socket.request.headers.cookie !== 'string') {
          return sockets;
        }

        const socketCookie = _cookie.default.parse(socket.request.headers.cookie);
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
};exports.default = _default;