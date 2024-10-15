import { testingTenants } from 'api/utils/testingTenants';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import { mockID } from 'shared/uniqueID';
import { deleteFiles, fileExistsOnPath, activityLogPath, generateFileName } from '../filesystem';

const mockDate = 1634567890123;

describe('files', () => {
  beforeEach(async () => {
    await fs.writeFile(`${__dirname}/file1`, '');
    await fs.writeFile(`${__dirname}/file2`, '');
    await deleteFiles([`${__dirname}/customFile`]);
    mockID();
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate);
  });

  afterEach(async () => {
    await deleteFiles([`${__dirname}/customFile`]);
    jest.restoreAllMocks();
  });

  describe('deleteFiles', () => {
    it('should delete all files passed', async () => {
      await deleteFiles([`${__dirname}/file1`, `${__dirname}/file2`]);
      expect(await fileExistsOnPath(`${__dirname}/file1`)).toBe(false);
      expect(await fileExistsOnPath(`${__dirname}/file2`)).toBe(false);
    });

    it('should not fail when trying to delete a non existent file', async () => {
      await deleteFiles([`${__dirname}/file0`, `${__dirname}/file1`, `${__dirname}/file2`]);
      expect(await fileExistsOnPath(`${__dirname}/file1`)).toBe(false);
      expect(await fileExistsOnPath(`${__dirname}/file2`)).toBe(false);
    });
  });

  describe('activityLogPath', () => {
    it('should return the activity file name of the tenant in the log folder', () => {
      testingTenants.mockCurrentTenant({ name: 'default', activityLogs: 'log/' });
      const logPath = activityLogPath('default_activity.log');
      expect(logPath).toBe('log/default_activity.log');
    });
  });

  describe('generateFileName', () => {
    it('should return the correct filename if provided the correct mimetype and originalname', () => {
      const mimetype = 'application/pdf';
      const originalname = 'any_file.pdf';

      const result = generateFileName({ mimetype, originalname });

      expect(result).toBe(`${mockDate}unique_id.pdf`);
    });

    it('should originalname the one to take precendence over mimetype', () => {
      const mimetype = 'application/jpeg';
      const originalname = 'any_file.jpg';

      const result = generateFileName({ mimetype, originalname });

      expect(result).toBe(`${mockDate}unique_id.jpg`);
    });

    it('should return the correct filename if provided the CORRECT mimetype and WRONG oringalname', () => {
      const mimetype = 'application/pdf';
      expect(generateFileName({ mimetype })).toBe(`${mockDate}unique_id.pdf`);

      expect(generateFileName({ mimetype, originalname: 'any_name.com.br.' })).toBe(
        `${mockDate}unique_id.pdf`
      );
    });

    it('should return the correct filename if provided the CORRECT filename and WRONG mimetype ', () => {
      const originalname = 'any_name.pdf';

      expect(generateFileName({ originalname })).toBe(`${mockDate}unique_id.pdf`);
      expect(generateFileName({ originalname, mimetype: 'any_mimetype_wrong' })).toBe(
        `${mockDate}unique_id.pdf`
      );
    });

    it('should return the correct filename if provided WRONG mimetype and originalname', () => {
      const mimetype = 'any_extension';
      const originalname = 'any_name any_name.com.br';

      const result = generateFileName({ mimetype, originalname });

      expect(result).toBe(`${mockDate}unique_id`);
    });

    it('should NOT contain underscore on filename', () => {
      jest.restoreAllMocks();
      const mimetype = 'application/pdf';
      const originalname = 'any_file.pdf';

      const result = generateFileName({ mimetype, originalname });

      expect(/_/.test(result)).toBe(false);
    });
  });
});
