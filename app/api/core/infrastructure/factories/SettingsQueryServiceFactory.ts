import { SettingsQueryService } from '#api/core/application/settings/SettingsQueryService.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

class SettingsQueryServiceFactory {
  static default(): SettingsQueryService {
    return new SettingsQueryService(SettingsDataSourceFactory.default(), {
      actor: ExecutionContext.actor,
    });
  }
}

export { SettingsQueryServiceFactory };
