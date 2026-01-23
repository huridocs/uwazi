import { StandardLogger } from '#api/core/libs/logger/infrastructure/StandardLogger.js';
import { StandardJSONWriter } from '#api/core/libs/logger/infrastructure/writers/StandardJSONWriter.js';
import { config } from '#api/config.js';
import { DevelopmentWritter } from '#api/core/libs/logger/infrastructure/writers/DevelopmentWriter.js';
import { getTenant } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

export class LoggerFactory {
  static default(_writer = StandardJSONWriter) {
    let writer = _writer;
    if (config.ENVIRONMENT === 'development') {
      writer = DevelopmentWritter;
    }

    if (process.env.NODE_ENV === 'test') {
      return this.fake();
    }

    return new StandardLogger(writer, getTenant());
  }

  static systemLogger(_writer = StandardJSONWriter) {
    let writer = _writer;
    if (config.ENVIRONMENT === 'development') {
      writer = DevelopmentWritter;
    }

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

  static fake() {
    // eslint-disable-next-line no-empty-function
    return new StandardLogger(() => {}, getTenant());
  }
}
