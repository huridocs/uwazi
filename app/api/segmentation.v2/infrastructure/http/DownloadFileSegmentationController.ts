import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSegmentationDataSource } from '../mongodb/MongoSegmentationDataSource.js';
import { DownloadFileSegmentation } from '../../application/DownloadFileSegmentation.js';

const requestSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/),
  }),
});

class DownloadFileSegmentationController extends AbstractController {
  protected async handle(): Promise<void> {
    const {
      params: { id },
    } = requestSchema.parse(this.request);

    const transactionManager = TransactionManagerFactory.default();
    const segmentationDS = new MongoSegmentationDataSource(getConnection(), transactionManager);
    const useCase = new DownloadFileSegmentation({
      filesDS: FilesDataSourceFactory.default({ transactionManager }),
      settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      segmentationDS,
    });
    const segmentation = await useCase.execute({ fileId: id });
    this.jsonResponse(segmentation);
  }
}

export { DownloadFileSegmentationController };
