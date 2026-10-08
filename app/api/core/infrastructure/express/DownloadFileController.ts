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
import { FileDBO } from '#api/core/infrastructure/mongodb/files/schemas/FilesTypes.js';
import { tenants } from '#api/tenants/index.js';
import { User } from '#api/users.v2/model/User.js';
import { FilesDataSourceFactory } from '../factories/FilesDataSourceFactory.js';
import { EntityPermissionCheckerFactory } from '../factories/EntityPermissionCheckerFactory.js';
import { ClientAbortedRequestError } from '#api/common.v2/errors/ClientAbortedRequestError.js';
import { fileDownloadHeaders } from './fileDownloadHeaders.js';

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

    if (await this.respondNotModified(file)) {
      return;
    }

    this.addContentHeaders(file, query);
    await this.sendFile(file);
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

  private async respondNotModified(file: BaseFile): Promise<boolean> {
    if (!tenants.current().featureFlags?.fileCacheHeaders) {
      return false;
    }

    await this.addFileCacheHeaders(file);
    if (!this.checkNotModified(file)) {
      return false;
    }

    this.response.status(304).end();
    return true;
  }

  private async sendFile(file: BaseFile): Promise<void> {
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

  private addContentHeaders(file: BaseFile, query: { download?: boolean }) {
    const headers = fileDownloadHeaders({
      storedFilename: file.filename,
      originalFilename: file.originalname || file.filename,
      mimetype: file.mimetype,
      download: query.download,
    });

    this.response.setHeader('Content-Disposition', headers.contentDisposition);
    this.response.setHeader('Content-Type', headers.contentType);
    this.response.setHeader('X-Content-Type-Options', 'nosniff');
    if (headers.contentSecurityPolicy) {
      this.response.setHeader('Content-Security-Policy', headers.contentSecurityPolicy);
    }
  }

  private async checkFileReadPermissions(file: BaseFile): Promise<boolean> {
    if (!file.isEntityFile()) {
      return true;
    }

    return EntityPermissionCheckerFactory.default().checkReadPermission(
      file.entity,
      User.createFrom(this.request.user)
    );
  }
}

export { DownloadFileController };
