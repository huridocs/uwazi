import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';

/** The filesystem, across the one boundary the use case specs substitute: which blobs exist. */
class FakeFileStorage implements Pick<FileStorage, 'fileExists'> {
  constructor(private readonly existing: string[]) {}

  async fileExists(file: BaseFile) {
    return this.existing.includes(file.filename);
  }
}

const ALL_PDFS = ['scan.pdf', 'french.pdf', 'noLanguage.pdf', 'attachment.pdf'];

export { FakeFileStorage, ALL_PDFS };
