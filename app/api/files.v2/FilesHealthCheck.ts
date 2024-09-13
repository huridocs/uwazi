import { FilesDataSource } from './contracts/FilesDataSource';
import { FileStorage } from './contracts/FileStorage';
import { URLAttachment } from './model/URLAttachment';

function filterFilesInStorage(files: string[]) {
  return files.filter(file => !file.endsWith('activity.log'));
}

export class FilesHealthCheck {
  // eslint-disable-next-line class-methods-use-this
  private onMissingInDBCB: () => void = () => {};

  // eslint-disable-next-line class-methods-use-this
  private onMissingInStorageCB: () => void = () => {};

  private fileStorage: FileStorage;

  private filesDS: FilesDataSource;

  constructor(fileStorage: FileStorage, filesDS: FilesDataSource) {
    this.fileStorage = fileStorage;
    this.filesDS = filesDS;
  }

  async execute() {
    const allFilesInDb = this.filesDS.getAll();
    const allFilesInStorage = await this.fileStorage.list();
    const filteredFilesInStorage = new Set(filterFilesInStorage(allFilesInStorage));
    let missingInStorage = 0;
    const missingInStorageList: string[] = [];
    const missingInDbList: string[] = [];

    await allFilesInDb.forEach(file => {
      const existsInStorage = filteredFilesInStorage.delete(this.fileStorage.getPath(file));

      if (!existsInStorage && !(file instanceof URLAttachment)) {
        missingInStorage += 1;
        missingInStorageList.push(this.fileStorage.getPath(file));
        this.onMissingInStorageCB();
      }
    });

    filteredFilesInStorage.forEach(file => {
      missingInDbList.push(file);
      this.onMissingInDBCB();
    });

    return {
      missingInStorageList,
      missingInStorage,
      missingInDbList,
      missingInDb: filteredFilesInStorage.size,
    };
  }

  onMissingInDB(cb: () => void) {
    this.onMissingInDBCB = cb;
  }

  onMissingInStorage(cb: () => void) {
    this.onMissingInStorageCB = cb;
  }
}
