import cookie from 'cookie';

export default (server, app) => {
  let io = require('socket.io')(server);
  app.use((req, res, next) => {
    req.io = io;
    //next();
  });

  //app.use((req, res, next) => {
    //req.io.getSocket = () => {
      //let found = false;
      //Object.keys(req.io.sockets.connected).forEach((socketId) => {
        //let socket = req.io.sockets.connected[socketId];
        //let sessionId = cookie.parse(socket.handshake.headers.cookie)['connect.sid']
        //.split('.')[0].split(':')[1];

        //if (sessionId === req.session.id) {
          //found = socket;
        //}
      //});

      //return found;
    //};

    ////next();
  //});
};
