import date from '#api/utils/date.js';

/** Pinned here, as the activity log had them: a migration does not import production code. */
const IGNORED_ENDPOINTS = [
  '/api/login',
  '/api/contact',
  '/api/unlockaccount',
  '/api/resetpassword',
  '/api/recoverpassword',
  '/api/documents/pdfInfo',
  '/api/documents/download',
  '/api/attachments/download',
  '/api/semantic-search/notify-updates',
  '/api/sync',
  '/api/sync/upload',
  '/api/export',
];

const BODY_REQUIRED_ENDPOINTS = [
  '/api/files/upload/document',
  '/api/files/upload/custom',
  '/api/attachments/upload',
  '/api/public',
  '/api/entities',
  '/api/users',
];

export default {
  delta: 29,

  name: 'activity_log_sanitization',

  description: 'remove activity log entries that do not contain relevant content',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const deletedEntriesByMethod = await db
      .collection('activitylogs')
      .deleteMany({ method: { $in: ['GET', 'OPTIONS', 'HEAD'] } });
    process.stdout.write(
      `${deletedEntriesByMethod.deletedCount} activity log entries deleted with unneeded methods\r\n`
    );

    const deletedEntriesByEndpoint = await db
      .collection('activitylogs')
      .deleteMany({ url: { $in: IGNORED_ENDPOINTS } });
    process.stdout.write(
      `${deletedEntriesByEndpoint.deletedCount} activity log entries deleted with unneeded endpoints\r\n`
    );

    const deletedUploadEntriesWithoutBody = await db
      .collection('activitylogs')
      .deleteMany({ url: { $in: BODY_REQUIRED_ENDPOINTS }, body: '{}' });
    process.stdout.write(
      `${deletedUploadEntriesWithoutBody.deletedCount} activity log POST entries deleted with empty bodies\r\n`
    );

    const deletedUpdateLogsForActivityLog = await db
      .collection('updatelogs')
      .deleteMany({ namespace: 'activitylog' });
    process.stdout.write(
      `${deletedUpdateLogsForActivityLog.deletedCount} updatelogs deleted for activitylog namespace\r\n`
    );

    await db.collection('activitylogs').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    process.stdout.write('TTL index added over expireAt\r\n');

    const nextYear = date.addYearsToCurrentDate(1);
    const updatedEntries = await db
      .collection('activitylogs')
      .updateMany({}, { $set: { expireAt: nextYear } });

    process.stdout.write(
      `${updatedEntries.deletedCount} activity log entries updated with expiration date\r\n`
    );

    process.stdout.write('\r\n');
  },
};
