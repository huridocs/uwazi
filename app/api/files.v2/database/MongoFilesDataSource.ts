import { Db, ObjectId } from 'mongodb';

import { LanguageUtils } from 'shared/language';
import { SegmentationType } from 'shared/types/segmentationType';

import { ResultSet } from 'api/core/application/contracts/ResultSet';
import {
  MongoDataSource,
  MongoDSOptions,
} from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { MongoResultSet } from 'api/core/infrastructure/mongodb/common/MongoResultSet';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { search } from 'api/search';
import { FilesDataSource, GetDocumentsForEntityOptions } from '../contracts/FilesDataSource';
import { Document } from '../model/Document';
import { Segmentation } from '../model/Segmentation';
import { UwaziFile } from '../model/UwaziFile';
import { FileMappers } from './FilesMappers';
import { fileDBO } from './schemas/filesTypes';
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

export class MongoFilesDataSource extends MongoDataSource<fileDBO> implements FilesDataSource {
  protected collectionName = 'files';

  protected entitiesToIndex = new Set<string>();

  constructor(db: Db, transactionManager: MongoTransactionManager, options: MongoDSOptions = {}) {
    super(db, transactionManager, options);
    transactionManager.onCommitted(async () => {
      await search.indexEntities(
        { sharedId: { $in: Array.from(this.entitiesToIndex) } },
        '+fullText'
      );
    });
  }

  async create(file: UwaziFile): Promise<void> {
    await this.getCollection().insertOne(FileMappers.toDBO(file));
    if (file instanceof Document) {
      this.entitiesToIndex.add(file.entity);
    }
  }

  async deleteExtractedMetadata(entityPropertyNames: string[], entitySharedIds: string[]) {
    await this.getCollection().updateMany(
      { entity: { $in: entitySharedIds }, extractedMetadata: { $exists: true, $ne: [] } },
      { $pull: { extractedMetadata: { name: { $in: entityPropertyNames } } } }
    );
  }

  async renameExtractedMetadata(
    renamedPropertyNames: { [previousName: string]: string },
    entitySharedIds: string[]
  ) {
    const branches = Object.entries(renamedPropertyNames).map(([oldVal, newVal]) => ({
      case: { $eq: ['$$item.name', oldVal] },
      then: newVal,
    }));

    const pipeline = [
      {
        $set: {
          extractedMetadata: {
            $map: {
              input: '$extractedMetadata',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    name: {
                      $switch: {
                        branches,
                        default: '$$item.name',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ];
    await this.getCollection().updateMany(
      {
        'extractedMetadata.name': { $in: Object.keys(renamedPropertyNames) },
        entity: { $in: entitySharedIds },
      },
      pipeline
    );
  }

  getSegmentations(filesId: string[]): ResultSet<Segmentation> {
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

    return new MongoResultSet<fileDBO, Document>(
      this.getCollection().find(query, { projection: { fullText: 0 } }),
      FileMappers.toModel<Document>
    );
  }

  getAll() {
    return new MongoResultSet<fileDBO, UwaziFile>(
      this.getCollection().find({}, { projection: { fullText: 0 } }),
      FileMappers.toModel
    );
  }

  async filesExistForEntities(files: { entity: string; _id: string }[]) {
    const query = {
      $or: files.map(file => ({ _id: new ObjectId(file._id), entity: file.entity })),
    };
    const foundFiles = await this.getCollection().countDocuments(query);
    return foundFiles === files.length;
  }
}
