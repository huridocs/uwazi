import { StandardLogger } from 'api/core/libs/logger/infrastructure/StandardLogger';
import { StandardJSONWriter } from 'api/core/libs/logger/infrastructure/writers/StandardJSONWriter';
import { getTenant } from '../mongodb/common/getConnectionForCurrentTenant';

export class LoggerFactory {
  static default(writer = StandardJSONWriter) {
    return new StandardLogger(writer, getTenant());
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
