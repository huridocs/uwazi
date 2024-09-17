import { FilesDataSource } from './contracts/FilesDataSource';
import { FileStorage } from './contracts/FileStorage';
import { URLAttachment } from './model/URLAttachment';

function filterFilesInStorage(files: string[]) {
  return files.filter(
    file =>
      !file.includes('/log/') && !file.includes('/segmentation/') && !file.includes('index.html')
  );
}

export class FilesHealthCheck {
  // eslint-disable-next-line class-methods-use-this
  private onMissingInDBCB: (filename: string) => void = () => {};

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
    const filteredFilesInStorage = new Set(filterFilesInStorage(allFilesInStorage));
    let missingInStorage = 0;
    const missingInStorageList: string[] = [];
    const missingInDbList: string[] = [];
    const countInStorage = filteredFilesInStorage.size;
    let countInDb = 0;

    allFilesInDb.forEach(file => {
      countInDb += 1;
      const existsInStorage = filteredFilesInStorage.delete(this.fileStorage.getPath(file));

      if (!existsInStorage && !(file instanceof URLAttachment)) {
        missingInStorage += 1;
        missingInStorageList.push(this.fileStorage.getPath(file));
        this.onMissingInStorageCB({ _id: file.id, filename: file.filename });
      }
    });

    filteredFilesInStorage.forEach(file => {
      missingInDbList.push(file);
      this.onMissingInDBCB(file);
    });

    return {
      missingInStorageList,
      missingInStorage,
      missingInDbList,
      missingInDb: filteredFilesInStorage.size,
      countInDb,
      countInStorage,
    };
  }

  onMissingInDB(cb: (filename: string) => void) {
    this.onMissingInDBCB = cb;
  }

  onMissingInStorage(cb: (fileDTO: { _id: string; filename: string }) => void) {
    this.onMissingInStorageCB = cb;
  }
}
