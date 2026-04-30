/* eslint-disable max-statements */
/* eslint-disable no-await-in-loop */
import { ObjectId } from 'mongodb';
import { ProcessedPDFDBO } from '../../mongodb/files/schemas/filesTypes.js';
import { MongoFilesDAO } from '../../mongodb/files/MongoFilesDAO.js';
import { FullTextESWriter } from './FullTextESWriter.js';

type FullTextIndexerServiceDeps = {
  writer: FullTextESWriter;
  filesDAO: MongoFilesDAO;
  batchSize?: number;
};

type FileBatchInfo = { indexed: number; lastFileId: string };

type FileSyncAllOptions = {
  afterId?: ObjectId;
  onBatch?: (info: FileBatchInfo) => void;
};

class FullTextIndexerService {
  private static readonly DEFAULT_BATCH_SIZE = 500;

  constructor(private deps: FullTextIndexerServiceDeps) {}

  private get batchSize(): number {
    return this.deps.batchSize ?? FullTextIndexerService.DEFAULT_BATCH_SIZE;
  }

  async syncAll(options?: FileSyncAllOptions, refresh = false): Promise<void> {
    const cursor = this.deps.filesDAO.streamProcessedDocs({ afterId: options?.afterId });
    let batch: ProcessedPDFDBO[] = [];
    let totalIndexed = 0;

    try {
      while (await cursor.hasNext()) {
        const file = (await cursor.next())!;
        batch.push(file);

        if (batch.length >= this.batchSize) {
          await this.deps.writer.index(batch, refresh);
          totalIndexed += batch.length;
          const lastFileId = (batch[batch.length - 1]._id as unknown as ObjectId).toString();
          options?.onBatch?.({ indexed: totalIndexed, lastFileId });
          batch = [];
        }
      }

      if (batch.length > 0) {
        await this.deps.writer.index(batch, refresh);
        totalIndexed += batch.length;
        const lastFileId = (batch[batch.length - 1]._id as unknown as ObjectId).toString();
        options?.onBatch?.({ indexed: totalIndexed, lastFileId });
      }
    } finally {
      await cursor.close();
    }
  }

  async remove(filenames: string[], refresh = false): Promise<void> {
    await this.deps.writer.deleteByFilenames(filenames, refresh);
  }
}

export { FullTextIndexerService };
export type { FullTextIndexerServiceDeps, FileBatchInfo, FileSyncAllOptions };
