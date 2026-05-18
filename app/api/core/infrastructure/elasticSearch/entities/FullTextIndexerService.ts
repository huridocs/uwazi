/* eslint-disable max-statements */
/* eslint-disable no-await-in-loop */
import { ObjectId } from 'mongodb';
import { ProcessedPDFDBO } from '../../mongodb/files/schemas/filesTypes.js';
import { MongoFilesDAO } from '../../mongodb/files/MongoFilesDAO.js';
import { FullTextESWriter } from './FullTextESWriter.js';
import { FullTextElasticDocumentMapper } from './FullTextElasticDocumentMapper.js';
import type { MappedDocument } from './FullTextElasticDocumentMapper.js';
import { Semaphore } from '#api/common.v2/utils/Semaphore.js';

type FullTextIndexerServiceDeps = {
  writer: FullTextESWriter;
  filesDAO: MongoFilesDAO;
  byteThreshold?: number;
  maxConcurrentWrites?: number;
};

type FileBatchInfo = { indexed: number; lastFileId: string; total: number };

type FileSyncAllOptions = {
  afterId?: ObjectId;
  onBatch?: (info: FileBatchInfo) => void;
};

class FullTextIndexerService {
  private static readonly DEFAULT_BYTE_THRESHOLD = 50 * 1024 * 1024; // 50 MB

  private static readonly DEFAULT_MAX_CONCURRENT_WRITES = 2;

  constructor(private deps: FullTextIndexerServiceDeps) {}

  private get byteThreshold(): number {
    return this.deps.byteThreshold ?? FullTextIndexerService.DEFAULT_BYTE_THRESHOLD;
  }

  private get maxConcurrentWrites(): number {
    return this.deps.maxConcurrentWrites ?? FullTextIndexerService.DEFAULT_MAX_CONCURRENT_WRITES;
  }

  async index(files: ProcessedPDFDBO[], refresh = false): Promise<void> {
    const ops = FullTextElasticDocumentMapper.toDocuments(files, this.deps.writer.tenantId);
    await this.deps.writer.index(ops, refresh);
  }

  async syncAll(options?: FileSyncAllOptions, refresh = false): Promise<void> {
    const total = await this.deps.filesDAO.countProcessedDocs();
    const cursor = this.deps.filesDAO.streamProcessedDocs({ afterId: options?.afterId });
    const { tenantId } = this.deps.writer;
    const sem = new Semaphore(this.maxConcurrentWrites);
    const inFlight: Promise<void>[] = [];
    const errors: unknown[] = [];
    let totalIndexed = 0;
    let overflow: MappedDocument | null = null;
    let overflowFileId: string | null = null;

    const readBatch = async (): Promise<{ ops: MappedDocument[]; lastFileId: string | null }> => {
      const ops: MappedDocument[] = [];
      let batchBytes = 0;
      let lastFileId: string | null = null;

      if (overflow !== null) {
        ops.push(overflow);
        batchBytes += Buffer.byteLength(JSON.stringify(overflow.document));
        lastFileId = overflowFileId;
        overflow = null;
        overflowFileId = null;
      }

      while (await cursor.hasNext()) {
        const file = (await cursor.next())!;
        const document = FullTextElasticDocumentMapper.toDocument(file, tenantId);
        // eslint-disable-next-line no-continue
        if (document === null) continue;
        const fileId = (file._id as unknown as ObjectId).toString();
        const op: MappedDocument = { id: `${file.entity}_${fileId}`, document };
        const opBytes = Buffer.byteLength(JSON.stringify(op.document));
        if (ops.length > 0 && batchBytes + opBytes > this.byteThreshold) {
          overflow = op;
          overflowFileId = fileId;
          return { ops, lastFileId };
        }
        ops.push(op);
        batchBytes += opBytes;
        lastFileId = fileId;
      }

      return { ops, lastFileId };
    };

    try {
      let result = await readBatch();
      while (result.ops.length > 0) {
        totalIndexed += result.ops.length;
        options?.onBatch?.({ indexed: totalIndexed, lastFileId: result.lastFileId!, total });
        await sem.acquire();
        const { ops } = result;
        inFlight.push(
          this.deps.writer
            .index(ops, refresh)
            .catch(e => {
              errors.push(e);
            })
            .finally(() => sem.release())
        );
        result = await readBatch();
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

  async sync(fileIds: ObjectId[], refresh = false): Promise<void> {
    if (fileIds.length === 0) return;

    const total = fileIds.length;
    const cursor = this.deps.filesDAO.streamProcessedDocsByIds(fileIds);
    const { tenantId } = this.deps.writer;
    const sem = new Semaphore(this.maxConcurrentWrites);
    const inFlight: Promise<void>[] = [];
    const errors: unknown[] = [];
    let totalIndexed = 0;
    let overflow: MappedDocument | null = null;
    let overflowFileId: string | null = null;

    const readBatch = async (): Promise<{ ops: MappedDocument[]; lastFileId: string | null }> => {
      const ops: MappedDocument[] = [];
      let batchBytes = 0;
      let lastFileId: string | null = null;

      if (overflow !== null) {
        ops.push(overflow);
        batchBytes += Buffer.byteLength(JSON.stringify(overflow.document));
        lastFileId = overflowFileId;
        overflow = null;
        overflowFileId = null;
      }

      while (await cursor.hasNext()) {
        const file = (await cursor.next())!;
        const document = FullTextElasticDocumentMapper.toDocument(file, tenantId);
        // eslint-disable-next-line no-continue
        if (document === null) continue;
        const fileId = (file._id as unknown as ObjectId).toString();
        const op: MappedDocument = { id: `${file.entity}_${fileId}`, document };
        const opBytes = Buffer.byteLength(JSON.stringify(op.document));
        if (ops.length > 0 && batchBytes + opBytes > this.byteThreshold) {
          overflow = op;
          overflowFileId = fileId;
          return { ops, lastFileId };
        }
        ops.push(op);
        batchBytes += opBytes;
        lastFileId = fileId;
      }

      return { ops, lastFileId };
    };

    try {
      let result = await readBatch();
      while (result.ops.length > 0) {
        totalIndexed += result.ops.length;
        await sem.acquire();
        const { ops } = result;
        inFlight.push(
          this.deps.writer
            .index(ops, refresh)
            .catch(e => {
              errors.push(e);
            })
            .finally(() => sem.release())
        );
        result = await readBatch();
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

  async remove(filenames: string[], refresh = false): Promise<void> {
    await this.deps.writer.deleteByFilenames(filenames, refresh);
  }
}

export { FullTextIndexerService };
export type { FullTextIndexerServiceDeps, FileBatchInfo, FileSyncAllOptions };
