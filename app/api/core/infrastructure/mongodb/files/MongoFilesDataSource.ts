import { Db, ObjectId } from 'mongodb';

import { LanguageUtils } from 'shared/language';
import { SegmentationType } from 'shared/types/segmentationType';

import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { FileContents, NullFileContents } from 'api/core/domain/files/FileContents';
import { Thumbnail } from 'api/core/domain/files/Thumbnail';
import {
  MongoDataSource,
  MongoDSOptions,
} from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { MongoResultSet } from 'api/core/infrastructure/mongodb/common/MongoResultSet';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { Result } from 'api/core/libs/Result';
import { search } from 'api/search';
import { FileStorage } from '../../../application/contracts/FileStorage';
import {
  FilesDataSource,
  GetDocumentsForEntityOptions,
} from '../../../application/contracts/FilesDataSource';
import { BaseDocument } from '../../../domain/files/BaseDocument';
import { Document } from '../../../domain/files/Document';
import { ProcessedDocument } from '../../../domain/files/ProcessedDocument';
import { Segmentation } from '../../../domain/files/Segmentation';
import { UwaziFile } from '../../../domain/files/UwaziFile';
import { FileNotFound, ProcessingFileNotFound } from '../../../domain/files/errors';
import { FileMappers } from './FilesMappers';
import { SegmentationMapper } from './SegmentationMapper';
import { fileDBO } from './schemas/filesTypes';

type GetDocumentsForEntityQuery = {
  entity: string;
  type: 'document';
  language?: { $in: string[] };
  status: 'ready';
};

export type SegmentationDBO = SegmentationType & {
  _id: ObjectId;
  fileID: ObjectId;
};

export class MongoFilesDataSource extends MongoDataSource<fileDBO> implements FilesDataSource {
  protected collectionName = 'files';

  protected entitiesToIndex = new Set<string>();

  protected fileStorage: FileStorage;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    fileStorage: FileStorage,
    options: MongoDSOptions = {}
  ) {
    super(db, transactionManager, options);
    this.fileStorage = fileStorage;
    transactionManager.onCommitted(async () => {
      await search.indexEntities(
        { sharedId: { $in: Array.from(this.entitiesToIndex) } },
        '+fullText'
      );
    });
  }

  getThumbnails(files: ProcessedDocument[]): ResultSet<Thumbnail> {
    return new MongoResultSet<fileDBO, Thumbnail>(
      this.getCollection().find({
        filename: { $in: files.map(f => `${f.id}.jpg`) },
      }),
      async thumbnaildbo =>
        FileMappers.toModel<Thumbnail>(
          thumbnaildbo,
          await this.fileStorage.getFile({
            type: thumbnaildbo.type,
            filename: thumbnaildbo.filename,
          })
        )
    );
  }

  async getProcessingById(fileId: string) {
    const processing = await this.getCollection().findOne({
      _id: new ObjectId(fileId),
      status: 'processing',
    });
    if (processing) {
      return Result.ok(
        FileMappers.toModel(
          processing,
          await this.fileStorage.getFile({
            type: 'document',
            filename: processing.filename,
          })
        ) as Document
      );
    }
    return Result.fail(new ProcessingFileNotFound(fileId));
  }

  async update(file: UwaziFile): Promise<void> {
    await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(file.id) },
      { $set: FileMappers.toDBO(file) }
    );
    if (file instanceof BaseDocument) {
      this.entitiesToIndex.add(file.entity);
    }
  }

  async create(file: UwaziFile): Promise<void> {
    await this.getCollection().insertOne(FileMappers.toDBO(file));
    if (file instanceof BaseDocument) {
      this.entitiesToIndex.add(file.entity);
    }
  }

  async delete(files: UwaziFile[]) {
    await this.getCollection().deleteMany({ _id: { $in: files.map(f => new ObjectId(f.id)) } });
    files
      .filter(f => f instanceof BaseDocument)
      .forEach(f => {
        this.entitiesToIndex.add(f.entity);
      });
  }

  async bulkCreate(files: [UwaziFile, ...UwaziFile[]]): Promise<void> {
    await this.getCollection().insertMany(files.map(FileMappers.toDBO));

    files.forEach(async file => {
      if (file instanceof ProcessedDocument) {
        this.entitiesToIndex.add(file.entity);
      }
    });
  }

  async deleteExtractedMetadata(entityPropertyNames: string[], entitySharedIds: string[]) {
    await this.getCollection().updateMany(
      {
        entity: { $in: entitySharedIds },
        extractedMetadata: { $exists: true, $ne: [] },
      },
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

  getProcessedDocsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<ProcessedDocument> {
    const query: GetDocumentsForEntityQuery = {
      entity: entitySharedId,
      type: 'document',
      status: 'ready',
    };

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

    return new MongoResultSet<fileDBO, ProcessedDocument>(
      this.getCollection().find(query, { projection: { fullText: 0 } }),
      async dbo =>
        FileMappers.toModel<ProcessedDocument>(
          dbo,
          await this.fileStorage.getFile({
            type: dbo.type,
            filename: dbo.filename,
          })
        )
    );
  }

  getAll() {
    return new MongoResultSet<fileDBO, UwaziFile>(
      this.getCollection().find({}, { projection: { fullText: 0 } }),
      async dbo =>
        FileMappers.toModel<ProcessedDocument>(
          dbo,
          await this.fileStorage.getFile({
            type: dbo.type,
            filename: dbo.filename,
          })
        )
    );
  }

  async filesExistForEntities(files: { entity: string; _id: string }[]) {
    const query = {
      $or: files.map(file => ({
        _id: new ObjectId(file._id),
        entity: file.entity,
      })),
    };
    const foundFiles = await this.getCollection().countDocuments(query);
    return foundFiles === files.length;
  }

  async getByFilename(filename: string, allowedTypes?: fileDBO['type'][]) {
    const dbo = await this.getCollection().findOne({
      filename,
      ...(allowedTypes ? { type: { $in: allowedTypes } } : {}),
    });
    if (!dbo) {
      return Result.fail(new FileNotFound(`file: ${filename} not found`));
    }

    let contents: FileContents;

    if (dbo.type === 'attachment' && dbo.url) {
      contents = new NullFileContents();
    } else {
      contents = await this.fileStorage.getFile({
        type: dbo.type,
        filename: dbo.filename,
      });
    }

    return Result.ok(FileMappers.toModel(dbo, contents));
  }

  async getById(id: string) {
    const dbo = await this.getCollection().findOne({
      _id: new ObjectId(id),
    });
    if (!dbo) {
      return Result.fail(new FileNotFound(`file with id: ${id} not found`));
    }

    let contents: FileContents;

    if (dbo.type === 'attachment' && dbo.url) {
      contents = new NullFileContents();
    } else {
      contents = await this.fileStorage.getFile({
        type: dbo.type,
        filename: dbo.filename,
      });
    }

    return Result.ok(FileMappers.toModel(dbo, contents));
  }
}
