import { SettingsQueryService } from '#api/core/application/settings/SettingsQueryService.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

class SettingsQueryServiceFactory {
  static default(): SettingsQueryService {
    return new SettingsQueryService(SettingsDataSourceFactory.default());
  }
}

export { SettingsQueryServiceFactory };
