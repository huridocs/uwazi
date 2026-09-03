import { LegacyTemplatesPageUsageDataSource } from '../../v1_layer/LegacyTemplatesPageUsageDataSource.js';

export class TemplatesPageUsageDataSourceFactory {
  static default() {
    return new LegacyTemplatesPageUsageDataSource();
  }
}
