"use strict";var _express = _interopRequireDefault(require("express"));
var _bodyParser = _interopRequireDefault(require("body-parser"));
var _supertest = _interopRequireDefault(require("supertest"));

var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));

var _users = _interopRequireDefault(require("../../users/users"));
var _svgCaptcha = _interopRequireDefault(require("svg-captcha"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _stream = require("stream");
var _routes = _interopRequireDefault(require("../routes"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _encryptPassword = require("../encryptPassword");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Auth Routes', () => {
  let routes;
  let app;

  beforeEach(async () => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('/login', () => {
    beforeEach(() => {
      app = (0, _express.default)();
      app.use(_bodyParser.default.json());
      (0, _routes.default)(app);
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/login')).toMatchSnapshot();
    });

    it('should login succesfully with sha256', async () => {
      await (0, _supertest.default)(app).
      post('/api/login').
      send({ username: 'oldUser', password: 'oldPassword' }).
      expect(200);
    });

    it('should fail properly with sha256', async () => {
      await (0, _supertest.default)(app).
      post('/api/login').
      send({ username: 'oldUser', password: 'badPassword' }).
      expect(401);
    });

    it('should login succesfully with bcrypt', async () => {
      await (0, _supertest.default)(app).
      post('/api/login').
      send({ username: 'newUser', password: 'newPassword' }).
      expect(200);
    });

    it('should fail properly with bcrypt', async () => {
      await (0, _supertest.default)(app).
      post('/api/login').
      send({ username: 'newUser', password: 'badPassword' }).
      expect(401);
    });

    describe('when loging in with old encryption', () => {
      it('should reencrypt the password using bcrypt', async () => {
        await (0, _supertest.default)(app).
        post('/api/login').
        send({ username: 'oldUser', password: 'oldPassword' }).
        expect(200);

        const [oldUser] = await _users.default.get({ username: 'oldUser' }, '+password');
        const passwordHasBeenChanged = await (0, _encryptPassword.comparePasswords)('oldPassword', oldUser.password);
        expect(passwordHasBeenChanged).toBe(true);
      });
    });
  });

  describe('/captcha', () => {
    it('should return the captcha and store its value in session', async () => {
      spyOn(_svgCaptcha.default, 'createMathExpr').and.returnValue({ data: 'captchaImage', text: 42 });
      const req = { session: {} };
      const response = await routes.get('/captcha', req);
      expect(req.session.captcha).toBe(42);
      expect(response).toBe('send:captchaImage');
    });
  });

  describe('/remotecaptcha', () => {
    beforeEach(() => {
      const stream = new _stream.Readable();
      stream.push('captchaImage');
      stream.push(null);
      _fetchMock.default.restore();
      _fetchMock.default.
      get('http://secret.place.io/captcha', { body: stream, headers: { 'set-cookie': ['connect.ssid: 12n32ndi23j4hsj;'] } }, { sendAsJson: false });
    });

    it('should return the captcha and store its value in session', async () => {
      const req = { session: {} };
      const response = await routes.get('/remotecaptcha', req);
      expect(req.session.remotecookie).toBe('connect.ssid: 12n32ndi23j4hsj;');
      expect(response).toBe('captchaImage');
    });
  });
});