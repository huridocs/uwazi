import { FilesDataSource } from './contracts/FilesDataSource';
import { FileStorage } from './contracts/FileStorage';
import { StoredFile } from './model/StoredFile';
import { URLAttachment } from './model/URLAttachment';
function filterFilesInStorage(files: StoredFile[]) {
  return files.filter(
    file =>
      !file.fullPath.includes('/log/') &&
      !file.fullPath.includes('/segmentation/') &&
      !file.fullPath.includes('index.html')
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
    const { dbFiles, storageFiles, filesChecksumMatchCounts, storageFilesIndexedByPath } =
      await this.getFilesData();
    const countInStorage = storageFiles.length;
    const missingInStorageList: string[] = [];
    const missingInDbList: string[] = [];

    const counters = {
      missingInStorage: 0,
      missingInDbWithChecksumMatches: 0,
      countInDb: 0,
    };

    dbFiles.forEach(file => {
      counters.countInDb += 1;

      const existsInStorage = storageFilesIndexedByPath[this.fileStorage.getPath(file)];

      if (existsInStorage) {
        delete storageFilesIndexedByPath[this.fileStorage.getPath(file)];
      }

      if (!existsInStorage && !(file instanceof URLAttachment)) {
        counters.missingInStorage += 1;
        missingInStorageList.push(this.fileStorage.getPath(file));
        this.onMissingInStorageCB({ _id: file.id, filename: file.filename });
      }
    });

    const storageFilesRemaining = Object.values(storageFilesIndexedByPath);

    storageFilesRemaining.forEach(storedFile => {
      missingInDbList.push(storedFile.fullPath);
      const checksumMatchCount = filesChecksumMatchCounts[storedFile.checksum || ''];
      if (checksumMatchCount > 1) {
        counters.missingInDbWithChecksumMatches += 1;
      }
      this.onMissingInDBCB({ filename: storedFile.fullPath, checksumMatchCount });
    });

    return {
      missingInStorageList,
      missingInDbList,
      missingInDb: storageFilesRemaining.length,
      countInStorage,
      ...counters,
    };
  }

  async getFilesData() {
    const allFilesInStorage = await this.fileStorage.list();
    const storageFiles = filterFilesInStorage(allFilesInStorage);
    const filesChecksumMatchCounts = storageFiles.reduce(
      (counts, storedFile) => {
        const checksum = storedFile.checksum || '';
        if (!counts[checksum]) {
          // eslint-disable-next-line no-param-reassign
          counts[checksum] = 0;
        }
        // eslint-disable-next-line no-param-reassign
        counts[checksum] += 1;
        return counts;
      },
      {} as { [k: string]: number }
    );
    const dbFiles = await this.filesDS.getAll().all();
    const storageFilesIndexedByPath = storageFiles.reduce(
      (memo, file) => {
        // eslint-disable-next-line no-param-reassign
        memo[file.fullPath] = file;
        return memo;
      },
      {} as { [k: string]: StoredFile }
    );
    return {
      storageFilesIndexedByPath,
      storageFiles,
      filesChecksumMatchCounts,
      dbFiles,
    };
  }

  onMissingInDB(cb: (file: missingInDBFileDTO) => void) {
    this.onMissingInDBCB = cb;
  }

  onMissingInStorage(cb: (fileDTO: { _id: string; filename: string }) => void) {
    this.onMissingInStorageCB = cb;
  }
}
