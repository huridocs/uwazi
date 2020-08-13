import { mockID } from 'shared/uniqueID';
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
