import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';

type Input = { fileIds: string[] };

type Deps = {
  ocrDS: OcrRecordDataSource;
};

/**
 * Keeps OCR records in line with deleted files. A record whose result file is deleted has nothing
 * left to show and is deleted; one whose source file is deleted keeps its result and is detached
 * from the source.
 */
class CleanupOcrRecordsOfFiles extends AbstractUseCase<Input, void, Deps> {
  async execute({ fileIds }: Input): Promise<void> {
    const records = await this.deps.ocrDS.getForFiles(fileIds);
    const deleted = new Set(fileIds);

    const resultDeleted = records.filter(
      ({ resultFileId }) => resultFileId !== undefined && deleted.has(resultFileId)
    );
    const sourceDeleted = records.filter(
      record => !resultDeleted.includes(record) && deleted.has(record.sourceFileId ?? '')
    );

    await this.transactionManager.run(async () => {
      await this.deps.ocrDS.delete(resultDeleted.map(({ id }) => id));
      await Promise.all(
        sourceDeleted.map(async record => {
          record.sourceRemoved();
          await this.deps.ocrDS.save(record);
        })
      );
    });
  }
}

export { CleanupOcrRecordsOfFiles };
export type { Input as CleanupOcrRecordsOfFilesInput };
