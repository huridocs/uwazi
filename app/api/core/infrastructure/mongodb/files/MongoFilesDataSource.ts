import { Db, ObjectId } from 'mongodb';

import { LanguageUtils } from 'shared/language';
import { SegmentationType } from 'shared/types/segmentationType';

import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { BaseFile } from 'api/core/domain/files/BaseFile';
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
import { ProcessingPDF } from '../../../domain/files/ProcessingPDF';
import { ProcessedPDF } from '../../../domain/files/ProcessedPDF';
import { Segmentation } from '../../../domain/files/Segmentation';
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

  protected filesToReindex = new Set<BaseFile>();

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
      if (this.filesToReindex.size) {
        let fullTextProjection: string | undefined;
        const files = Array.from(this.filesToReindex);
        if (files.some(f => f instanceof ProcessedPDF)) {
          fullTextProjection = '+fullText';
        }
        await search.indexEntities(
          { sharedId: { $in: Array.from(this.filesToReindex).map(f => f.entity) } },
          fullTextProjection
        );
        this.filesToReindex = new Set<BaseFile>();
      }
    });
  }

  private toModel(dbo: fileDBO) {
    return FileMappers.toModel(dbo, {
      contentLoader: this.fileStorage.getFile.bind(this.fileStorage),
    });
  }

  private setFilesToReindex(files: BaseFile[]) {
    files.forEach(file => {
      if (file.isEntityFile()) {
        this.filesToReindex.add(file);
      }
    });
  }

  getByEntitiesIds(entitySharedIds: string[]): ResultSet<BaseFile> {
    return new MongoResultSet<fileDBO, BaseFile>(
      this.getCollection().find({
        entity: { $in: entitySharedIds },
      }),
      dbo => this.toModel(dbo)
    );
  }

  getThumbnails(files: ProcessedPDF[]): ResultSet<Thumbnail> {
    return new MongoResultSet<fileDBO, Thumbnail>(
      this.getCollection().find({
        filename: { $in: files.map(f => `${f.id}.jpg`) },
      }),
      dbo => this.toModel(dbo) as Thumbnail
    );
  }

  async getProcessingById(fileId: string) {
    const processing = await this.getCollection().findOne({
      _id: new ObjectId(fileId),
      status: 'processing',
    });
    if (processing) {
      return Result.ok(this.toModel(processing) as ProcessingPDF);
    }
    return Result.fail(new ProcessingFileNotFound(fileId));
  }

  async update(file: BaseFile): Promise<void> {
    await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(file.id) },
      { $set: FileMappers.toDBO(file) }
    );
    this.setFilesToReindex([file]);
  }

  async create(file: BaseFile): Promise<void> {
    await this.getCollection().insertOne(FileMappers.toDBO(file));
    this.setFilesToReindex([file]);
  }

  async delete(files: BaseFile[]) {
    await this.getCollection().deleteMany({ _id: { $in: files.map(f => new ObjectId(f.id)) } });
    this.setFilesToReindex(files);
  }

  async bulkCreate(files: [BaseFile, ...BaseFile[]]): Promise<void> {
    await this.getCollection().insertMany(files.map(FileMappers.toDBO));
    this.setFilesToReindex(files);
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
  ): ResultSet<ProcessedPDF> {
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

    return new MongoResultSet<fileDBO, ProcessedPDF>(
      this.getCollection().find(query, { projection: { fullText: 0 } }),
      dbo => this.toModel(dbo) as ProcessedPDF
    );
  }

  getAll() {
    return new MongoResultSet<fileDBO, BaseFile>(
      this.getCollection().find({}, { projection: { fullText: 0 } }),
      dbo => this.toModel(dbo)
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
    const dbo = await this.getCollection().findOne(
      {
        filename,
        ...(allowedTypes ? { type: { $in: allowedTypes } } : {}),
      },
      { projection: { fullText: 0 } }
    );
    if (!dbo) {
      return Result.fail(new FileNotFound(`file: ${filename} not found`));
    }

    return Result.ok(this.toModel(dbo));
  }

  async getById(id: string) {
    const dbo = await this.getCollection().findOne(
      { _id: new ObjectId(id) },
      { projection: { fullText: 0 } }
    );
    if (!dbo) {
      return Result.fail(new FileNotFound(`file with id: ${id} not found`));
    }

    return Result.ok(this.toModel(dbo));
  }
}
