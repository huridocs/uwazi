"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _routes = _interopRequireDefault(require("../routes.js"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _contact = _interopRequireDefault(require("../contact"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('entities', () => {
  let routes;

  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: { name: 'Bruce Wayne', email: 'notbatman@wayne.com', text: 'I want to donate!' },
        language: 'lang' };

    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/contact')).toMatchSnapshot();
    });

    it('should send an email', done => {
      spyOn(_contact.default, 'sendMessage').and.returnValue(Promise.resolve());
      routes.post('/api/contact', req).
      then(() => {
        expect(_contact.default.sendMessage).toHaveBeenCalledWith(req.body);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});