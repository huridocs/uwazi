import { ObjectId } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../../shared/language/index.js... Remove this comment to see the full error message
import { LanguageUtils } from 'shared/language/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/segmentatio... Remove this comment to see the full error message
import { SegmentationType } from 'shared/types/segmentationType.js';

// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoDat... Remove this comment to see the full error message
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource.js';

import { MongoResultSet } from 'api/common.v2/database/MongoResultSet.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/ResultS... Remove this comment to see the full error message
import { ResultSet } from '../common.v2/contracts/ResultSet.js';

import { FilesDataSource, GetDocumentsForEntityOptions } from '../contracts/FilesDataSource';
import { UwaziFile } from '../model/UwaziFile';
import { Segmentation } from '../model/Segmentation';
import { Document } from '../model/Document';

import { FileMappers } from './FilesMappers';
import { FileDBOType } from './schemas/filesTypes';
import { SegmentationMapper } from './SegmentationMapper';

type GetDocumentsForEntityQuery = {
  entity: string;
  type: 'document';
  language?: { $in: string[] };
};

export type SegmentationDBO = SegmentationType & {
  _id: ObjectId;
  fileID: ObjectId;
};

export class MongoFilesDataSource extends MongoDataSource<FileDBOType> implements FilesDataSource {
  protected collectionName = 'files';

  getSegmentations(filesId: string[]): ResultSet<Segmentation> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const cursor = this.getCollection<SegmentationDBO>('segmentations').find({
      fileID: { $in: filesId.map(id => new ObjectId(id)) },
      status: 'ready',
      segmentation: { $exists: true },
    });

    return new MongoResultSet(cursor, SegmentationMapper.toDomain);
  }

  getDocumentsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<Document> {
    const query: GetDocumentsForEntityQuery = { entity: entitySharedId, type: 'document' };

    if (options?.languages) {
      const inLanguages = options.languages.reduce((langauges, l) => {
        const language = LanguageUtils.fromISO639_1(l)?.ISO639_3;
        if (language) {
          langauges.push(language);
        }
        return langauges;
      }, [] as string[]);

      if (inLanguages.length) {
        query.language = { $in: inLanguages };
      }
    }

    return new MongoResultSet<FileDBOType, Document>(
      // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
      this.getCollection().find(query, { projection: { fullText: 0 } }),
      FileMappers.toDocumentModel
    );
  }

  getAll() {
    return new MongoResultSet<FileDBOType, UwaziFile>(
      // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
      this.getCollection().find({}, { projection: { fullText: 0 } }),
      FileMappers.toModel
    );
  }

  async filesExistForEntities(files: { entity: string; _id: string }[]) {
    const query = {
      $or: files.map(file => ({ _id: new ObjectId(file._id), entity: file.entity })),
    };
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const foundFiles = await this.getCollection().countDocuments(query);
    return foundFiles === files.length;
  }
}
