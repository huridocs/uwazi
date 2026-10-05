import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Segmentation } from '../domain/Segmentation.js';
import { SegmentationStatus } from '../domain/SegmentationStatus.js';
import { SegmentationDataSource } from './contracts/SegmentationDataSource.js';

type Input = { fileId: string };

type Deps = {
  filesDS: FilesDataSource;
  settingsDS: SettingsDataSource;
  segmentationDS: SegmentationDataSource;
};

/**
 * The finished segmentation of a document. With the feature off, for anything but a document, or
 * without a ready segmentation, the file is reported as not found.
 */
class DownloadFileSegmentation extends AbstractUseCase<Input, Segmentation, Deps> {
  async execute({ fileId }: Input): Promise<Segmentation> {
    if (!(await this.deps.settingsDS.readFeature('segmentation'))) {
      throw new FileNotFound('file not found');
    }

    const file = await this.deps.filesDS.getById(fileId);
    if (file.isError() || file.getData().type !== 'document') {
      throw new FileNotFound('file not found');
    }

    const segmentation = await this.deps.segmentationDS.getByFileId(fileId);
    if (segmentation?.status !== SegmentationStatus.READY || !segmentation.layout) {
      throw new FileNotFound('file not found');
    }
    return segmentation;
  }
}

export { DownloadFileSegmentation };
