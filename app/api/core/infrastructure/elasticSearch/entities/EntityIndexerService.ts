/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
import { EntityESWriter } from './EntityESWriter.js';

type EntityIndexerServiceDeps = {
  writer: EntityESWriter;
  entityDAO: MongoEntityDAO;
  batchSize?: number;
};

type EntityBatchInfo = { indexed: number; lastSharedId: string };

type EntitySyncAllOptions = {
  afterSharedId?: string;
  onBatch?: (info: EntityBatchInfo) => void;
};

class EntityIndexerService {
  private static readonly DEFAULT_BATCH_SIZE = 500;

  constructor(private deps: EntityIndexerServiceDeps) {}

  private get batchSize(): number {
    return this.deps.batchSize ?? EntityIndexerService.DEFAULT_BATCH_SIZE;
  }

  async sync(sharedIds: string[], refresh = false): Promise<void> {
    const chunks = ArrayUtils.splitInChunks(sharedIds, this.batchSize);

    await ArrayUtils.sequentialFor(chunks, async chunk => {
      const entities = await this.deps.entityDAO.findBySharedIds(chunk);
      await this.deps.writer.index(entities, refresh);
    });
  }

  async syncAll(options?: EntitySyncAllOptions, refresh = false): Promise<void> {
    const cursor = this.deps.entityDAO.streamAll({ afterSharedId: options?.afterSharedId });
    let batch: EntityDBO[] = [];
    let prevSharedId: string | undefined;
    let totalIndexed = 0;

    try {
      while (await cursor.hasNext()) {
        const entity = (await cursor.next())!;

        if (entity.sharedId !== prevSharedId && batch.length >= this.batchSize) {
          await this.deps.writer.index(batch, refresh);
          totalIndexed += batch.length;
          options?.onBatch?.({ indexed: totalIndexed, lastSharedId: prevSharedId! });
          batch = [];
        }

        batch.push(entity);
        prevSharedId = entity.sharedId;
      }

      if (batch.length > 0) {
        await this.deps.writer.index(batch, refresh);
        totalIndexed += batch.length;
        options?.onBatch?.({ indexed: totalIndexed, lastSharedId: prevSharedId! });
      }
    } finally {
      await cursor.close();
    }
  }

  async remove(sharedIds: string[], refresh = false): Promise<void> {
    await this.deps.writer.deleteBySharedIds(sharedIds, refresh);
  }

  async removeByTemplateIds(templateIds: string[], refresh = false): Promise<void> {
    await this.deps.writer.deleteByTemplateIds(templateIds, refresh);
  }
}

export { EntityIndexerService };
export type { EntityIndexerServiceDeps, EntityBatchInfo, EntitySyncAllOptions };
