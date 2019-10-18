"use strict";
var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _mailer = _interopRequireDefault(require("../../utils/mailer"));
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));
var _contact = _interopRequireDefault(require("../contact"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-nested-callbacks */

describe('contact', () => {
  beforeEach(done => {
    spyOn(_mailer.default, 'send').and.returnValue(Promise.resolve());
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('sendMessage', () => {
    it('should send an email with the mailer to the configured email', done => {
      _contact.default.sendMessage({ email: 'bruce@wayne.com', name: 'Bruce Wayne', message: 'I want to contact you.' }).
      then(() => {
        expect(_mailer.default.send).toHaveBeenCalledWith({
          from: '"Uwazi" <no-reply@uwazi.io',
          subject: 'Contact mesage from Bruce Wayne bruce@wayne.com',
          text: 'I want to contact you.',
          to: 'contact@uwazi.com' });

        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});