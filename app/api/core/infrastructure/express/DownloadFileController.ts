import { createError } from 'api/utils';

import { AbstractController, Dependencies } from 'api/common.v2/infrastructure/AbstractController';
import entities from 'api/entities';
import { files } from 'api/files';
import { FileMappers } from 'api/files.v2/database/FilesMappers';
import { fileDBO } from 'api/files.v2/database/schemas/filesTypes';
import { FileStorageFactory } from 'api/files.v2/infrastructure/FileStorageFactory';
import { permissionsContext } from 'api/permissions/permissionsContext';
import settings from 'api/settings';
import { tenants } from 'api/tenants';
import { Request, Response } from 'express';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { UserSchema } from 'shared/types/userType';
import { Readable } from 'stream';
import { FilesDataSourceFactory } from '../factories/FilesDataSourceFactory';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory';

const timestampToHTTPDate = (timestamp: number): string => new Date(timestamp).toUTCString();

const checkEntityPermission = async (
  file: FileType,
  user: UserSchema | undefined,
  level: 'read' | 'write' = 'read'
): Promise<boolean> => {
  if (['admin'].includes(user?.role || '')) return true;
  const [fileInDB] = await files.get({ _id: file._id });

  if (!fileInDB || (fileInDB.type === 'custom' && level === 'write')) {
    return false;
  }

  if (fileInDB.type === 'custom' && level === 'read') {
    return true;
  }

  const relatedEntities: EntitySchema[] = await entities.get(
    { sharedId: fileInDB.entity },
    '_id, permissions',
    { withoutDocuments: true }
  );

  if (level === 'read') {
    return relatedEntities.length > 0;
  }

  return (
    relatedEntities.length > 0 &&
    relatedEntities.every(
      entity =>
        !!(entity.permissions || []).find(
          permission =>
            permission.refId.toString() === user?._id?.toString() && permission.level === 'write'
        )
    )
  );
};

const isFilePubliclyAccessible = async (
  file: FileType,
  isPrivateInstance: boolean
): Promise<boolean> => {
  if (isPrivateInstance) {
    return false;
  }

  if (file.type === 'custom') {
    return true;
  }

  if (!file.entity) {
    return false;
  }

  const relatedEntities: EntitySchema[] = await entities.get(
    { sharedId: file.entity },
    'published',
    { withoutDocuments: true }
  );
  return relatedEntities.length > 0 && relatedEntities.every(entity => entity.published === true);
};

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

type Deps = Dependencies & { typesAllowed: fileDBO['type'][] };

class DownloadFileController extends AbstractController {
  private typesAllowed: fileDBO['type'][];

  constructor(dependencies: Deps) {
    const { typesAllowed, ...rest } = dependencies;
    super(rest);
    this.typesAllowed = typesAllowed;
  }

  static customHandler(typesAllowed: fileDBO['type'][]) {
    return async (request: Request, response: Response) =>
      new DownloadFileController({ request, response, typesAllowed }).handleAsync();
  }

  protected async handle(): Promise<void> {
    // VALIDATE PARAM AND QUERY !
    //@ts-ignore
    const { filename } = this.request.params;
    //

    const transactionManager = TransactionManagerFactory.default();
    const filesDS = FilesDataSourceFactory.default(transactionManager);
    const fileStorage = FileStorageFactory.default();

    const fileResult = await filesDS.getByFilename(filename, this.typesAllowed);

    if (fileResult.isError()) {
      throw createError('file not found', 404);
    }

    const currentUser = permissionsContext.getUserInContext();

    const filev2 = fileResult.getData();
    const file = FileMappers.toDTO(filev2);
    if (
      !(await fileStorage.fileExists(filev2)) ||
      !(await checkEntityPermission(file, currentUser))
    ) {
      throw createError('file not found', 404);
    }

    if (tenants.current().featureFlags?.fileCacheHeaders) {
      await this.addFileCacheHeaders(file, currentUser);
    }
    this.addContentHeaders(file.originalname || file.filename, file.mimetype);

    const stream = Readable.from(
      (
        await fileStorage.getFile({
          filename: file.filename,
          type: file.type,
        })
      ).read()
    );
    this.response.on('close', () => {
      stream.destroy();
    });
    stream.pipe(this.response);
  }

  private async addFileCacheHeaders(file: FileType, currentUser?: UserSchema) {
    if (currentUser) {
      this.response.setHeader('Cache-Control', 'private, max-age=3600');
    } else {
      const appSettings = await settings.get();
      const isPrivateInstance = appSettings.private || false;

      const isPublic = await isFilePubliclyAccessible(file, isPrivateInstance);

      const cacheControl = getCacheControlHeader(isPublic, isPrivateInstance);
      this.response.setHeader('Cache-Control', cacheControl);
    }

    if (file.creationDate) {
      const lastModified = timestampToHTTPDate(file.creationDate);
      this.response.setHeader('Last-Modified', lastModified);
    }
  }

  private addContentHeaders(headerFilename: string, mimetype?: string) {
    this.response.setHeader(
      'Content-Disposition',
      `filename*=UTF-8''${encodeURIComponent(headerFilename)}`
    );

    if (this.request.query.download) {
      this.response.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(headerFilename)}`
      );
    }
    this.response.setHeader('Content-Type', mimetype || 'application/octet-stream');
  }
}

export { DownloadFileController };
