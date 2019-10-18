"use strict";var _path = _interopRequireDefault(require("path"));
var _uniqueID = require("../../../shared/uniqueID");
var _paths = _interopRequireDefault(require("../../config/paths"));
var _storageConfig = _interopRequireDefault(require("../storageConfig"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('storageConfig', () => {
  let req;
  let file;
  beforeEach(() => {
    req = {
      route: { path: '/api/upload' } };

    file = {
      originalname: 'test.pdf' };

  });
  describe('destination', () => {
    function testDestination(cb) {
      _storageConfig.default.destination(req, file, cb);
    }
    it('should return custom uploads path if url path contains customisation', done => {
      req.route.path = '/api/customisation/upload';
      testDestination((e, dest) => {
        expect(_path.default.normalize(dest)).toBe(_path.default.normalize(_paths.default.customUploads));
        done();
      });
    });
    it('should return uploaded documents path if url not a customisation path', done => {
      testDestination((e, dest) => {
        expect(_path.default.normalize(dest)).toBe(_path.default.normalize(_paths.default.uploadedDocuments));
        done();
      });
    });
  });
  describe('filename', () => {
    it('should generate filename based on unique id and original file extension', done => {
      jest.spyOn(Date, 'now').mockReturnValue(1000);
      (0, _uniqueID.mockID)('fileid');
      _storageConfig.default.filename(req, file, (e, filename) => {
        expect(filename).toBe('1000fileid.pdf');
        Date.now.mockRestore();
        done();
      });
    });
  });
});