"use strict";var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _errorLog = _interopRequireDefault(require("../../log/errorLog"));
var _PDF = _interopRequireDefault(require("../PDF.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('PDF', () => {
  let pdf;
  const file = {
    filename: '12345.test.pdf',
    originalname: 'originalName.pdf',
    destination: __dirname };

  const filepath = `${__dirname}/12345.test.pdf`;
  const thumbnailName = `${__dirname}/documentId.jpg`;

  const deleteThumbnail = done => {
    _fs.default.stat(_path.default.resolve(thumbnailName), err => {
      if (err) {return done();}
      _fs.default.unlinkSync(thumbnailName);
      return done();
    });
  };

  beforeEach(() => {
    pdf = new _PDF.default(file);
  });

  describe('convert', () => {
    it('should extract text indexed per page, with apended page in every word for elastic search purposes', async () => {
      const conversion = await pdf.convert();
      const pages = conversion.fullText;

      expect(pages[1]).toMatch('Page[[1]] 1[[1]]');
      expect(pages[2]).toMatch('Page[[2]] 2[[2]]');
      expect(pages[3]).toMatch('Page[[3]] 3[[3]]');
    });

    it('should return the conversion object', async () => {
      const conversion = await pdf.convert();
      expect(conversion).toEqual(expect.objectContaining({
        totalPages: 11,
        processed: true,
        toc: [],
        file: {
          language: 'eng',
          filename: '12345.test.pdf',
          originalname: 'originalName.pdf',
          destination: __dirname } }));


    });

    it('should throw error with proper error message pdf is invalid or malformed', async () => {
      const invalidFile = {
        filename: '1invalid.test.pdf',
        originalname: 'originalName.pdf',
        destination: __dirname };

      pdf = new _PDF.default(invalidFile);
      try {
        await pdf.convert();
        fail('should throw error');
      } catch (e) {
        expect(e.message).toMatch(/may not be a pdf/i);
      }
    });
  });

  describe('createThumbnail', () => {
    beforeEach(done => {
      deleteThumbnail(done);
    });

    afterEach(done => {
      deleteThumbnail(done);
    });

    it('should send a spawn process to create image (implementation test)', async () => {
      const thumbnailResponse = await pdf.createThumbnail('documentId');
      expect(thumbnailResponse.childProcess.spawnfile).toBe('pdftoppm');
      expect(thumbnailResponse.childProcess.spawnargs).toEqual([
      'pdftoppm',
      '-f', '1',
      '-singlefile',
      '-scale-to', '320',
      '-jpeg',
      filepath,
      `${__dirname}/documentId`]);

      expect(_fs.default.existsSync(thumbnailName)).toBe(true);
    });

    it('should correctly log errors, but continue with the flow', async () => {
      spyOn(_errorLog.default, 'error');
      pdf = new _PDF.default({
        filename: '/missingpath/pdf.pdf' });

      const thumbnailResponse = await pdf.createThumbnail('documentId');
      expect(thumbnailResponse instanceof Error).toBe(true);
      expect(_errorLog.default.error).toHaveBeenCalledWith('Thumbnail creation error for: /missingpath/pdf.pdf');
    });
  });

  describe('deleteThumbnail', () => {
    it('should unlink the file from the system', async () => {
      await pdf.createThumbnail('documentId');
      expect(_fs.default.existsSync(thumbnailName)).toBe(true);
      await pdf.deleteThumbnail('documentId');
      expect(_fs.default.existsSync(thumbnailName)).toBe(false);
    });
  });
});