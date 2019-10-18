"use strict";var _fs = _interopRequireDefault(require("fs"));
var _util = require("util");

var _errorLog = _interopRequireDefault(require("../../../../log/errorLog"));
var _jasmineHelpers = require("../../../../utils/jasmineHelpers");
var _paths = _interopRequireDefault(require("../../../../config/paths"));
var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));
var _index = _interopRequireDefault(require("../index.js"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const exists = (0, _util.promisify)(_fs.default.stat);

describe('migration pdf_thumbnails', () => {
  beforeEach(done => {
    spyOn(process.stdout, 'write');
    spyOn(_errorLog.default, 'error');
    _paths.default.uploadedDocuments = __dirname;
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(_index.default.delta).toBe(4);
  });

  describe('JPG creation', () => {
    const thumbnail1 = `${__dirname}/${_fixtures.docId1}.jpg`;
    const thumbnail2 = `${__dirname}/${_fixtures.docId4}.jpg`;

    const deleteThumbnails = done => {
      try {
        _fs.default.unlinkSync(thumbnail1);
        _fs.default.unlinkSync(thumbnail2);
        done();
      } catch (err) {
        done();
      }
    };

    beforeEach(done => {
      deleteThumbnails(done);
    });

    afterEach(done => {
      deleteThumbnails(done);
    });

    it('should create thumbnails of document PDFs', async () => {
      await _index.default.up(_testing_db.default.mongodb);
      await exists(thumbnail1);
      await exists(thumbnail2);
    });
  });
});