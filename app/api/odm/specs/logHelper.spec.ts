import { createUpdateLogHelper, NoLogger, UpdateLogHelper } from '../logHelper';

describe('createUpdateLogHelper', () => {
  describe('when collection name is either than activitylog', () => {
    it('should return a UpdateLogHelper instance', () => {
      const logHelper = createUpdateLogHelper('templates');
      expect(logHelper).toBeInstanceOf(UpdateLogHelper);
    });
  });
  describe('when collection name is activitylog', () => {
    it('should return a No Logger instance', () => {
      const logHelper = createUpdateLogHelper('activitylog');
      expect(logHelper).toBeInstanceOf(NoLogger);
    });
  });
});

describe('NoLogger', () => {
  it('should return empty promises for logging methods', async () => {
    const logHelper = createUpdateLogHelper('activitylog');
    // @ts-ignore
    await expect(logHelper.upsertLogMany({ _id: null })).resolves.toBeEmpty;
    // @ts-ignore
    await expect(logHelper.upsertLogOne(undefined)).resolves.toBeEmpty;
  });
});
