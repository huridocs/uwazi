import { FilesDataSource } from './contracts/FilesDataSource';
import { FileStorage } from './contracts/FileStorage';
import { StoredFile } from './model/StoredFile';
import { URLAttachment } from './model/URLAttachment';

function filterFilesInStorage(files: StoredFile[]) {
  return files.filter(
    file =>
      !file.filename.includes('/log/') &&
      !file.filename.includes('/segmentation/') &&
      !file.filename.includes('index.html')
  );
}

type missingInDBFileDTO = {
  filename: string;
  checksumMatchCount: number;
};

export class FilesHealthCheck {
  // eslint-disable-next-line class-methods-use-this
  private onMissingInDBCB: (file: missingInDBFileDTO) => void = () => {};

  // eslint-disable-next-line class-methods-use-this
  private onMissingInStorageCB: (fileDTO: { _id: string; filename: string }) => void = () => {};

  private fileStorage: FileStorage;

  private filesDS: FilesDataSource;

  constructor(fileStorage: FileStorage, filesDS: FilesDataSource) {
    this.fileStorage = fileStorage;
    this.filesDS = filesDS;
  }

  async execute() {
    const allFilesInDb = await this.filesDS.getAll().all();
    const allFilesInStorage = await this.fileStorage.list();
    const filteredFilesInStorage = filterFilesInStorage(allFilesInStorage);
    let missingInStorage = 0;
    const missingInStorageList: string[] = [];
    const missingInDbList: string[] = [];
    const countInStorage = filteredFilesInStorage.length;
    let countInDb = 0;

    const checksumMatchCounts = allFilesInStorage.reduce((counts, storedFile) => {
      if (!counts[storedFile.checksum]) {
        counts[storedFile.checksum] = 0;
      }
      counts[storedFile.checksum] += 1;
      return counts;
    }, {});

    allFilesInDb.forEach(file => {
      countInDb += 1;
      const existsInStorage = filteredFilesInStorage.findIndex(
        storedFile => storedFile.filename === this.fileStorage.getPath(file)
      );
      if (existsInStorage > -1) {
        filteredFilesInStorage.splice(existsInStorage, 1);
      }

      if (existsInStorage === -1 && !(file instanceof URLAttachment)) {
        missingInStorage += 1;
        missingInStorageList.push(this.fileStorage.getPath(file));
        this.onMissingInStorageCB({ _id: file.id, filename: file.filename });
      }
    });

    let missingInDbWithChecksumMatches = 0;

    filteredFilesInStorage.forEach(storedFile => {
      missingInDbList.push(storedFile.filename);
      const checksumMatchCount = checksumMatchCounts[storedFile.checksum];
      if (checksumMatchCount > 1) {
        missingInDbWithChecksumMatches += 1;
      }
      this.onMissingInDBCB({ filename: storedFile.filename, checksumMatchCount });
    });

    return {
      missingInStorageList,
      missingInStorage,
      missingInDbList,
      missingInDb: filteredFilesInStorage.length,
      missingInDbWithChecksumMatches,
      countInDb,
      countInStorage,
    };
  }

  onMissingInDB(cb: (file: missingInDBFileDTO) => void) {
    this.onMissingInDBCB = cb;
  }

  onMissingInStorage(cb: (fileDTO: { _id: string; filename: string }) => void) {
    this.onMissingInStorageCB = cb;
  }
}
