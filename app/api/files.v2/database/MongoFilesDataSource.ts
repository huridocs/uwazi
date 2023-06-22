import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';
import { FilesDataSource } from '../contracts/FilesDataSource';
import { FileDBOType } from './schemas/filesTypes';

export class MongoFilesDataSource extends MongoDataSource<FileDBOType> implements FilesDataSource {
  protected collectionName = 'files';

  async filesExistForEntities(files: { entity: string; _id: string }[]) {
    const query = {
      $or: files.map(file => ({ _id: new ObjectId(file._id), entity: file.entity })),
    };
    const foundFiles = await this.getCollection().countDocuments(query);
    return foundFiles === files.length;
  }
}
