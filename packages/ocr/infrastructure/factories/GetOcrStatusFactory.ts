import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { GetOcrStatus } from '../../application/GetOcrStatus.js';
import { OcrEngine } from '../../application/contracts/OcrEngine.js';
import { OcrEngineFactory } from './OcrEngineFactory.js';
import { OcrRecordDataSourceFactory } from './OcrRecordDataSourceFactory.js';

type Overrides = {
  ocrEngine?: OcrEngine;
  fileStorage?: Pick<FileStorage, 'fileExists'>;
};

class GetOcrStatusFactory {
  static default(overrides: Overrides = {}): GetOcrStatus {
    return new GetOcrStatus({
      ocrDS: OcrRecordDataSourceFactory.default(),
      filesDS: FilesDataSourceFactory.default(),
      fileStorage: overrides.fileStorage ?? FileStorageFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      ocrEngine: overrides.ocrEngine ?? OcrEngineFactory.default(),
    });
  }
}

export { GetOcrStatusFactory };
