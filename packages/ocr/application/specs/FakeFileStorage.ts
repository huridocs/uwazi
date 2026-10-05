import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';

/**
 * The tenant's file storage, across the one boundary the use case specs substitute: which blobs
 * exist. Build it inside the test's context.
 */
class FakeFileStorage {
  static holding(existing: string[]): FileStorage {
    const storage = FileStorageFactory.default();
    jest
      .spyOn(storage, 'fileExists')
      .mockImplementation(async file => existing.includes(file.filename));
    return storage;
  }
}

const ALL_PDFS = ['scan.pdf', 'french.pdf', 'noLanguage.pdf', 'attachment.pdf'];

export { FakeFileStorage, ALL_PDFS };
