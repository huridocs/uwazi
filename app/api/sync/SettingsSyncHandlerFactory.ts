import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { MongoSettingsSyncHandler } from './MongoSettingsSyncHandler.js';

class SettingsSyncHandlerFactory {
  static default(): MongoSettingsSyncHandler {
    return new MongoSettingsSyncHandler(SettingsDataSourceFactory.default());
  }
}

export { SettingsSyncHandlerFactory };
