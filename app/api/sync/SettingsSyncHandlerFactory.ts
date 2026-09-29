import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { SettingsSyncHandler } from './SettingsSyncHandler.js';

class SettingsSyncHandlerFactory {
  static default(): SettingsSyncHandler {
    return new SettingsSyncHandler(SettingsDataSourceFactory.default());
  }
}

export { SettingsSyncHandlerFactory };
