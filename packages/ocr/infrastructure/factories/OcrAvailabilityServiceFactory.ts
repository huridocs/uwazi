import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { OcrEngine } from '../../application/contracts/OcrEngine.js';
import { OcrAvailabilityService } from '../../application/OcrAvailabilityService.js';
import { OcrEngineFactory } from './OcrEngineFactory.js';

type Overrides = {
  ocrEngine?: OcrEngine;
  fileStorage?: FileStorage;
};

class OcrAvailabilityServiceFactory {
  static default(overrides: Overrides = {}): OcrAvailabilityService {
    return new OcrAvailabilityService({
      settingsDS: SettingsDataSourceFactory.default(),
      filesDS: FilesDataSourceFactory.default(),
      fileStorage: FileStorageFactory.default(),
      ocrEngine: OcrEngineFactory.default(),
      ...overrides,
    });
  }
}

export { OcrAvailabilityServiceFactory };
export type { Overrides as OcrAvailabilityOverrides };
