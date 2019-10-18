"use strict";var _fs = _interopRequireDefault(require("fs"));
var _files = require("../files");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('files', () => {
  beforeEach(() => {
    _fs.default.writeFileSync(`${__dirname}/file1`);
    _fs.default.writeFileSync(`${__dirname}/file2`);
  });

  describe('deleteFiles', () => {
    it('should delete all files passed', async () => {
      await (0, _files.deleteFiles)([`${__dirname}/file1`, `${__dirname}/file2`]);
      expect(_fs.default.existsSync(`${__dirname}/file1`)).toBe(false);
      expect(_fs.default.existsSync(`${__dirname}/file2`)).toBe(false);
    });

    it('should not fail when trying to delete a non existent file', async () => {
      await (0, _files.deleteFiles)([`${__dirname}/file0`, `${__dirname}/file1`, `${__dirname}/file2`]);
      expect(_fs.default.existsSync(`${__dirname}/file1`)).toBe(false);
      expect(_fs.default.existsSync(`${__dirname}/file2`)).toBe(false);
    });
  });
});