"use strict";var _path = _interopRequireDefault(require("path"));
var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _asyncFs = _interopRequireDefault(require("../../../../utils/async-fs"));
var _paths = _interopRequireDefault(require("../../../../config/paths"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('migration separate-custom-uploads-from-documents', () => {
  let originalDocumentsPath;
  let originalUploadsPath;

  beforeEach(done => {
    spyOn(process.stdout, 'write');
    originalDocumentsPath = _paths.default.uploadedDocuments;
    originalUploadsPath = _paths.default.customUploads;
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterEach(done => {
    _paths.default.uploadedDocuments = originalDocumentsPath;
    _paths.default.customUploads = originalUploadsPath;
    done();
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(14);
  });

  describe('up', () => {
    let files;
    beforeEach(async () => {
      files = ['file1.txt', 'file2.txt', 'file3.txt'];
      _paths.default.uploadedDocuments = `${__dirname}/uploaded_documents/`;
      _paths.default.customUploads = `${__dirname}/custom_uploads/`;
    });
    afterEach(async () => {
      await Promise.all(
      files.map(async f => {
        try {
          await _asyncFs.default.unlink(_path.default.join(_paths.default.customUploads, f));
          // eslint-disable-next-line
        } catch (e) {}
      }));

    });
    const initFiles = async () =>
    Promise.all(
    files.map(f => _asyncFs.default.writeFile(_path.default.join(_paths.default.uploadedDocuments, f), `contents for file ${f}`)));

    it('should move all uploads from uploaded documents folder to custom uploads folder', async () => {
      await initFiles();
      await _index.default.up(_testing_db.default.mongodb);
      const filesExistInOldPath = await Promise.all(
      files.map(f => _asyncFs.default.exists(_path.default.join(_paths.default.uploadedDocuments, f))));

      const filesExistInNewPath = await Promise.all(
      files.map(f => _asyncFs.default.exists(_path.default.join(_paths.default.customUploads, f))));

      expect(filesExistInOldPath).toEqual([false, false, false]);
      expect(filesExistInNewPath).toEqual([true, true, true]);
    });
    it('should not throw error if file does not exist', async () => {
      await initFiles();
      files.push('unknown.txt');
      await _index.default.up(_testing_db.default.mongodb);
    });
  });
});