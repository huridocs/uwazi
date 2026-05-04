import { ObjectId } from 'mongodb';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { FilesDataSource } from './contracts/FilesDataSource.js';
import { FileStorage } from './contracts/FileStorage.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { Segmentation } from '../domain/files/Segmentation.js';

type Deps = {
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  settingsDS: SettingsDataSource;
};

type Input = {
  fileId: string;
};

type Output = {
  fileContents: FileContents;
  filename: string;
};

const ensureReadable = async (fileContents: FileContents) => {
  const iterator = fileContents.read()[Symbol.asyncIterator]();
  await iterator.next();
};

const latestSegmentation = (segmentations: Segmentation[]) =>
  segmentations
    .slice()
    .sort(
      (a, b) =>
        new ObjectId(b.id).getTimestamp().getTime() - new ObjectId(a.id).getTimestamp().getTime()
    )[0];

class DownloadFileSegmentation extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    await this.ensureSegmentationFeatureEnabled();
    const file = await this.getDocumentOrThrow(input.fileId);
    const segmentationFilename = await this.getSegmentationFilenameOrThrow(file.id);
    const fileContents = await this.getSegmentationFileContentsOrThrow(segmentationFilename);
    return { fileContents, filename: segmentationFilename };
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

  private async getSegmentationFilenameOrThrow(fileId: string) {
    const segmentations = await this.deps.filesDS.getSegmentations([fileId]).all();
    const segmentation = segmentations.length ? latestSegmentation(segmentations) : undefined;
    if (!segmentation?.xmlname) {
      throw new FileNotFound('file not found');
    }
    return segmentation.xmlname;
  }

  private async getSegmentationFileContentsOrThrow(filename: string) {
    const fileInput = { type: 'segmentation', filename } as const;
    try {
      const fileContents = this.deps.fileStorage.getFile(fileInput);
      await ensureReadable(fileContents);
      return this.deps.fileStorage.getFile(fileInput);
    } catch {
      throw new FileNotFound('file not found');
    }
  }
}

export { DownloadFileSegmentation };
