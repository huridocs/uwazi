"use strict";
var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));

var _uploads = _interopRequireDefault(require("../uploads"));
var _uploadsModel = _interopRequireDefault(require("../uploadsModel"));
var _paths = _interopRequireDefault(require("../../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-nested-callbacks */

describe('uploads', () => {
  let file;
  const uploadId = _testing_db.default.id();

  beforeEach(done => {
    file = {
      fieldname: 'file',
      originalname: 'gadgets-01.pdf',
      encoding: '7bit',
      mimetype: 'application/octet-stream',
      destination: `${__dirname}/uploads/`,
      filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
      path: `${__dirname}/uploads/f2082bf51b6ef839690485d7153e847a.pdf`,
      size: 171411271 };


    _testing_db.default.clearAllAndLoad({ uploads: [{ _id: uploadId, filename: 'upload.filename' }] }).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('save', () => {
    it('should save file passed', async () => {
      let saved = await _uploads.default.save(file);
      saved = await _uploadsModel.default.getById(saved._id);

      expect(saved.creationDate).toBeDefined();

      expect(saved).toMatchObject({
        originalname: 'gadgets-01.pdf',
        mimetype: 'application/octet-stream',
        filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
        size: 171411271 });

    });
  });

  describe('delete', () => {
    it('should delete the file', async () => {
      _fs.default.writeFileSync(_path.default.join(_paths.default.customUploads, 'upload.filename'));

      expect(_fs.default.existsSync(_path.default.join(_paths.default.customUploads, 'upload.filename'))).toBe(true);

      await _uploads.default.delete(uploadId);

      expect(_fs.default.existsSync(_path.default.join(_paths.default.customUploads, 'upload.filename'))).toBe(false);
    });
  });
});