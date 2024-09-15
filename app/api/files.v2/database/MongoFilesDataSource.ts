import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { ObjectId } from 'mongodb';
import { FilesDataSource } from '../contracts/FilesDataSource';
import { FileMappers } from './FilesMappers';
import { FileDBOType } from './schemas/filesTypes';
import { UwaziFile } from '../model/UwaziFile';

export class MongoFilesDataSource extends MongoDataSource<FileDBOType> implements FilesDataSource {
  getAll() {
    return new MongoResultSet<FileDBOType, UwaziFile>(
      this.getCollection().find({}, { projection: { fullText: 0 } }),
      FileMappers.toModel
    );
  }

  protected collectionName = 'files';

  async filesExistForEntities(files: { entity: string; _id: string }[]) {
    const query = {
      $or: files.map(file => ({ _id: new ObjectId(file._id), entity: file.entity })),
    };
    const foundFiles = await this.getCollection().countDocuments(query);
    return foundFiles === files.length;
  }
}
