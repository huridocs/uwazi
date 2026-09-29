import path from 'path';
import { Readable } from 'stream';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { SegmentationXmlStore } from '../../application/contracts/SegmentationXmlStore.js';

type Deps = {
  fileStorage: FileStorage;
  pathManager: PathManager;
};

/** The tenant's `segmentation` uploads folder, on disk or S3, where readers have always found them. */
class FileStorageSegmentationXmlStore implements SegmentationXmlStore {
  constructor(private readonly deps: Deps) {}

  async store(xmlFilename: string, content: Readable): Promise<void> {
    await this.deps.fileStorage.storeContent(
      new FileContents(() => content),
      path.join('segmentation', xmlFilename)
    );
  }

  async remove(xmlFilename: string): Promise<void> {
    await this.deps.fileStorage.removeContent(
      this.deps.pathManager.createPath({ type: 'segmentation', filename: xmlFilename })
    );
  }
}

export { FileStorageSegmentationXmlStore };
