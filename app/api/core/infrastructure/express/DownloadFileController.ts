import { createError } from 'api/utils';

import { AbstractController, Dependencies } from 'api/common.v2/infrastructure/AbstractController';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { fileDBO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { tenants } from 'api/tenants';
import { Request, Response } from 'express';
import { FileType } from 'shared/types/fileType';
import { z } from 'zod';
import { pipeline } from 'stream/promises';
import { FilesDataSourceFactory } from '../factories/FilesDataSourceFactory';
import { SettingsDataSourceFactory } from '../factories/SettingsDataSourceFactory';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory';

const timestampToHTTPDate = (timestamp: number): string => new Date(timestamp).toUTCString();

const requestSchema = z.object({
  params: z.object({
    filename: z.string(),
  }),
  query: z.object({
    download: z.coerce.boolean().optional(),
  }),
});

const getCacheControlHeader = (
  isPubliclyAccessible: boolean,
  isPrivateInstance: boolean
): string => {
  if (isPrivateInstance) {
    return 'private, max-age=3600';
  }

  if (isPubliclyAccessible) {
    return 'public, no-cache';
  }

  return 'private, max-age=3600';
};

type Deps = Dependencies & {
  typesAllowed: fileDBO['type'][];
  checkFilePermissions: (file: FileType) => Promise<boolean>;
  isFilePubliclyAccessible: (file: FileType, isPrivateInstance: boolean) => Promise<boolean>;
};

class DownloadFileController extends AbstractController {
  private typesAllowed: fileDBO['type'][];

  private checkFilePermissions: (file: FileType) => Promise<boolean>;

  private fileStorage: FileStorage;

  private isFilePubliclyAccessible: (
    file: FileType,
    isPrivateInstance: boolean
  ) => Promise<boolean>;

  constructor(dependencies: Deps) {
    const { typesAllowed, checkFilePermissions, isFilePubliclyAccessible, ...rest } = dependencies;
    super(rest);
    this.typesAllowed = typesAllowed;
    this.checkFilePermissions = checkFilePermissions;
    this.isFilePubliclyAccessible = isFilePubliclyAccessible;
    this.fileStorage = FileStorageFactory.default();
  }

  static customHandler(
    typesAllowed: fileDBO['type'][],
    checkFilePermissions: (file: FileType) => Promise<boolean>,
    isFilePubliclyAccessible: (file: FileType, isPrivateInstance: boolean) => Promise<boolean>
  ) {
    return async (request: Request, response: Response) =>
      new DownloadFileController({
        request,
        response,
        typesAllowed,
        checkFilePermissions,
        isFilePubliclyAccessible,
      }).handleAsync();
  }

  protected async handle(): Promise<void> {
    const {
      params: { filename },
      query,
    } = requestSchema.parse(this.request);

    const file = await this.getFile(filename);

    if (tenants.current().featureFlags?.fileCacheHeaders) {
      await this.addFileCacheHeaders(file);
    }

    this.addContentHeaders(file.originalname || file.filename, query, file.mimetype);

    const fileContents = this.fileStorage.getFile({
      filename: file.filename,
      type: file.type,
    });

    const readable = await fileContents.getReadable();

    this.response.on('close', () => {
      readable.destroy();
    });

    await pipeline(readable, this.response);
  }

  private async getFile(filename: string) {
    const transactionManager = TransactionManagerFactory.default();
    const filesDS = FilesDataSourceFactory.default(transactionManager);

    const fileResult = await filesDS.getByFilename(filename, this.typesAllowed);

    if (fileResult.isError()) {
      throw createError('file not found', 404);
    }

    const filev2 = fileResult.getData();
    const file = filev2.toDTO();
    if (!(await this.fileStorage.fileExists(filev2)) || !(await this.checkFilePermissions(file))) {
      throw createError('file not found', 404);
    }
    return file;
  }

  private async addFileCacheHeaders(file: FileType) {
    if (this.request.user) {
      this.response.setHeader('Cache-Control', 'private, max-age=3600');
    } else {
      const settingsDS = SettingsDataSourceFactory.default(TransactionManagerFactory.default());
      const isPrivateInstance = (await settingsDS.get()).private || false;

      const isPublic = await this.isFilePubliclyAccessible(file, isPrivateInstance);

      const cacheControl = getCacheControlHeader(isPublic, isPrivateInstance);
      this.response.setHeader('Cache-Control', cacheControl);
    }

    if (file.creationDate) {
      const lastModified = timestampToHTTPDate(file.creationDate);
      this.response.setHeader('Last-Modified', lastModified);
    }
  }

  private addContentHeaders(
    headerFilename: string,
    query: { download?: boolean },
    mimetype?: string
  ) {
    this.response.setHeader(
      'Content-Disposition',
      `filename*=UTF-8''${encodeURIComponent(headerFilename)}`
    );

    if (query.download) {
      this.response.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(headerFilename)}`
      );
    }
    this.response.setHeader('Content-Type', mimetype || 'application/octet-stream');
  }
}

export { DownloadFileController };
