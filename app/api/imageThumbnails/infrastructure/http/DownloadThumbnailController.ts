import type { Request, Response } from 'express';
import { z } from 'zod';
import { pipeline } from 'stream/promises';

import { createError } from '#api/utils/index.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { tenants } from '#api/tenants/index.js';
import { User } from '#api/users.v2/model/User.js';
import { ClientAbortedRequestError } from '#api/common.v2/errors/ClientAbortedRequestError.js';
import { EntityPermissionCheckerFactory } from '#api/core/infrastructure/factories/EntityPermissionCheckerFactory.js';
import { ServeImageThumbnailFactory } from '../factories/ServeImageThumbnailFactory.js';

const timestampToHTTPDate = (timestamp: number): string => new Date(timestamp).toUTCString();

const requestSchema = z.object({
  params: z.object({
    filename: z.string(),
  }),
  query: z.object({
    download: z.coerce.boolean().optional(),
  }),
});

class DownloadThumbnailController extends AbstractController {
  static customHandler() {
    return async (request: Request, response: Response) =>
      new DownloadThumbnailController({ request, response }).handleAsync();
  }

  protected async handle(): Promise<void> {
    const {
      params: { filename },
      query,
    } = requestSchema.parse(this.request);
    const resolved = await ServeImageThumbnailFactory.default().execute({ filename });
    if (resolved.status === 'not_found' || !(await this.canRead(resolved.file))) {
      throw createError('file not found', 404);
    }
    if (await this.notModified(resolved)) {
      return;
    }
    this.addContentHeaders(resolved, query);
    await this.stream(resolved.contents);
  }

  private async canRead(file: BaseFile) {
    if (!file.isEntityFile()) {
      return true;
    }
    return EntityPermissionCheckerFactory.default().checkReadPermission(
      file.entity,
      User.createFrom(this.request.user)
    );
  }

  private async notModified(resolved: { cache: 'default' | 'no-store'; file: BaseFile }) {
    if (resolved.cache === 'no-store') {
      this.response.setHeader('Cache-Control', 'no-store');
      return false;
    }
    if (!tenants.current().featureFlags?.fileCacheHeaders) {
      return false;
    }
    this.addCacheHeaders(resolved.file);
    if (!this.isNotModified(resolved.file)) {
      return false;
    }
    this.response.status(304).end();
    return true;
  }

  private addCacheHeaders(file: BaseFile) {
    if (this.request.user) {
      this.response.setHeader('Cache-Control', 'private, max-age=3600');
      this.response.setHeader('X-Cache-Policy', 'no-store');
    } else {
      this.response.setHeader('Cache-Control', 'public, no-cache');
      this.response.setHeader('X-Cache-Policy', 'yes-store');
    }
    if (file.creationDate) {
      this.response.setHeader('Last-Modified', timestampToHTTPDate(file.creationDate));
    }
  }

  private isNotModified(file: BaseFile) {
    const ifModifiedSince = this.request.headers['if-modified-since'];
    if (!ifModifiedSince || !file.creationDate) {
      return false;
    }
    const clientDateSeconds = Math.floor(new Date(ifModifiedSince).getTime() / 1000);
    const fileDateSeconds = Math.floor(file.creationDate / 1000);
    return fileDateSeconds <= clientDateSeconds;
  }

  private addContentHeaders(
    resolved: { file: BaseFile; contentType: string },
    query: { download?: boolean }
  ) {
    const headerFilename = resolved.file.originalname || resolved.file.filename;
    const disposition = `${query.download ? 'attachment; ' : ''}filename*=UTF-8''${encodeURIComponent(headerFilename)}`;
    this.response.setHeader('Content-Disposition', disposition);
    this.response.setHeader('Content-Type', resolved.contentType);
  }

  private async stream(contents: FileContents) {
    try {
      await pipeline(contents.read(), this.response);
    } catch (e) {
      if (e.code === 'ERR_STREAM_PREMATURE_CLOSE' && this.request.aborted) {
        throw new ClientAbortedRequestError('Client aborted file download', { cause: e });
      }
      throw e;
    }
  }
}

export { DownloadThumbnailController };
