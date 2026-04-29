import { z } from 'zod';
import { pipeline } from 'stream/promises';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { DownloadFileSegmentation } from '#api/core/application/DownloadFileSegmentation.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';

const requestSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/),
  }),
  query: z.object({
    download: z.coerce.boolean().optional(),
  }),
});

class DownloadFileSegmentationController extends AbstractController {
  protected async handle(): Promise<void> {
    const {
      params: { id },
      query,
    } = requestSchema.parse(this.request);

    const useCase = this.useCase();
    const { fileContents, filename } = await useCase.execute({ fileId: id });

    this.addContentHeaders(filename, query.download);
    await pipeline(fileContents.read(), this.response);
  }

  private useCase() {
    const transactionManager = TransactionManagerFactory.default();
    return new DownloadFileSegmentation({
      filesDS: FilesDataSourceFactory.default(),
      fileStorage: FileStorageFactory.default(),
      settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
    });
  }

  private addContentHeaders(filename: string, download?: boolean) {
    this.response.setHeader(
      'Content-Disposition',
      `filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    if (download) {
      this.response.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
    }
    this.response.setHeader('Content-Type', 'application/xml');
  }
}

export { DownloadFileSegmentationController };
