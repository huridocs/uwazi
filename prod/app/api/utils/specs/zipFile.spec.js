"use strict";var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _helpers = require("../../csv/specs/helpers");
var _zipFile = _interopRequireDefault(require("../zipFile"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('zipFile', () => {
  beforeAll(async () => {
    await (0, _helpers.createTestingZip)([
    _path.default.join(__dirname, '/zipData/test.csv'),
    _path.default.join(__dirname, '/zipData/1.pdf'),
    _path.default.join(__dirname, '/zipData/2.pdf')],
    'zipTest.zip', __dirname);
  });

  afterAll(() => {
    _fs.default.unlinkSync(_path.default.join(__dirname, '/zipData/zipTest.zip'));
    _fs.default.unlinkSync(_path.default.join(__dirname, '/invalid_zip.zip'));
  });

  describe('findReadStream', () => {
    it('should return a readable stream for matched file', async done => {
      let fileContents;
      (
      await (0, _zipFile.default)(_path.default.join(__dirname, '/zipData/zipTest.zip')).
      findReadStream(entry => entry.fileName === 'test.csv')).

      on('data', chunk => {
        fileContents += chunk;
      }).
      on('end', () => {
        expect(fileContents).toMatchSnapshot();
        done();
      }).
      on('error', e => {
        done.fail(e);
      });
    });

    describe('when not file found', () => {
      it('should return null', async () => {
        const stream = await (0, _zipFile.default)(_path.default.join(__dirname, '/zipData/zipTest.zip')).
        findReadStream(entry => entry.fileName === 'non_existent');

        expect(stream).toBe(null);
      });
    });

    describe('when zip is invalid', () => {
      it('should throw an error', async () => {
        _fs.default.closeSync(_fs.default.openSync(_path.default.join(__dirname, '/invalid_zip.zip'), 'w'));
        try {
          await (0, _zipFile.default)(_path.default.join(__dirname, '/invalid_zip.zip')).
          findReadStream(entry => entry.fileName === 'test.csv');
          fail('should throw an error');
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });
  });
});