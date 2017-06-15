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

  describe('getCurrentSessionSocket', () => {
    const createSocket = (cookie) => {
      return {request: {headers: {cookie}}};
    };
    it('should find and return the socket belonging to the current cookie', () => {
      const socket1 = createSocket('connect.sid=s%3AsessionId.moreCookieStuff; io=socketioStuff; locale=en');
      const socket2 = createSocket('connect.sid=s%3AsessionId2.moreCookieStuff; io=socketioStuff; locale=en');
      const socketWithoutSid = createSocket('io=socketioStuff; locale=en');

      const req = {
        io: {sockets: {connected: {socket1, socket2, socketWithoutSid}}},
        session: {id: 'sessionId'}
      };

      const res = {};
      const next = jasmine.createSpy('next');
      executeMiddleware(req, res, next);

      let socket = req.io.getCurrentSessionSocket();
      expect(socket).toBe(socket1);

      req.session.id = 'sessionId2';
      executeMiddleware(req, res, next);
      socket = req.io.getCurrentSessionSocket();
      expect(socket).toBe(socket2);
    });
  });
});
