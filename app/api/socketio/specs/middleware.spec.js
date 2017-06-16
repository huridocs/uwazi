import middleware from '../middleware';

describe('socketio middleware', () => {
  let executeMiddleware;
  beforeEach(() => {
    const app = {
      use: jasmine.createSpy('use')
    };
    middleware({}, app);
    executeMiddleware = app.use.calls.mostRecent().args[0];
  });

  it('should call next', () => {
    const req = {
      io: {}
    };
    const res = {};
    const next = jasmine.createSpy('next');
    executeMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  describe('getCurrentSessionSockets', () => {
    const createSocket = (cookie) => {
      return {
        request: {headers: {cookie}},
        emit: jasmine.createSpy('emit')
      };
    };

    let socket1;
    let socket2;
    let socket3;
    let req;
    let res;
    let next;

    beforeEach(() => {
      socket1 = createSocket('connect.sid=s%3AsessionId.moreCookieStuff; io=socketioStuff; locale=en');
      socket2 = createSocket('connect.sid=s%3AsessionId2.moreCookieStuff; io=socketioStuff; locale=en');
      socket3 = createSocket('connect.sid=s%3AsessionId.otherCookieStuff; io=otherSocketioStuff; locale=en');

      const socketWithoutSid = createSocket('io=socketioStuff; locale=en');

      req = {
        io: {sockets: {connected: {socket1, socket2, socketWithoutSid, socket3}}},
        session: {id: 'sessionId'}
      };

      res = {};
      next = jasmine.createSpy('next');
      executeMiddleware(req, res, next);
    });

    it('should find and return an array of sockets belonging to the current cookie', () => {
      let result = req.io.getCurrentSessionSockets();
      expect(result.sockets[0]).toBe(socket1);
      expect(result.sockets[1]).toBe(socket3);

      req.session.id = 'sessionId2';
      executeMiddleware(req, res, next);
      result = req.io.getCurrentSessionSockets();
      expect(result.sockets[0]).toBe(socket2);
    });

    it('should include in the result an "emit" function that emits to all the found sockets the sent message', () => {
      let result = req.io.getCurrentSessionSockets();
      const data = {data: 'data'};

      result.emit('Message', data);

      expect(socket1.emit).toHaveBeenCalledWith('Message', data);
      expect(socket2.emit).not.toHaveBeenCalled();
      expect(socket3.emit).toHaveBeenCalledWith('Message', data);
    });
  });
});
