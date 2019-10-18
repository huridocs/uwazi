"use strict";var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _importFile = _interopRequireDefault(require("../importFile"));
var _helpers = require("./helpers");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('importFile', () => {
  beforeAll(async () => {
    await (0, _helpers.createTestingZip)([
    _path.default.join(__dirname, '/zipData/import.csv'),
    _path.default.join(__dirname, '/zipData/file1.txt')],
    'ImportFile.zip');

    await (0, _helpers.createTestingZip)([
    _path.default.join(__dirname, '/zipData/file1.txt')],
    'badFile.zip');
  });

  afterAll(() => {
    _fs.default.unlinkSync(_path.default.join(__dirname, '/zipData/ImportFile.zip'));
    _fs.default.unlinkSync(_path.default.join(__dirname, '/zipData/badFile.zip'));
  });

  describe('readStream', () => {
    it('should return a readable stream for the csv file', async done => {
      const file = (0, _importFile.default)(_path.default.join(__dirname, '/test.csv'));
      let fileContents;
      (await file.readStream()).
      on('data', chunk => {
        fileContents += chunk;
      }).
      on('end', () => {
        expect(fileContents).toMatchSnapshot();
        done();
      });
    });

    describe('when file is a a zip', () => {
      it('should return a stream for the first csv file it encounters', async done => {
        const file = (0, _importFile.default)(_path.default.join(__dirname, '/zipData/ImportFile.zip'));
        let fileContents;
        (await file.readStream()).
        on('data', chunk => {
          fileContents += chunk;
        }).
        on('end', () => {
          expect(fileContents).toMatchSnapshot();
          done();
        });
      });

      describe('when passing a filename', () => {
        it('should return a read stream for that file', async done => {
          const file = (0, _importFile.default)(_path.default.join(__dirname, '/zipData/ImportFile.zip'));
          let fileContents;
          (await file.readStream('file1.txt')).
          on('data', chunk => {
            fileContents += chunk;
          }).
          on('end', () => {
            expect(fileContents).toMatchSnapshot();
            done();
          });
        });
      });
    });
  });

  describe('when there is no import.csv on the zip', () => {
    it('should throw an error', async () => {
      const file = (0, _importFile.default)(_path.default.join(__dirname, '/zipData/badFile.zip'));
      let error;
      try {
        await file.readStream();
      } catch (e) {
        error = e;
      }

      expect(error.message.match(/import\.csv/)).not.toBeNull();
    });
  });
});