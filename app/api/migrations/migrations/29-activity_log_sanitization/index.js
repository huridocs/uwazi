import { BODY_REQUIRED_ENDPOINTS, IGNORED_ENDPOINTS } from 'api/activitylog/activitylogMiddleware';

export default {
  delta: 29,

  name: 'remove_unwanted_activity_log_entries',

  description: 'remove activity log entries that do not contain relevant content',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const deletedEntriesByMethod = await db
      .collection('activitylogs')
      .deleteMany({ method: { $in: ['GET', 'OPTIONS', 'HEAD'] } });
    process.stdout.write(
      `${deletedEntriesByMethod.result.n} activity log entries deleted with unneeded methods`
    );

    const deletedEntriesByEndpoint = await db
      .collection('activitylogs')
      .deleteMany({ url: { $in: IGNORED_ENDPOINTS } });
    process.stdout.write(
      `${deletedEntriesByEndpoint.result.n} activity log entries deleted with unneeded endpoints`
    );

    const deletedUploadEntriesWithoutBody = await db
      .collection('activitylogs')
      .deleteMany({ url: { $in: BODY_REQUIRED_ENDPOINTS }, body: '{}' });
    process.stdout.write(
      `${deletedUploadEntriesWithoutBody.result.n} activity log entries deleted with unneeded endpoints`
    );

    process.stdout.write('\r\n');
  },
};
