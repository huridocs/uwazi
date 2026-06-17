import type { Request, Response } from 'express';
import { z } from 'zod';
import { pipeline } from 'stream/promises';

import { createError } from '#api/utils/index.js';
import {
  AbstractController,
  Dependencies,
} from '#api/common.v2/infrastructure/AbstractController.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { FileDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { tenants } from '#api/tenants/index.js';
import { User } from '#api/users.v2/model/User.js';
import { FilesDataSourceFactory } from '../factories/FilesDataSourceFactory.js';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { ClientAbortedRequestError } from '#api/common.v2/errors/ClientAbortedRequestError.js';

const timestampToHTTPDate = (timestamp: number): string => new Date(timestamp).toUTCString();

const requestSchema = z.object({
  params: z.object({
    filename: z.string(),
  }),
  query: z.object({
    download: z.coerce.boolean().optional(),
  }),
});

type Deps = Dependencies & {
  typesAllowed: FileDBO['type'][];
};

class DownloadFileController extends AbstractController {
  private typesAllowed: FileDBO['type'][];

  private fileStorage: FileStorage;

  constructor(dependencies: Deps) {
    const { typesAllowed, ...rest } = dependencies;
    super(rest);
    this.typesAllowed = typesAllowed;
    this.fileStorage = FileStorageFactory.default();
  }

  static customHandler(typesAllowed: FileDBO['type'][]) {
    return async (request: Request, response: Response) =>
      new DownloadFileController({
        request,
        response,
        typesAllowed,
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

      if (this.checkNotModified(file)) {
        this.response.status(304).end();
        return;
      }
    }

    this.addContentHeaders(file.originalname || file.filename, query, file.mimetype);

    const fileContents = this.fileStorage.getFile({
      filename: file.filename,
      type: file.type,
    });

    try {
      await pipeline(fileContents.read(), this.response);
    } catch (e) {
      if (e.code === 'ERR_STREAM_PREMATURE_CLOSE' && this.request.aborted) {
        throw new ClientAbortedRequestError('Client aborted file download', { cause: e });
      }
      throw e;
    }
  }

  private async getFile(filename: string) {
    const filesDS = FilesDataSourceFactory.default();

    const fileResult = await filesDS.getByFilename(filename, this.typesAllowed);

    if (fileResult.isError()) {
      throw createError('file not found', 404);
    }

    const filev2 = fileResult.getData();
    if (
      !(await this.fileStorage.fileExists(filev2)) ||
      !(await this.checkFileReadPermissions(filev2))
    ) {
      throw createError('file not found', 404);
    }
    return filev2;
  }

  private async addFileCacheHeaders(file: BaseFile) {
    if (this.request.user) {
      this.response.setHeader('Cache-Control', 'private, max-age=3600');
      this.response.setHeader('X-Cache-Policy', 'no-store');
    } else {
      this.response.setHeader('Cache-Control', 'public, no-cache');
      this.response.setHeader('X-Cache-Policy', 'yes-store');
    }

    if (file.creationDate) {
      const lastModified = timestampToHTTPDate(file.creationDate);
      this.response.setHeader('Last-Modified', lastModified);
    }
  }

  private checkNotModified(file: BaseFile): boolean {
    const ifModifiedSince = this.request.headers['if-modified-since'];

    if (!ifModifiedSince || !file.creationDate) {
      return false;
    }

    const clientDateSeconds = Math.floor(new Date(ifModifiedSince).getTime() / 1000);
    const fileDateSeconds = Math.floor(file.creationDate / 1000);

    return fileDateSeconds <= clientDateSeconds;
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

  private async checkFileReadPermissions(file: BaseFile): Promise<boolean> {
    if (!file.isEntityFile()) {
      return true;
    }

    const entityPermissionChecker = new MongoEntityPermissionChecker(
      getConnection(),
      TransactionManagerFactory.default()
    );

    return (
      await entityPermissionChecker.checkReadPermission(
        file.entity,
        User.createFrom(this.request.user)
      )
    ).getDataOrThrow();
  }
}

export { DownloadFileController };
