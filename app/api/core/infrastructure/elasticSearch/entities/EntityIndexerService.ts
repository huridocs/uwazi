/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { Semaphore } from '#api/common.v2/utils/Semaphore.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
import { EntityESWriter } from './EntityESWriter.js';
import { EntityElasticDocumentMapper } from './EntityElasticDocumentMapper.js';
import type { MappedDocument } from './EntityElasticDocumentMapper.js';
import { MongoSlotsDAO } from './MongoSlotsDAO.js';

type EntityIndexerServiceDeps = {
  writer: EntityESWriter;
  entityDAO: MongoEntityDAO;
  slotsDAO: MongoSlotsDAO;
  batchSize?: number;
  maxConcurrentWrites?: number;
};

type EntityBatchInfo = { indexed: number; lastSharedId: string };

type EntitySyncAllOptions = {
  afterSharedId?: string;
  onBatch?: (info: EntityBatchInfo) => void;
};

class EntityIndexerService {
  private static readonly DEFAULT_BATCH_SIZE = 500;

  private static readonly DEFAULT_MAX_CONCURRENT_WRITES = 2;

  constructor(private deps: EntityIndexerServiceDeps) {}

  private get batchSize(): number {
    return this.deps.batchSize ?? EntityIndexerService.DEFAULT_BATCH_SIZE;
  }

  private get maxConcurrentWrites(): number {
    return this.deps.maxConcurrentWrites ?? EntityIndexerService.DEFAULT_MAX_CONCURRENT_WRITES;
  }

  async index(entities: EntityDBO[], refresh = false): Promise<void> {
    const slotMap = await this.deps.slotsDAO.getSlotMap();
    const ops = EntityElasticDocumentMapper.toDocuments(entities, slotMap);
    await this.deps.writer.index(ops, refresh);
  }

  async sync(sharedIds: string[], refresh = false): Promise<void> {
    const chunks = ArrayUtils.splitInChunks(sharedIds, this.batchSize);

    await ArrayUtils.sequentialFor(chunks, async chunk => {
      const entities = await this.deps.entityDAO.findBySharedIds(chunk);
      await this.index(entities, refresh);
    });
  }

  async syncAll(options?: EntitySyncAllOptions, refresh = false): Promise<void> {
    const cursor = this.deps.entityDAO.streamAll({ afterSharedId: options?.afterSharedId });
    const slotMap = await this.deps.slotsDAO.getSlotMap();
    const sem = new Semaphore(this.maxConcurrentWrites);
    const inFlight: Promise<void>[] = [];
    const errors: unknown[] = [];
    let totalIndexed = 0;
    let overflow: EntityDBO | null = null;

    const readBatch = async (): Promise<MappedDocument[]> => {
      const mappedBatch: MappedDocument[] = [];
      let currentGroup: EntityDBO[] = overflow ? [overflow] : [];
      overflow = null;

      while (await cursor.hasNext()) {
        const entity = (await cursor.next())!;

        if (currentGroup.length > 0 && entity.sharedId !== currentGroup[0].sharedId) {
          const [mapped] = EntityElasticDocumentMapper.toDocuments(currentGroup, slotMap);
          if (mapped) mappedBatch.push(mapped);

          if (mappedBatch.length >= this.batchSize) {
            overflow = entity;
            return mappedBatch;
          }

          currentGroup = [entity];
        } else {
          currentGroup.push(entity);
        }
      }

      // cursor exhausted — flush remaining group
      if (currentGroup.length > 0) {
        const [mapped] = EntityElasticDocumentMapper.toDocuments(currentGroup, slotMap);
        if (mapped) mappedBatch.push(mapped);
      }

      return mappedBatch;
    };

    try {
      let batch = await readBatch();
      while (batch.length > 0) {
        totalIndexed += batch.length;
        options?.onBatch?.({ indexed: totalIndexed, lastSharedId: batch.at(-1)!.sharedId });
        await sem.acquire();
        const ops = batch;
        inFlight.push(
          this.deps.writer
            .index(ops, refresh)
            .catch(e => {
              errors.push(e);
            })
            .finally(() => sem.release())
        );
        batch = await readBatch();
      }
    } finally {
      await cursor.close();
    }

    await Promise.allSettled(inFlight);
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, `${errors.length} batch write(s) failed`);
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
