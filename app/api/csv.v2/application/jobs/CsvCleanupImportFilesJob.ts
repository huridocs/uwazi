import path from 'path';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImport, CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport.js';

type Input = {
  importId: string;
};

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  fileStorage: FileStorage;
  transactionManager: TransactionManager;
};

const TERMINAL_STATUSES = new Set<string>([
  CsvImportStatus.Completed,
  CsvImportStatus.ImportEntitiesDone,
  CsvImportStatus.Failed,
  CsvImportStatus.Cancelled,
]);

class CsvCleanupImportFilesJob extends AbstractUseCase<Input, void, Deps> {
  private toStorageAbsolutePath(subpath: string) {
    const pathManager = new PathManager({ tenant: tenants.current() });
    return pathManager.createPath({
      type: 'customPath',
      destination: path.dirname(subpath),
      filename: path.basename(subpath),
    });
  }

  private async setFilesCleanup(importId: string, filesCleanup: 'pending' | 'done' | 'failed') {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withFilesCleanup(csvImport, filesCleanup);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  private buildCleanupPaths(importId: string, csvImport: CsvImport) {
    const paths = new Set<string>();
    if (csvImport.storage?.path) {
      paths.add(csvImport.storage.path);
    }
    if (csvImport.extraction?.files?.length) {
      csvImport.extraction.files.forEach(file => {
        paths.add(`csv-imports/${importId}/extracted/${file.filename}`);
      });
    } else {
      // Fallback for imports where extraction metadata is missing.
      paths.add(`csv-imports/${importId}/extracted/import.csv`);
    }
    return Array.from(paths.values());
  }

  async execute(input: Input): Promise<void> {
    const { importId } = input;
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();

    if (!TERMINAL_STATUSES.has(csvImport.status)) {
      return;
    }
    if (csvImport.filesCleanup === 'done') {
      return;
    }

    try {
      const cleanupPaths = this.buildCleanupPaths(importId, csvImport);
      for (const cleanupPath of cleanupPaths) {
        const absolutePath = this.toStorageAbsolutePath(cleanupPath);
        // eslint-disable-next-line no-await-in-loop
        await this.deps.fileStorage.removeContent(absolutePath);
      }
      await this.setFilesCleanup(importId, 'done');
    } catch (error) {
      await this.setFilesCleanup(importId, 'failed');
      throw error;
    }
  }
}

export { CsvCleanupImportFilesJob };
