import path from 'path';
import { mockID } from 'shared/uniqueID';
import paths from '../../config/paths';
import storageConfig from '../storageConfig';

describe('storageConfig', () => {
  let req;
  let file;
  beforeEach(() => {
    req = {
      route: { path: '/api/upload' },
    };
    file = {
      originalname: 'test.pdf',
    };
  });
  describe('destination', () => {
    function testDestination(cb) {
      storageConfig.destination(req, file, cb);
    }
    it('should return custom uploads path if url path contains customisation', done => {
      req.route.path = '/api/customisation/upload';
      testDestination((_e, dest) => {
        expect(path.normalize(dest)).toBe(path.normalize(paths.customUploads));
        done();
      });
    });
    it('should return uploaded documents path if url not a customisation path', done => {
      testDestination((_e, dest) => {
        expect(path.normalize(dest)).toBe(path.normalize(paths.uploadedDocuments));
        done();
      });
    });
  });
  describe('filename', () => {
    it('should generate filename based on unique id and original file extension', done => {
      jest.spyOn(Date, 'now').mockReturnValue(1000);
      mockID('fileid');
      storageConfig.filename(req, file, (_e, filename) => {
        expect(filename).toBe('1000fileid.pdf');
        Date.now.mockRestore();
        done();
      });
    });
  });
});
