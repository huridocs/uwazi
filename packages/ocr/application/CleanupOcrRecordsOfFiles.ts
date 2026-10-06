import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';

type Input = { fileIds: string[] };

type Deps = {
  ocrDS: OcrRecordDataSource;
};

/**
 * Keeps OCR records in line with deleted files. A record left without a file to show — its result
 * deleted, or its source deleted before there was a result — is deleted, and any outcome still to
 * come for it is then ignored. One whose source is deleted keeps its result and is detached from
 * the source.
 */
class CleanupOcrRecordsOfFiles extends AbstractUseCase<Input, void, Deps> {
  async execute({ fileIds }: Input): Promise<void> {
    const records = await this.deps.ocrDS.getForFiles(fileIds);
    const deleted = new Set(fileIds);

    // Every record found has its source or its result among the deleted files.
    const nothingLeft = records.filter(
      ({ resultFileId }) => resultFileId === undefined || deleted.has(resultFileId)
    );
    const detached = records.filter(record => !nothingLeft.includes(record));

    await this.transactionManager.run(async () => {
      await this.deps.ocrDS.delete(nothingLeft.map(({ id }) => id));
      await Promise.all(
        detached.map(async record => {
          record.sourceRemoved();
          await this.deps.ocrDS.save(record);
        })
      );
    });
  }
}

export { CleanupOcrRecordsOfFiles };
export type { Input as CleanupOcrRecordsOfFilesInput };
