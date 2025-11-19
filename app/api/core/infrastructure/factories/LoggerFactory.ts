import { StandardLogger } from 'api/core/libs/logger/infrastructure/StandardLogger';
import { StandardJSONWriter } from 'api/core/libs/logger/infrastructure/writers/StandardJSONWriter';
import { getTenant } from '../mongodb/common/getConnectionForCurrentTenant';

export class LoggerFactory {
  static default(writer = StandardJSONWriter) {
    if (process.env.NODE_ENV === 'test') {
      return this.fake();
    }
    return new StandardLogger(writer, getTenant());
  }

  static fake() {
    // eslint-disable-next-line no-empty-function
    return new StandardLogger(() => {}, getTenant());
  }

  static systemLogger(writer = StandardJSONWriter) {
    return new StandardLogger(writer, {
      name: 'System Logger',
      dbName: 'N/a',
      activityLogs: 'N/a',
      attachments: 'N/a',
      customUploads: 'N/a',
      indexName: 'N/a',
      uploadedDocuments: 'N/a',
    });
  }
}
