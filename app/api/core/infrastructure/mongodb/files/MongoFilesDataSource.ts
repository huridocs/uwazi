import { Db, ObjectId } from 'mongodb';

import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { SegmentationType } from '#shared/types/segmentationType.js';

import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Result } from '#api/core/libs/Result.js';
import { search } from '#api/search/index.js';
import { FullTextIndexerService } from '#api/core/infrastructure/elasticSearch/entities/FullTextIndexerService.js';
import { FileStorage } from '../../../application/contracts/FileStorage.js';
import {
  FilesDataSource,
  GetDocumentsForEntityOptions,
} from '../../../application/contracts/FilesDataSource.js';
import { ProcessingPDF } from '../../../domain/files/ProcessingPDF.js';
import { ProcessedPDF } from '../../../domain/files/ProcessedPDF.js';
import { Segmentation } from '../../../domain/files/Segmentation.js';
import { FileNotFound, ProcessingFileNotFound } from '../../../domain/files/errors.js';
import { FileMappers } from './FilesMappers.js';
import { SegmentationMapper } from './SegmentationMapper.js';
import { ProcessedPDFDBO, fileDBO } from './schemas/filesTypes.js';

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

export type MongoFilesDataSourceOptions = MongoDSOptions & {
  fullTextIndexer: FullTextIndexerService;
};

export class MongoFilesDataSource extends MongoDataSource<fileDBO> implements FilesDataSource {
  protected collectionName = 'files';

  protected filesToReindex = new Set<BaseFile>();

  private fileToDelete = new Map<string, BaseFile>();

  protected fileStorage: FileStorage;

  private fullTextIndexer: FullTextIndexerService;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    fileStorage: FileStorage,
    options: MongoFilesDataSourceOptions
  ) {
    super(db, transactionManager, options);
    this.fileStorage = fileStorage;
    this.fullTextIndexer = options.fullTextIndexer;
    transactionManager.onCommitted(async () => {
      const files = Array.from(this.filesToReindex);
      if (!files.length) return;

      await search.indexEntities(
        { sharedId: { $in: files.map(f => f.entity) } },
        files.some(f => f instanceof ProcessedPDF) ? '+fullText' : undefined
      );

      const processedPDFs = files
        .filter(f => f instanceof ProcessedPDF && f.pendingFullTextIndexing)
        .map(f => FileMappers.toDBO(f));

      await this.fullTextIndexer.index(processedPDFs as ProcessedPDFDBO[]);

      this.filesToReindex = new Set<BaseFile>();
    });

    transactionManager.onCommitted(async () => {
      const files = Array.from(this.fileToDelete.values());

      const processedPDFFilenames = files
        .filter(f => f instanceof ProcessedPDF)
        .map(f => f.filename);

      await this.fullTextIndexer.remove(processedPDFFilenames);

      this.fileToDelete.clear();
    });
  }

  async bulkUpdate(files: BaseFile[]): Promise<void> {
    if (!files.length) return;

    await this.getCollection().bulkWrite(
      files.map(file => ({
        updateOne: {
          filter: { _id: new ObjectId(file.id) },
          update: { $set: FileMappers.toDBO(file) },
        },
      })),
      { ignoreUndefined: true }
    );

    this.setFilesToReindex(files);
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
        type: { $ne: 'thumbnail' },

        entity: { $in: entitySharedIds },
      }),
      dbo => this.toModel(dbo)
    );
  }

  getThumbnails(entitySharedIds: string[]): ResultSet<Thumbnail> {
    return new MongoResultSet<fileDBO, Thumbnail>(
      this.getCollection().find({
        entity: { $in: entitySharedIds },
        type: 'thumbnail',
      }),
      dbo => this.toModel(dbo) as Thumbnail
    );
  }

  getThumbnailsByLanguage(language: LanguageISO6391): ResultSet<Thumbnail> {
    return new MongoResultSet<fileDBO, Thumbnail>(
      this.getCollection().find({
        type: 'thumbnail',
        language: LanguageUtils.fromISO639_1(language).ISO639_3,
      }),
      dbo => this.toModel(dbo) as Thumbnail
    );
  }

  getThumbnailsForProcessedPDFs(documentIds: string[]): ResultSet<Thumbnail> {
    const filenames = documentIds.map(id => `${id}.jpg`);
    return new MongoResultSet<fileDBO, Thumbnail>(
      this.getCollection().find({
        filename: { $in: filenames },
        type: 'thumbnail',
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

    files.forEach(file => this.fileToDelete.set(file.id, file));
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
