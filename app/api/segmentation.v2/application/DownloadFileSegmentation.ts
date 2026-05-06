import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { Segmentation } from '#api/core/domain/files/Segmentation.js';

type Deps = {
  filesDS: FilesDataSource;
  settingsDS: SettingsDataSource;
};

type Input = {
  fileId: string;
};

type Output = Segmentation;

class DownloadFileSegmentation extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    await this.ensureSegmentationFeatureEnabled();
    const file = await this.getDocumentOrThrow(input.fileId);
    return this.getSegmentationOrThrow(file.id);
  }

  private async ensureSegmentationFeatureEnabled() {
    const settings = await this.deps.settingsDS.get();
    if (!settings.features?.segmentation) {
      throw new FileNotFound('file not found');
    }
  }

  private async getDocumentOrThrow(fileId: string) {
    const fileResult = await this.deps.filesDS.getById(fileId);
    if (fileResult.isError()) {
      throw new FileNotFound('file not found');
    }
    const file = fileResult.getData();
    if (file.type !== 'document') {
      throw new FileNotFound('file not found');
    }
    return file;
  }

  private async getSegmentationOrThrow(fileId: string) {
    const segmentations = await this.deps.filesDS.getSegmentations([fileId]).all();
    const segmentation = segmentations[0];
    if (!segmentation) {
      throw new FileNotFound('file not found');
    }
    return segmentation;
  }
}

export { DownloadFileSegmentation };
