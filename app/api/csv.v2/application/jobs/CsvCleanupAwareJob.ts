import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImport, CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport.js';
import { CsvCleanupImportFilesJobHandler } from '../../infrastructure/jobHandlers/CsvCleanupImportFilesJobHandler.js';

type CleanupAwareDeps = {
  csvImportsDS: CsvImportsDataSource;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
};

abstract class CsvCleanupAwareJob<
  Input,
  Output,
  Deps extends CleanupAwareDeps,
> extends AbstractUseCase<Input, Output, Deps> {
  protected withCleanupPendingIfFailed(csvImport: CsvImport, status: CsvImportStatus) {
    if (status !== CsvImportStatus.Failed) {
      return csvImport;
    }
    return CsvImportDomain.withFilesCleanup(csvImport, 'pending');
  }

  async markAsFailed(importId: string) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const withStatus = CsvImportDomain.withStatus(csvImport, CsvImportStatus.Failed);
      const withFilesCleanup = CsvImportDomain.withFilesCleanup(withStatus, 'pending');
      await this.deps.csvImportsDS.update(withFilesCleanup);
    });
  }

  async shouldDispatchCleanupOnCancelled(importId: string) {
    const csvImportRes = await this.deps.csvImportsDS.getById(importId);
    if (csvImportRes.isError()) {
      return false;
    }
    const csvImport = csvImportRes.getData();
    return csvImport.status === CsvImportStatus.Cancelled && csvImport.filesCleanup === 'pending';
  }

  async shouldDispatchCleanupOnFailed(importId: string) {
    const csvImportRes = await this.deps.csvImportsDS.getById(importId);
    if (csvImportRes.isError()) {
      return false;
    }
    const csvImport = csvImportRes.getData();
    return csvImport.status === CsvImportStatus.Failed && csvImport.filesCleanup === 'pending';
  }

  async dispatchFilesCleanup(importId: string, tenantName: string, userId: string) {
    await this.deps.jobsDispatcher.dispatch(CsvCleanupImportFilesJobHandler, {
      tenantName,
      userId,
      importId,
    });
  }
}

export { CsvCleanupAwareJob };
