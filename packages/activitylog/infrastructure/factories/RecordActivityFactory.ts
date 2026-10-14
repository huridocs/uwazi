import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { RecordActivity } from '../../application/RecordActivity.js';
import { ActivityLogDataSourceFactory } from './ActivityLogDataSourceFactory.js';

class RecordActivityFactory {
  static default(): RecordActivity {
    return new RecordActivity({
      activityLogDS: ActivityLogDataSourceFactory.default(),
      idGenerator: IdGeneratorFactory.default(),
    });
  }
}

export { RecordActivityFactory };
