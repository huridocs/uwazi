import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DownloadFileSegmentation } from '../../application/DownloadFileSegmentation.js';
import { SegmentationDataSourceFactory } from './SegmentationDataSourceFactory.js';

class DownloadFileSegmentationFactory {
  static default(): DownloadFileSegmentation {
    return new DownloadFileSegmentation({
      filesDS: FilesDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      segmentationDS: SegmentationDataSourceFactory.default(),
    });
  }
}

export { DownloadFileSegmentationFactory };
