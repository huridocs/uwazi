import { createError } from 'api/utils';

import { AbstractController, Dependencies } from 'api/common.v2/infrastructure/AbstractController';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { BaseFile } from 'api/core/domain/files/BaseFile';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { fileDBO } from 'api/core/infrastructure/mongodb/files/schemas/filesTypes';
import { tenants } from 'api/tenants';
import { User } from 'api/users.v2/model/User';
import { Request, Response } from 'express';
import { z } from 'zod';
import { pipeline } from 'stream/promises';
import { FilesDataSourceFactory } from '../factories/FilesDataSourceFactory';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker';

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
  typesAllowed: fileDBO['type'][];
};

class DownloadFileController extends AbstractController {
  private typesAllowed: fileDBO['type'][];

  private fileStorage: FileStorage;

  constructor(dependencies: Deps) {
    const { typesAllowed, ...rest } = dependencies;
    super(rest);
    this.typesAllowed = typesAllowed;
    this.fileStorage = FileStorageFactory.default();
  }

  static customHandler(typesAllowed: fileDBO['type'][]) {
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
    }

    this.addContentHeaders(file.originalname || file.filename, query, file.mimetype);

    const fileContents = this.fileStorage.getFile({
      filename: file.filename,
      type: file.type,
    });

    await pipeline(fileContents.read(), this.response);
  }

  private async getFile(filename: string) {
    const transactionManager = TransactionManagerFactory.default();
    const filesDS = FilesDataSourceFactory.default(transactionManager);

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
    } else {
      this.response.setHeader('Cache-Control', 'public, no-cache');
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
        this.request.user
          ? User.createFrom({
              id: this.request.user._id.toString(),
              role: this.request.user.role,
              groups: (this.request.user.groups || []).map(g => g._id.toString()),
            })
          : undefined
      )
    ).getDataOrThrow();
  }
}

export { DownloadFileController };
