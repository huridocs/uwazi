"use strict";var _middleware = _interopRequireDefault(require("../middleware"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('socketio middleware', () => {
  let executeMiddleware;
  beforeEach(() => {
    const app = {
      use: jasmine.createSpy('use') };

    (0, _middleware.default)({}, app);
    [executeMiddleware] = app.use.calls.mostRecent().args;
  });

  it('should call next', () => {
    const req = {
      io: {} };

    const res = {};
    const next = jasmine.createSpy('next');
    executeMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  describe('getCurrentSessionSockets', () => {
    const createSocket = cookie => ({
      request: { headers: { cookie } },
      emit: jasmine.createSpy('emit') });


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
      const socketWithoutCookie = createSocket();

      req = {
        io: { sockets: { connected: { socket1, socket2, socketWithoutSid, socket3, socketWithoutCookie } } },
        session: { id: 'sessionId' } };


      res = {};
      next = jasmine.createSpy('next');
      executeMiddleware(req, res, next);
    });

    it('should find and return an array of sockets belonging to the current cookie', () => {
      let result = req.getCurrentSessionSockets();
      expect(result.sockets[0]).toBe(socket1);
      expect(result.sockets[1]).toBe(socket3);

      req.session.id = 'sessionId2';
      executeMiddleware(req, res, next);
      result = req.getCurrentSessionSockets();
      expect(result.sockets[0]).toBe(socket2);
    });

    it('should isolate sockets for each requests when multiple requests are issued', () => {
      const req1 = _objectSpread({}, req);
      const req2 = _objectSpread({}, req, { session: { id: 'sessionId2' } });
      executeMiddleware(req1, res, next);
      executeMiddleware(req2, res, next);
      const req1Result = req1.getCurrentSessionSockets();
      const req2Result = req2.getCurrentSessionSockets();
      expect(req1Result.sockets).toEqual([socket1, socket3]);
      expect(req2Result.sockets).toEqual([socket2]);
    });

    it('should include in the result an "emit" function that emits to all the found sockets the sent message', () => {
      const result = req.getCurrentSessionSockets();
      const data = { data: 'data' };

      result.emit('Message', data);

      expect(socket1.emit).toHaveBeenCalledWith('Message', data);
      expect(socket2.emit).not.toHaveBeenCalled();
      expect(socket3.emit).toHaveBeenCalledWith('Message', data);
    });
  });
});