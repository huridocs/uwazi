/* eslint-disable max-lines */
import { Db, ObjectId } from 'mongodb';

import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { Thumbnail } from '#api/core/domain/files/Thumbnail.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { search } from '#api/search/index.js';
import { FileStorage } from '../../../application/contracts/FileStorage.js';
import {
  FilesDataSource,
  GetDocumentsForEntityOptions,
} from '../../../application/contracts/FilesDataSource.js';
import { FileNotFound, ProcessingFileNotFound } from '../../../domain/files/errors.js';
import { FileMappers } from './FilesMappers.js';
import { FileDBO } from './schemas/filesTypes.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

type GetDocumentsForEntityQuery = {
  entity: string;
  type: 'document';
  language?: { $in: string[] };
  status: 'ready';
};

type MongoFilesDataSourceOptions = MongoDSOptions;

export class MongoFilesDataSource extends MongoDataSource<FileDBO> implements FilesDataSource {
  protected collectionName = 'files';

  protected filesToReindex = new Set<BaseFile>();

  protected fileStorage: FileStorage;

  constructor(
    db: Db,
    transactionManager: TransactionManager,
    fileStorage: FileStorage,
    options: MongoFilesDataSourceOptions = {}
  ) {
    super(db, transactionManager, options);
    this.fileStorage = fileStorage;
    transactionManager.onCommitted(async () => {
      const files = Array.from(this.filesToReindex);
      if (!files.length) return;

      await search.indexEntities(
        { sharedId: { $in: files.filter(f => f.isEntityFile()).map(f => f.entity) } },
        files.some(f => f instanceof PDFDocument && f.isReady()) ? '+fullText' : undefined
      );
      this.filesToReindex = new Set<BaseFile>();
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

  private toModel(dbo: FileDBO) {
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
    return new MongoResultSet<FileDBO, BaseFile>(
      this.getCollection().find({
        type: { $ne: 'thumbnail' },
        entity: { $in: entitySharedIds },
      }),
      dbo => this.toModel(dbo)
    );
  }

  getThumbnails(entitySharedIds: string[]): ResultSet<Thumbnail> {
    return new MongoResultSet<FileDBO, Thumbnail>(
      this.getCollection().find({
        entity: { $in: entitySharedIds },
        type: 'thumbnail',
      }),
      dbo => this.toModel(dbo) as Thumbnail
    );
  }

  getThumbnailsByLanguage(language: LanguageISO6391): ResultSet<Thumbnail> {
    return new MongoResultSet<FileDBO, Thumbnail>(
      this.getCollection().find({
        type: 'thumbnail',
        language: LanguageUtils.fromISO639_1(language).ISO639_3,
      }),
      dbo => this.toModel(dbo) as Thumbnail
    );
  }

  getThumbnailsForProcessedPDFs(documentIds: string[]): ResultSet<Thumbnail> {
    const filenames = documentIds.map(id => `${id}.jpg`);
    return new MongoResultSet<FileDBO, Thumbnail>(
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
      return Result.ok(this.toModel(processing) as PDFDocument);
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

  async replaceFile(file: BaseFile): Promise<void> {
    await this.getCollection().replaceOne({ _id: new ObjectId(file.id) }, FileMappers.toDBO(file));
    this.setFilesToReindex([file]);
  }

  async deletePropertySelections(entityPropertyNames: string[], entitySharedIds: string[]) {
    await this.getCollection().updateMany(
      {
        entity: { $in: entitySharedIds },
        propertySelections: { $exists: true, $ne: [] },
      },
      { $pull: { propertySelections: { name: { $in: entityPropertyNames } } } }
    );
  }

  async renamePropertySelections(
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
          propertySelections: {
            $map: {
              input: '$propertySelections',
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
        'propertySelections.name': { $in: Object.keys(renamedPropertyNames) },
        entity: { $in: entitySharedIds },
      },
      pipeline
    );
  }

  getProcessedDocsForEntity(
    entitySharedId: string,
    options?: GetDocumentsForEntityOptions
  ): ResultSet<PDFDocument> {
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

    return new MongoResultSet<FileDBO, PDFDocument>(
      this.getCollection().find(query, { projection: { fullText: 0 } }),
      dbo => this.toModel(dbo) as PDFDocument
    );
  }

  getAll() {
    return new MongoResultSet<FileDBO, BaseFile>(
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

  async getByFilename(filename: string, allowedTypes?: FileDBO['type'][]) {
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

  async getById<ReturnedFile extends BaseFile = BaseFile>(
    id: string
  ): Promise<ResultType<ReturnedFile, FileNotFound>> {
    const dbo = await this.getCollection().findOne(
      { _id: new ObjectId(id) },
      { projection: { fullText: 0 } }
    );
    if (!dbo) {
      return Result.fail(new FileNotFound(`file with id: ${id} not found`));
    }

    return Result.ok(this.toModel(dbo) as unknown as ReturnedFile);
  }

  async getByIds(ids: string[]): Promise<BaseFile[]> {
    const objectIds = ids.map(id => new ObjectId(id));
    const dbos = await this.getCollection()
      .find({ _id: { $in: objectIds } }, { projection: { fullText: 0 } })
      .toArray();
    return dbos.map(dbo => this.toModel(dbo));
  }
}

export type { MongoFilesDataSourceOptions };
