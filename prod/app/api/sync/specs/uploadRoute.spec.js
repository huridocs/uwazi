"use strict";require("../../utils/jasmineHelpers");

var _express = _interopRequireDefault(require("express"));


var _supertest = _interopRequireDefault(require("supertest"));
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));

var _routes = _interopRequireDefault(require("../routes.js"));
var _paths = _interopRequireDefault(require("../../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

jest.mock("../../auth/authMiddleware.js", () => () => (_req, _res, next) => {
  next();
});

describe('sync', () => {
  describe('sync/upload', () => {
    it('should place document without changing name on /uploads', async () => {
      _paths.default.uploadedDocuments = `${__dirname}/uploads/`;
      try {
        _fs.default.unlinkSync(_path.default.join(_paths.default.uploadedDocuments, 'test.txt'));
      } catch (e) {
        //
      }
      const app = (0, _express.default)();
      (0, _routes.default)(app);

      const response = await (0, _supertest.default)(app).
      post('/api/sync/upload').
      set('X-Requested-With', 'XMLHttpRequest').
      attach('file', _path.default.join(__dirname, 'test.txt'));

      const properlyUploaded = _fs.default.existsSync(_path.default.join(_paths.default.uploadedDocuments, 'test.txt'));
      expect(response.status).toBe(200);
      expect(properlyUploaded).toBeTruthy();
    });
  });
});