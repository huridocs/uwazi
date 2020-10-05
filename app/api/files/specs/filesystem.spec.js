import fs from 'fs';
import { activityLogPath } from 'api/files';
import { testingTenants } from 'api/utils/testingTenants';
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
  describe('activityLogPath', () => {
    it('should return the activity file name of the tenant in the log folder', async () => {
      testingTenants.mockCurrentTenant({ name: 'default' });
      const logPath = await activityLogPath();
      expect(logPath).toBe('log/default_activity.log');
    });
  });
});
