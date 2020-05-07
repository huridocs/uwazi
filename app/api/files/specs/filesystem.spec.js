import fs from 'fs';
import { deleteFiles } from '../filesystem';

describe('files', () => {
  beforeEach(() => {
    fs.writeFileSync(`${__dirname}/file1`, '');
    fs.writeFileSync(`${__dirname}/file2`, '');
  });

  describe('deleteFiles', () => {
    it('should delete all files passed', async () => {
      await deleteFiles([`${__dirname}/file1`, `${__dirname}/file2`]);
      expect(fs.existsSync(`${__dirname}/file1`)).toBe(false);
      expect(fs.existsSync(`${__dirname}/file2`)).toBe(false);
    });

    it('should not fail when trying to delete a non existent file', async () => {
      await deleteFiles([`${__dirname}/file0`, `${__dirname}/file1`, `${__dirname}/file2`]);
      expect(fs.existsSync(`${__dirname}/file1`)).toBe(false);
      expect(fs.existsSync(`${__dirname}/file2`)).toBe(false);
    });
  });
});
